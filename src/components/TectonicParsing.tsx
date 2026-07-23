import React, { useState, useEffect } from 'react';
import { Capa, ParsingStepLog } from '../types';
import { 
  Sliders, Layers, FileText, CheckCircle2, ChevronRight, 
  Activity, Cpu, Sparkles, LogOut, Folder, Download, 
  Plus, AlertTriangle, RefreshCw, FolderOpen, Loader2,
  FileCheck2, Check, Link, Trash2, Settings
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { findSTVFolder, listFolderFiles, createSTVFolder, createDemoFileInFolder, getFileContent, DriveFile, extractFolderId } from '../lib/drive';
import { User } from 'firebase/auth';

interface TectonicParsingProps {
  onAddLog: (newLog: any) => void;
}

export default function TectonicParsing({ onAddLog }: TectonicParsingProps) {
  const [selectedDoc, setSelectedDoc] = useState<'aisc' | 'brand' | 'drive' | 'custom'>('aisc');
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('STV-CustomDoc-01.pdf');
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [parsingResult, setParsingResult] = useState<ParsingStepLog[] | null>(null);
  const [selectedCapaDetail, setSelectedCapaDetail] = useState<number>(5);

  // Google Drive & Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Folder states
  const [isSearchingFolder, setIsSearchingFolder] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [customFolderInput, setCustomFolderInput] = useState(() => localStorage.getItem('stv_gravity_folder_id') || '');
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);

  const capas: Capa[] = [
    { number: 1, name: "Raw Ingestion & Ingestion Index", description: "Registers raw bytes, formats, size, and source metadata into Brain DB.", purpose: "Validate input authenticity", inputDescription: "Raw file binaries", outputDescription: "Ingested registration index" },
    { number: 2, name: "Spatial Segmentation", description: "Performs OCR and page-boundary coordinate mapping, creating visual bounding boxes.", purpose: "Detect layout elements", inputDescription: "Indexed bytes", outputDescription: "Bounding box coordinates" },
    { number: 3, name: "Structural Parsing", description: "Builds a parent-child hierarchical tree mapping headers, body copy, and tables.", purpose: "Establish text relationships", inputDescription: "Visual coordinate blocks", outputDescription: "Structured document tree" },
    { number: 4, name: "Table Extraction & Matrix Alignment", description: "Processes layout cells to extract nested data matrices and assigns logical weights.", purpose: "Isolate structured specs", inputDescription: "Tree layout markers", outputDescription: "Aligned cell data tables" },
    { number: 5, name: "Semantic Chunking", description: "Splits text blocks into custom contextual chunks adjusted by sliding boundary sizes.", purpose: "Context-optimized slicing", inputDescription: "Structured text sheets", outputDescription: "Sized contextual text chunks" },
    { number: 6, name: "Gravitational Tagging", description: "Scores chunks on semantic affinity, mapping them to the three primary Gravitational Nodes.", purpose: "Map domain relevance", inputDescription: "Context chunks", outputDescription: "Affinity coefficients" },
    { number: 7, name: "Neural Vectorization", description: "Generates multidimensional embeddings for exact cosine semantic searches.", purpose: "Map to neural space", inputDescription: "Classified chunks", outputDescription: "1536-dim vector arrays" },
    { number: 8, name: "Relational Gravitational Indexing", description: "Links vectors directly with parametric reference codes inside the Master Matrix.", purpose: "Lock context coordinates", inputDescription: "Vector arrays", outputDescription: "Matrix index links" },
    { number: 9, name: "Oráculo Rule Audit & Anomaly Resolution", description: "Applies rule audits (AISC, AWS, IMCA) and flags compliance anomalies to Human-in-the-Loop.", purpose: "Prevent code violations", inputDescription: "Matrix linked coordinates", outputDescription: "Audit compliance pass/fail" }
  ];

  // Predetermined texts to simulate
  const predocs = {
    aisc: {
      title: "STV-STR-PlateWeldA1.pdf",
      text: "STV Structural Design Sheet. Plate Connection: Grade A36 structural carbon steel. Joint Thickness: 12mm plate width. Connection standard: Fillet weld size 6mm with electrode type E70XX. Compliant with AISC 15th Edition steel guidelines for high lateral stresses."
    },
    brand: {
      title: "STV-VIS-LogoSafetyBuffer.pdf",
      text: "STV Design Studio Brand Guidelines. Color spaces: Principal Slate Black #121214, Primary Accent Gold #D4AF37. Kinetic logo placement is restricted within a 1.618x spatial height boundary of surrounding mechanical structures to ensure focus grid clarity."
    }
  };

  // Auth & Folder listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        handleSearchFolder(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSearchFolder = async (token: string, forceId?: string) => {
    setIsSearchingFolder(true);
    setDriveMessage(null);
    try {
      const savedCustomId = forceId !== undefined ? forceId : localStorage.getItem('stv_gravity_folder_id');
      let activeId = savedCustomId || null;
      if (!activeId) {
        activeId = await findSTVFolder(token);
      }
      setFolderId(activeId);
      if (activeId) {
        await handleFetchFiles(activeId, token);
      } else {
        setDriveFiles([]);
      }
    } catch (err) {
      console.error(err);
      setDriveMessage('Error checking Google Drive files.');
    } finally {
      setIsSearchingFolder(false);
    }
  };

  const handleConnectCustomFolder = async (inputStr: string) => {
    if (!accessToken) return;
    const cleanId = extractFolderId(inputStr);
    if (!cleanId) {
      setDriveMessage("Please input a valid Google Drive Folder ID or Folder Link.");
      return;
    }
    
    setIsSearchingFolder(true);
    setDriveMessage(null);
    try {
      const files = await listFolderFiles(cleanId, accessToken);
      localStorage.setItem('stv_gravity_folder_id', cleanId);
      setFolderId(cleanId);
      setDriveFiles(files);
      setCustomFolderInput(cleanId);
      setDriveMessage("Successfully connected to custom Google Drive folder!");
    } catch (err) {
      console.error(err);
      setDriveMessage("Could not access custom folder. Ensure it is shared with reader access.");
    } finally {
      setIsSearchingFolder(false);
    }
  };

  const handleResetFolder = async () => {
    localStorage.removeItem('stv_gravity_folder_id');
    setCustomFolderInput('');
    if (accessToken) {
      await handleSearchFolder(accessToken, '');
    }
  };

  const handleFetchFiles = async (fId: string, token: string) => {
    setIsLoadingFiles(true);
    try {
      const files = await listFolderFiles(fId, token);
      setDriveFiles(files);
    } catch (err) {
      console.error(err);
      setDriveMessage('Failed to list folder contents.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        await handleSearchFolder(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setFolderId(null);
    setDriveFiles([]);
  };

  const handleCreateSTVFolder = async () => {
    if (!accessToken) return;
    const confirmed = window.confirm(
      "Create a new 'STV gravity engine' folder in Google Drive? This will let you drop engineering and branding sheets to connect with the Gravity Engine."
    );
    if (!confirmed) return;

    setIsCreatingFolder(true);
    setDriveMessage(null);
    try {
      const newId = await createSTVFolder(accessToken);
      setFolderId(newId);
      setDriveMessage("Folder 'STV gravity engine' created successfully.");
      
      // Auto-seed with demo files for instant feedback
      await handleSeedFiles(newId, accessToken);
      await handleFetchFiles(newId, accessToken);
    } catch (err) {
      console.error(err);
      setDriveMessage("Failed to create folder.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSeedFiles = async (fId: string, token: string) => {
    setIsCreatingDemo(true);
    try {
      const demoAISC = `[STV Gravity Operating System - AISC Standard Structural Node]
Spec Code: AISC-S301-G55
Weld Geometry: Fillet weld, 6mm thickness
Material Grade: A36 High-Yield Structural Steel
Weld Electrode: E70XX Carbon Steel Welding

This sheet details the column connection layout under Santi Vilanova's gravity engines.
The clear safety distance is locked at 1.618 ratio to logo spacing boundaries.`;

      const demoBrand = `[STV Gravity Operating System - Visual Brand Grid Fibration]
Vibration Frequency: 0.05 Hz
Mood Space: Slate Charcoal Dark (#121214) with Radiant Gold Accent (#D4AF37)
Aspect Boundary: 16:9 widescreen canvas grid
Logo Clear Margin: 1.618 times primary typographic baseline height.

Avoid overlapping steel blueprints with the safety perimeter.`;

      const demoOps = `[STV Gravity Operating System - Business Operations Matrix]
Parametric Rate: $120.00 per parsing hour
Complexity Ceiling: 1.5 multiplier
Token Gravity Floor: 35% margin threshold
Standard Unit Rate: 0.1 RAG-units increment.

All costs are calculated dynamically under Capa 8 real-time index linkage.`;

      await createDemoFileInFolder(fId, "STV-AISC-StructuralNode.txt", demoAISC, token);
      await createDemoFileInFolder(fId, "STV-BrandVisualFibration.txt", demoBrand, token);
      await createDemoFileInFolder(fId, "STV-BusinessOpsMatrix.txt", demoOps, token);
    } catch (err) {
      console.error("Error seeding files:", err);
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleAdoptAndInspect = async (file: DriveFile) => {
    if (!accessToken) return;
    setIsProcessing(true);
    setProcessingStatus(`Downloading ${file.name} from Google Drive...`);
    try {
      const content = await getFileContent(file.id, file.mimeType, accessToken);
      setCustomTitle(file.name);
      setCustomText(content);
      setSelectedDriveFile(file);
      setSelectedDoc('drive');
      setDriveMessage(`Loaded: ${file.name}`);
    } catch (err) {
      console.error(err);
      setDriveMessage(`Failed to read file: ${file.name}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleSimulateParsing = async () => {
    setIsProcessing(true);
    setParsingResult(null);
    setSelectedCapaDetail(1);

    let title = "";
    let text = "";

    if (selectedDoc === 'custom') {
      title = customTitle;
      text = customText;
    } else if (selectedDoc === 'drive') {
      title = selectedDriveFile ? selectedDriveFile.name : "GoogleDrive:STV-CustomDoc.txt";
      text = customText || "No Google Drive file currently loaded. Please select a file from the list.";
    } else {
      title = predocs[selectedDoc].title;
      text = predocs[selectedDoc].text;
    }

    try {
      // Step-by-step animation of 9 capas
      for (let i = 1; i <= 9; i++) {
        setActiveStep(i);
        setProcessingStatus(`Tectonic Layer ${i} Processing...`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setProcessingStatus("Generating deep neural audit coordinates...");

      // Call API
      const response = await fetch('/api/gravity/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: title,
          documentText: text,
          chunkSize,
          overlap
        })
      });

      if (response.ok) {
        const data = await response.json();
        setParsingResult(data.steps);
        setSelectedCapaDetail(5); // focus on chunking
        onAddLog(data.logCreated);
        setProcessingStatus(null);
      } else {
        throw new Error("Pipeline API returned an error status.");
      }
    } catch (err) {
      console.error("Error during pipeline parse:", err);
      setProcessingStatus("Error: Tectonic pipeline disrupted.");
    } finally {
      setIsProcessing(false);
      setActiveStep(null);
    }
  };

  // Helper to estimate active chunk count and token breakdown
  const getDocumentLength = () => {
    if (selectedDoc === 'custom') return customText.length;
    if (selectedDoc === 'drive') return customText.length;
    return predocs[selectedDoc].text.length;
  };

  const documentLength = getDocumentLength();
  const rawContentTokens = Math.max(10, Math.floor(documentLength / 3.8));
  const dynamicChunkTokens = Math.floor(rawContentTokens * (500 / chunkSize));
  const dynamicOverlapOverhead = Math.floor(dynamicChunkTokens * (overlap / 100));
  const matrixAnchorTokens = 85;
  const totalSimulatedTokens = dynamicChunkTokens + dynamicOverlapOverhead + matrixAnchorTokens + 110;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="tectonic-parsing-tab">
      
      {/* Column 1: Configurator and File Input */}
      <div className="col-span-1 space-y-6">
        <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-gold" /> Pipeline Ingestion Config
          </h3>

          <div className="space-y-3">
            <label className="text-xs font-mono text-gray-400 block uppercase">Select Ingestion Template</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedDoc('aisc')}
                className={`py-2 px-3 text-[11px] font-medium rounded-lg border transition ${
                  selectedDoc === 'aisc'
                    ? 'bg-brand-gold/10 border-brand-gold text-white'
                    : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                AISC Structural
              </button>
              <button
                onClick={() => setSelectedDoc('brand')}
                className={`py-2 px-3 text-[11px] font-medium rounded-lg border transition ${
                  selectedDoc === 'brand'
                    ? 'bg-brand-gold/10 border-brand-gold text-white'
                    : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Visual Brand
              </button>
              <button
                onClick={() => {
                  setSelectedDoc('drive');
                  if (driveFiles.length > 0 && !selectedDriveFile) {
                    handleAdoptAndInspect(driveFiles[0]);
                  }
                }}
                className={`py-2 px-3 text-[11px] font-medium rounded-lg border transition flex items-center justify-center gap-1.5 ${
                  selectedDoc === 'drive'
                    ? 'bg-brand-gold/10 border-brand-gold text-white'
                    : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Folder className="h-3 w-3 text-brand-gold" /> Google Drive
              </button>
              <button
                onClick={() => setSelectedDoc('custom')}
                className={`py-2 px-3 text-[11px] font-medium rounded-lg border transition ${
                  selectedDoc === 'custom'
                    ? 'bg-brand-gold/10 border-brand-gold text-white'
                    : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Custom Ingress
              </button>
            </div>
          </div>

          {/* GOOGLE DRIVE INGESTION SUITE */}
          {selectedDoc === 'drive' && (
            <div className="space-y-4 animate-fadeIn pt-1 border-t border-brand-slate-light/30">
              {needsAuth ? (
                <div className="text-center p-4 rounded-lg bg-brand-slate-dark/60 border border-brand-slate-light/40 space-y-3">
                  <FolderOpen className="h-8 w-8 text-gray-500 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">Google Drive Integration Required</h4>
                    <p className="text-[10px] text-gray-400">
                      Connect your Google Drive securely to load files from the <span className="text-brand-gold">STV gravity engine</span> folder.
                    </p>
                  </div>
                  
                  {/* Official Standard Lookalike Google Sign-In Button */}
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="gsi-material-button w-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition"
                    style={{
                      background: 'white',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      color: '#3c4043',
                      fontSize: '12px',
                      fontWeight: '500',
                      height: '38px',
                      padding: '0 16px',
                    }}
                  >
                    {isLoggingIn ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '18px', height: '18px' }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>Sign in with Google</span>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Signed In Header */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-brand-slate-dark/40 border border-brand-slate-light/30">
                    <div className="flex items-center gap-2">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="user" className="h-6 w-6 rounded-full referrer-policy='no-referrer'" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-[10px] text-brand-gold font-bold">
                          {user?.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="truncate max-w-[120px]">
                        <span className="text-[10px] font-semibold text-white block truncate">{user?.displayName}</span>
                        <span className="text-[9px] text-gray-400 block truncate">{user?.email}</span>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="p-1 hover:bg-red-500/10 rounded group transition">
                      <LogOut className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-400" />
                    </button>
                  </div>

                  {/* CUSTOM FOLDER INTEGRATION SUITE */}
                  <div className="p-3 rounded-lg bg-brand-slate-dark/30 border border-brand-slate-light/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Settings className="h-3 w-3 text-brand-gold" /> Custom Folder Link / ID
                      </span>
                      {localStorage.getItem('stv_gravity_folder_id') && (
                        <button 
                          onClick={handleResetFolder}
                          className="text-red-400 hover:text-red-300 text-[9px] font-mono flex items-center gap-0.5"
                          title="Reset to default folder search"
                        >
                          <Trash2 className="h-2.5 w-2.5" /> Clear Override
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Paste Folder ID or Google Drive URL..."
                        value={customFolderInput}
                        onChange={(e) => setCustomFolderInput(e.target.value)}
                        className="flex-1 bg-brand-slate-dark border border-gray-700 rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-brand-gold"
                      />
                      <button
                        onClick={() => handleConnectCustomFolder(customFolderInput)}
                        className="px-2.5 py-1 bg-brand-gold hover:bg-yellow-400 text-brand-slate-dark font-mono font-semibold text-[10px] rounded transition flex items-center gap-1 shrink-0"
                      >
                        <Link className="h-3 w-3" /> Connect
                      </button>
                    </div>
                    <p className="text-[8px] text-gray-400 leading-normal">
                      Connect any shared Google Drive folder (like <span className="text-gray-300 select-all font-semibold">1siDxv0fZgNIM2BE9J13-3L8tJ4ocS9rT</span>) to adopt files instantly.
                    </p>
                  </div>

                  {/* Folder ID Detection & Creation Block */}
                  {isSearchingFolder ? (
                    <div className="flex items-center justify-center py-4 text-xs text-gray-400 gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                      <span>Scanning Drive for 'STV gravity engine' folder...</span>
                    </div>
                  ) : !folderId ? (
                    <div className="p-3 rounded-lg bg-amber-950/15 border border-amber-900/30 space-y-3 text-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" />
                      <div>
                        <h5 className="text-[11px] font-semibold text-amber-300">STV Folder Not Found</h5>
                        <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                          We didn't locate an active <span className="text-white font-semibold">"STV gravity engine"</span> folder in your Google Drive root. Let us build and seed one for you!
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleCreateSTVFolder}
                          disabled={isCreatingFolder}
                          className="flex-1 py-1.5 bg-brand-gold text-brand-slate-dark font-semibold text-[10px] uppercase rounded-lg hover:bg-yellow-400 flex items-center justify-center gap-1 transition"
                        >
                          {isCreatingFolder ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Create Folder
                        </button>
                        <button 
                          onClick={() => accessToken && handleSearchFolder(accessToken)}
                          className="px-2 bg-brand-slate-dark text-gray-300 border border-gray-700 rounded-lg hover:border-gray-600"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Folder Connected Header */}
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-gray-400 uppercase flex items-center gap-1.5">
                          <Folder className="h-3 w-3 text-brand-gold" /> Connected STV Directory
                        </span>
                        <button 
                          onClick={() => accessToken && handleFetchFiles(folderId, accessToken)}
                          disabled={isLoadingFiles}
                          className="text-brand-gold hover:underline flex items-center gap-1"
                        >
                          {isLoadingFiles ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                          Refresh
                        </button>
                      </div>

                      {/* File Ingestion List */}
                      <div className="bg-brand-slate-dark border border-brand-slate-light rounded-lg divide-y divide-brand-slate-light max-h-[160px] overflow-y-auto">
                        {driveFiles.length === 0 ? (
                          <div className="p-4 text-center text-[10px] text-gray-400 space-y-2">
                            <span>No files in 'STV gravity engine' folder.</span>
                            <button
                              onClick={() => handleSeedFiles(folderId, accessToken!)}
                              disabled={isCreatingDemo}
                              className="mx-auto block py-1 px-2.5 bg-brand-gold/10 hover:bg-brand-gold/25 text-brand-gold font-semibold uppercase rounded text-[9px] border border-brand-gold/20"
                            >
                              {isCreatingDemo ? "Seeding Files..." : "Seed Demo Blueprint Sheets"}
                            </button>
                          </div>
                        ) : (
                          driveFiles.map((file) => {
                            const isSelected = selectedDriveFile?.id === file.id;
                            return (
                              <div key={file.id} className={`p-2 flex items-center justify-between text-[10px] font-mono transition ${isSelected ? 'bg-brand-gold/5' : 'hover:bg-brand-slate-light/20'}`}>
                                <div className="truncate max-w-[130px]">
                                  <span className="text-white font-semibold block truncate leading-tight">{file.name}</span>
                                  <span className="text-[8px] text-gray-400 block mt-0.5">
                                    {file.size ? `${(parseInt(file.size)/1024).toFixed(1)} KB` : 'Doc/Sheet'} • {new Date(file.modifiedTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleAdoptAndInspect(file)}
                                  className={`px-2 py-1 rounded text-[9px] font-semibold uppercase transition ${
                                    isSelected 
                                      ? 'bg-brand-gold text-brand-slate-dark' 
                                      : 'bg-brand-slate-medium border border-gray-700 text-gray-300 hover:border-gray-500'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Adopt'}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {driveMessage && (
                    <div className="text-[10px] text-brand-gold font-mono p-1.5 rounded bg-brand-slate-dark/40 border border-brand-slate-light/20">
                      ℹ️ {driveMessage}
                    </div>
                  )}

                  {/* Adopted Preview */}
                  {selectedDriveFile && selectedDoc === 'drive' && (
                    <div className="p-3 bg-brand-gold/5 border border-brand-gold/30 rounded-lg space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase text-brand-gold flex items-center gap-1">
                          <FileCheck2 className="h-3 w-3" /> Active Document Source
                        </span>
                        <a 
                          href={selectedDriveFile.webViewLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[9px] text-gray-400 hover:text-white underline font-mono"
                        >
                          Open in Drive
                        </a>
                      </div>
                      <p className="text-xs text-white font-mono font-bold truncate">
                        {selectedDriveFile.name}
                      </p>
                      <div className="h-20 overflow-y-auto p-1.5 bg-brand-slate-dark rounded text-[9px] font-mono text-gray-400 border border-brand-slate-light/50">
                        {customText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedDoc === 'custom' && (
            <div className="space-y-3 animate-fadeIn">
              <div>
                <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Document Text Payload</label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste mechanical specs, color matrices, or structural parameters here..."
                  className="w-full h-28 text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold font-mono resize-none"
                />
              </div>
            </div>
          )}

          {selectedDoc !== 'custom' && selectedDoc !== 'drive' && (
            <div className="bg-brand-slate-dark/50 border border-brand-slate-light p-3 rounded-lg space-y-1">
              <span className="text-[10px] font-mono uppercase text-brand-gold">Pre-loaded Payload</span>
              <p className="text-xs text-gray-300 italic font-mono leading-relaxed">
                "{predocs[selectedDoc].text}"
              </p>
            </div>
          )}

          {/* Slicing Parameter Sliders */}
          <div className="space-y-4 pt-2 border-t border-brand-slate-light/50">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400 uppercase">Capa 5: Chunk Size</span>
                <span className="text-white font-semibold">{chunkSize} chars</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400 uppercase">Chunk Overlap</span>
                <span className="text-white font-semibold">{overlap}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={overlap}
                onChange={(e) => setOverlap(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          </div>

          <button
            onClick={handleSimulateParsing}
            disabled={isProcessing || (selectedDoc === 'drive' && !selectedDriveFile)}
            className={`w-full py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              isProcessing
                ? 'bg-brand-slate-light text-gray-500 cursor-not-allowed border border-gray-700'
                : (selectedDoc === 'drive' && !selectedDriveFile)
                ? 'bg-brand-slate-dark text-gray-600 border border-gray-800 cursor-not-allowed'
                : 'bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 shadow-md shadow-brand-gold/10'
            }`}
          >
            {isProcessing ? (processingStatus || 'Tectonic Ingestion Active...') : 'Simulate 9-Layer Parse'}
          </button>
        </div>

        {/* Dynamic Token Addition Calculator Box */}
        <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-brand-gold" /> Token Accumulator Formula
          </h3>
          <p className="text-xs text-gray-400">
            See exactly how "tokens are being added" as you modify chunk sizes and overlap parameters:
          </p>

          <div className="space-y-2 font-mono text-[11px] bg-brand-slate-dark/60 border border-brand-slate-light p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Chunks Ingestion:</span>
              <span className="text-white">{dynamicChunkTokens} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Overlap Redundancy ({overlap}%):</span>
              <span className="text-white">+{dynamicOverlapOverhead} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Brain DB Coordinates:</span>
              <span className="text-white">+{matrixAnchorTokens} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Audit Rule Overhead:</span>
              <span className="text-white">+110 tokens</span>
            </div>
            <div className="flex justify-between border-t border-brand-slate-light/60 pt-2 font-semibold">
              <span className="text-brand-gold">Total Added weight:</span>
              <span className="text-amber-400">{totalSimulatedTokens} tokens</span>
            </div>
          </div>

          <div className="flex gap-2 p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-900/40 text-[10px] text-yellow-300 font-mono">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Larger chunks preserve broader semantic context, but increase the RAG coordinate gravity pull.
            </span>
          </div>
        </div>
      </div>

      {/* Column 2: Capas 1-9 Timeline */}
      <div className="col-span-1 rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-gold" /> Tectonic Parsing Layers
            </h3>
            <span className="text-[10px] font-mono text-gray-400">Capa 1 to Capa 9</span>
          </div>

          <div className="space-y-2">
            {capas.map((capa) => {
              const isActive = activeStep === capa.number;
              const isCompleted = parsingResult !== null || (activeStep !== null && activeStep > capa.number);
              const isSelected = selectedCapaDetail === capa.number;

              return (
                <button
                  key={capa.number}
                  onClick={() => setSelectedCapaDetail(capa.number)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition ${
                    isSelected
                      ? 'bg-brand-gold/15 border-brand-gold'
                      : 'bg-brand-slate-dark/75 border-brand-slate-light hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isActive 
                        ? 'bg-brand-gold text-brand-slate-dark animate-pulse'
                        : isCompleted
                        ? 'bg-brand-gold/25 text-brand-gold border border-brand-gold/50'
                        : 'bg-brand-slate-light text-gray-400'
                    }`}>
                      {capa.number}
                    </span>
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-white block">
                        Capa {capa.number}
                      </span>
                      <span className="text-[10px] text-gray-400 line-clamp-1">
                        {capa.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-brand-gold" />}
                    <ChevronRight className="h-3 w-3 text-gray-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Column 3: Detailed Capa Output Inspection */}
      <div className="col-span-1 rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 flex flex-col justify-between">
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Capa {selectedCapaDetail} Metadata Inspection
            </h3>
            <span className="text-[10px] font-mono text-brand-gold uppercase">JSON payload output</span>
          </div>

          {/* Layer description */}
          <div className="p-3.5 rounded-lg bg-brand-slate-dark/40 border border-brand-slate-light space-y-2">
            <span className="text-[10px] font-mono text-gray-400 uppercase block">Layer Objective</span>
            <p className="text-xs text-white leading-relaxed font-sans">
              {capas[selectedCapaDetail - 1].description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1.5 border-t border-brand-slate-light/40">
              <div>
                <span className="text-gray-400 block">Ingestion Form:</span>
                <span className="text-brand-gold">{capas[selectedCapaDetail - 1].inputDescription}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Compiled Form:</span>
                <span className="text-brand-gold">{capas[selectedCapaDetail - 1].outputDescription}</span>
              </div>
            </div>
          </div>

          {/* Parsed JSON result console */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">Capa Output</span>
            <div className="flex-1 bg-brand-slate-dark border border-brand-slate-light rounded-lg p-3 font-mono text-[10px] text-green-400 overflow-y-auto max-h-[300px]">
              {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-pulse space-y-2 py-10">
                  <Activity className="h-6 w-6 text-brand-gold animate-spin" />
                  <span>Slicing, segmenting, and linking Capas...</span>
                </div>
              ) : parsingResult ? (
                <pre className="whitespace-pre-wrap">{parsingResult[selectedCapaDetail - 1].output}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-center py-10">
                  <span>Trigger "Simulate 9-Layer Parse" to ingest the file metadata blocks.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
