import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  FolderOpen, Loader2, FileText, Check, AlertTriangle, 
  HelpCircle, LogOut, RefreshCw, Plus, FileEdit
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { 
  findSTVFolder, listFolderFiles, createSTVFolder, 
  createDemoFileInFolder, getFileContent, DriveFile, extractFolderId 
} from '../lib/drive';

interface HubIngestaProps {
  onIngestText: (title: string, text: string) => void;
  isProcessing: boolean;
  accessToken: string | null;
  user: User | null;
  needsAuth: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setNeedsAuth: (needsAuth: boolean) => void;
  neuralPath?: string;
}

export default function HubIngesta({ 
  onIngestText, 
  isProcessing,
  accessToken,
  user,
  needsAuth,
  setAccessToken,
  setUser,
  setNeedsAuth,
  neuralPath = 'balanced-equilibrium'
}: HubIngestaProps) {
  // Local state
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [customFolderInput, setCustomFolderInput] = useState(() => localStorage.getItem('stv_gravity_folder_id') || '');
  const [isSearchingFolder, setIsSearchingFolder] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual Ingestion Sandbox state
  const [isManualMode, setIsManualMode] = useState(false);
  const [sandboxTitle, setSandboxTitle] = useState('STV-MANUAL-SPEC-01.docx');
  const [sandboxText, setSandboxText] = useState(
    "AISC STEEL COMPLIANCE DETAILS:\nMaterial Grade: A36 Carbon Steel\nColumn Profile: W12x53 eccentric loading wide-flange\nConnection spec: Fillet weld of 6mm on 12mm thickness joint connection plate.\n\nSANTI VILANOVA BRAND GUIDELINES:\nColor scheme: Slate Black #121214 with Matte Yellow boundaries #E5C158.\nVisual frequency grid: Periodic vibration coefficient locked at 0.05 Hz."
  );

  // Sync sandbox seeds with the active descending neural pathway
  useEffect(() => {
    if (neuralPath === 'steel-overload') {
      setSandboxTitle("STV-AUTO-AISC-PlateWeld.docx");
      setSandboxText("STV Technical Ingestion Sheet.\nSteel wide-flange parameters.\nConnection type: Fillet weld size 5mm (violations test).\nThickness: 12mm plate assembly.\nStandard: AWS D1.1 / AISC.\nPrimary overload factor: 1.45.");
    } else if (neuralPath === 'brand-expression') {
      setSandboxTitle("STV-Visual-Kinetic-Spine.docx");
      setSandboxText("Santi Vilanova Visual Matrix.\nAspect Ratio: 1.618 golden proportion.\nFibration Periodic wave oscillation frequency: 0.18 Hz (high speed check).\nPalette: Slate-Charcoal with chartreuse sparks.\nVisual pull: 1.35.");
    } else if (neuralPath === 'profit-maximization') {
      setSandboxTitle("STV-Financial-Margin-Floor.docx");
      setSandboxText("STV Financial Performance Plan.\nStandard Base Fee Rate: $120/hour.\nMargin floor: 35% margin floor constraint.\nCorporate structural scale parameter: Cost optimized.\nBusiness attractor pull: 1.50.");
    } else {
      setSandboxTitle("STV-MANUAL-SPEC-01.docx");
      setSandboxText("AISC STEEL COMPLIANCE DETAILS:\nMaterial Grade: A36 Carbon Steel\nColumn Profile: W12x53 eccentric loading wide-flange\nConnection spec: Fillet weld of 6mm on 12mm thickness joint connection plate.\n\nSANTI VILANOVA BRAND GUIDELINES:\nColor scheme: Slate Black #121214 with Matte Yellow boundaries #E5C158.\nVisual frequency grid: Periodic vibration coefficient locked at 0.05 Hz.");
    }
  }, [neuralPath]);

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

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        await handleSearchFolder(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to authenticate Google Workspace account.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setDriveFiles([]);
      setFolderId(null);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchFolder = async (token: string, forcedId?: string) => {
    setIsSearchingFolder(true);
    setErrorMessage(null);
    try {
      const targetId = forcedId !== undefined ? forcedId : localStorage.getItem('stv_gravity_folder_id');
      let activeId = targetId || null;
      
      if (!activeId) {
        activeId = await findSTVFolder(token);
        if (!activeId) {
          activeId = await createSTVFolder(token);
          localStorage.setItem('stv_gravity_folder_id', activeId);
          setCustomFolderInput(activeId);
        }
      }
      
      setFolderId(activeId);
      if (activeId) {
        await handleFetchFiles(activeId, token);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error locating target STV Drive directory.");
    } finally {
      setIsSearchingFolder(false);
    }
  };

  const handleFetchFiles = async (fId: string, token: string) => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const files = await listFolderFiles(fId, token);
      setDriveFiles(files);
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not list Google Drive documents in folder.");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!accessToken) return;
    setIsCreatingFolder(true);
    setErrorMessage(null);
    try {
      const newId = await createSTVFolder(accessToken);
      setFolderId(newId);
      localStorage.setItem('stv_gravity_folder_id', newId);
      setCustomFolderInput(newId);
      await handleFetchFiles(newId, accessToken);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not create 'STV gravity engine' folder.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateDemoDocs = async () => {
    if (!accessToken || !folderId) return;
    setIsCreatingDemo(true);
    setErrorMessage(null);
    try {
      // 1. Google Doc Demo for AISC Specifications
      const aiscTitle = "AISC-Structural-Joint-Specs.docx";
      const aiscContent = `STV Structural Specification Report
Document Reference: SEC-AISC-105-V1
Category: Structural Core

ENGINEERING AUDIT SPECIFICATIONS:
* Column Element: Wide flange steel column W12x53.
* Material: ASTM A36 Steel (Yield stress: 36 ksi).
* Base Plate Joint Connection: 12mm thickness joint plates.
* Weld Joint: Fillet weld thickness of 6mm, matching AWS D1.1 table minimum requirements.
* Electrode type: E70XX low-hydrogen electrodes.`;

      // 2. Google Doc Demo for Vilanova Brand Guide
      const brandTitle = "STV-Branding-Neuro-Fibration.docx";
      const brandContent = `Santi Vilanova Generative Branding Dossier
Document Reference: VIS-BRAND-V3
Category: Visual Engine

NEURO-CHROMATIC FIDELITY CRITERIA:
* Palette: Slate-Charcoal (#121214) and Deep Gold (#E5C158).
* Fibration Modulation: Periodic background grid sway must oscilate at exactly 0.05 Hz frequency.
* Visual Amplitude bounds: Maximum 25px offset limits.
* Logo clear space rule: Maintain a minimum 1.618x logo height buffer zones from structural drawing vector lines to avoid visual noise.`;

      await createDemoFileInFolder(folderId, aiscTitle, aiscContent, accessToken);
      await createDemoFileInFolder(folderId, brandTitle, brandContent, accessToken);
      
      await handleFetchFiles(folderId, accessToken);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to deploy demo Google Docs to Drive.");
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleSaveCustomFolder = () => {
    const extractedId = extractFolderId(customFolderInput);
    if (extractedId) {
      localStorage.setItem('stv_gravity_folder_id', extractedId);
      setFolderId(extractedId);
      if (accessToken) {
        handleSearchFolder(accessToken, extractedId);
      }
    } else {
      localStorage.removeItem('stv_gravity_folder_id');
      setFolderId(null);
      if (accessToken) {
        handleSearchFolder(accessToken, '');
      }
    }
  };

  const handleIngestSelectedFile = async () => {
    if (!selectedFile || !accessToken) return;
    setErrorMessage(null);
    try {
      const content = await getFileContent(selectedFile.id, selectedFile.mimeType, accessToken);
      onIngestText(selectedFile.name, content);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to ingest Google Doc: ${err.message || err}`);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#2D2D2D] p-6 rounded-none relative overflow-hidden" id="hub-ingestion">
      {/* Dynamic Zone Delimitation */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E5C158]" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="industry-ultra-italic-mono text-xs text-[#1A3A4B] block">PHASE 01 / INGESTION COORD</span>
          <h2 className="industry-ultra-italic text-3xl text-black leading-none mt-1">
            [ HUB 01 : INGESTA_NEURAL ]
          </h2>
          <p className="text-xs text-gray-600 font-mono italic mt-1">
            Browse and sync live Google Docs, Sheets, and PDFs from your Drive folder to Gravity's core.
          </p>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={() => setIsManualMode(!isManualMode)}
          className="border-2 border-[#2D2D2D] px-4 py-1.5 text-xs font-mono uppercase font-bold flex items-center gap-2 hover:bg-[#FDF9ED] transition"
        >
          {isManualMode ? (
            <>
              <FolderOpen className="h-3.5 w-3.5 text-[#E5C158]" /> Switch to Google Drive
            </>
          ) : (
            <>
              <FileEdit className="h-3.5 w-3.5 text-cyan-500" /> Switch to Sandbox Editor
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700 font-mono mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MANUAL INGESTION SANDBOX EDITOR */}
      {isManualMode ? (
        <div className="space-y-4">
          <div className="bg-[#FDF9ED] border border-[#E5C158] p-4 text-xs font-mono text-gray-700 leading-relaxed mb-2">
            <strong className="text-[#B2902C] uppercase">[SANDBOX OPERATOR CONSOLE]</strong> Write or paste custom specifications (welds, branding, costs) below to inject directly into the Gravity neuronal stream without calling external networks.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-[10px] font-mono font-bold uppercase text-[#1A3A4B] block mb-1">Dossier Name</label>
              <input
                type="text"
                value={sandboxTitle}
                onChange={(e) => setSandboxTitle(e.target.value)}
                className="w-full bg-[#FFFFFF] border-2 border-[#2D2D2D] px-3 py-2 text-xs font-mono text-black focus:outline-none focus:border-[#7FFF00]"
              />
              
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Preset Seeds</span>
                <button
                  onClick={() => {
                    setSandboxTitle("STV-AUTO-AISC-PlateWeld.docx");
                    setSandboxText("STV Technical Ingestion Sheet.\nSteel wide-flange parameters.\nConnection type: Fillet weld size 5mm (violations test).\nThickness: 12mm plate assembly.\nStandard: AWS D1.1 / AISC.");
                  }}
                  className="w-full text-left text-[10px] font-mono border border-gray-300 p-2 hover:bg-gray-50 transition block"
                >
                  ⚠️ Joint weld 5mm (Violations trigger)
                </button>
                <button
                  onClick={() => {
                    setSandboxTitle("STV-Visual-Kinetic-Spine.docx");
                    setSandboxText("Santi Vilanova Visual Matrix.\nAspect Ratio: 1.618 golden proportion.\nFibration Periodic wave oscillation frequency: 0.18 Hz (high speed check).\nPalette: Slate-Charcoal with chartreuse sparks.");
                  }}
                  className="w-full text-left text-[10px] font-mono border border-gray-300 p-2 hover:bg-gray-50 transition block"
                >
                  🎨 Kinetic Fibration Core
                </button>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col">
              <label className="text-[10px] font-mono font-bold uppercase text-[#1A3A4B] block mb-1">Payload Content Text</label>
              <textarea
                value={sandboxText}
                onChange={(e) => setSandboxText(e.target.value)}
                rows={8}
                className="w-full flex-1 bg-[#FFFFFF] border-2 border-[#2D2D2D] p-3 text-xs font-mono text-black focus:outline-none focus:border-[#7FFF00]"
              />
              
              <button
                onClick={() => onIngestText(sandboxTitle, sandboxText)}
                disabled={isProcessing || !sandboxText.trim()}
                className="mt-3 w-full bg-[#2D2D2D] hover:bg-[#111111] text-[#7FFF00] disabled:bg-gray-300 disabled:text-gray-500 font-display font-black text-xs py-3 uppercase tracking-wider transition border-2 border-[#2D2D2D]"
              >
                {isProcessing ? "PROCESSING INTEL MATRIX..." : "[ INYECTAR TEXTO EN LA RED ]"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GOOGLE DRIVE SYNC WORKFLOW */
        <div className="space-y-4">
          {needsAuth ? (
            <div className="border-2 border-dashed border-[#E5C158] p-8 text-center bg-[#FDF9ED] flex flex-col items-center justify-center">
              <FolderOpen className="h-10 w-10 text-[#E5C158] mb-3" />
              <h3 className="font-display font-bold text-lg text-black uppercase mb-1">AUTHORIZE GOOGLE WORKSPACE DRIVE & DOCS</h3>
              <p className="text-xs text-gray-600 max-w-md font-mono mb-5">
                Review the secure popup window to grant Gravity access to your Google Drive directory. This will let you load actual Google Docs content into our neural audit layers, with permission from the app's users.
              </p>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="bg-[#2D2D2D] text-[#7FFF00] px-8 py-3.5 font-display font-bold text-xs uppercase tracking-wider border-2 border-black hover:bg-black transition flex items-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> AUTHENTICATING...
                  </>
                ) : (
                  "[ SINCRO CON MI CUENTA GOOGLE ]"
                )}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Folder Connection Details */}
              <div className="col-span-1 border-r border-[#2D2D2D]/20 pr-0 lg:pr-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#2D2D2D]/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7FFF00] animate-pulse" />
                    <span className="text-xs font-mono font-bold text-black truncate max-w-[130px]">{user?.email}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] font-mono text-red-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <LogOut className="h-3 w-3" /> SALIR
                  </button>
                </div>

                {/* Directory parameters */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 font-bold block mb-1">
                      Folder ID / Custom Target
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customFolderInput}
                        onChange={(e) => setCustomFolderInput(e.target.value)}
                        placeholder="Automatic (STV Folder)"
                        className="flex-1 bg-[#FFFFFF] border border-[#2D2D2D] px-2.5 py-1.5 text-xs font-mono text-black focus:outline-none"
                      />
                      <button
                        onClick={handleSaveCustomFolder}
                        className="bg-[#2D2D2D] text-white px-3 text-xs font-mono uppercase font-bold hover:bg-black"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#EAF2F5] border border-cyan-200 p-3 text-[10px] font-mono text-[#0F2D3A] rounded">
                    <strong>Drive Directory ID:</strong><br />
                    <span className="select-all block break-all font-mono text-[9px] mt-1 bg-white/70 p-1 border border-cyan-100">
                      {folderId || "Searching or not created..."}
                    </span>
                  </div>

                  {!folderId && (
                    <button
                      onClick={handleCreateFolder}
                      disabled={isCreatingFolder}
                      className="w-full bg-[#E5C158] hover:bg-yellow-500 text-black font-mono font-bold text-xs py-2 uppercase transition flex items-center justify-center gap-1.5"
                    >
                      {isCreatingFolder ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      CREAR FOLDER 'STV gravity engine'
                    </button>
                  )}

                  {folderId && (
                    <div className="pt-2 space-y-2">
                      <button
                        onClick={handleCreateDemoDocs}
                        disabled={isCreatingDemo}
                        className="w-full border border-[#2D2D2D] hover:bg-[#FDF9ED] text-black font-mono font-bold text-[10px] py-1.5 uppercase transition flex items-center justify-center gap-1.5"
                      >
                        {isCreatingDemo ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        DEPLOY DEMO DOCS TO DRIVE
                      </button>
                      <button
                        onClick={() => accessToken && handleFetchFiles(folderId, accessToken)}
                        disabled={isLoadingFiles}
                        className="w-full bg-[#2D2D2D] hover:bg-black text-[#7FFF00] font-mono font-bold text-[10px] py-1.5 uppercase transition flex items-center justify-center gap-1.5"
                      >
                        {isLoadingFiles ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        SYNC DRIVE DOCUMENTS
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Files list */}
              <div className="lg:col-span-2 space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#1A3A4B] font-bold block">
                  Synchronized Google Docs & Drive Files:
                </span>
                
                <div className="border border-[#2D2D2D] min-h-[180px] max-h-[220px] overflow-y-auto bg-white divide-y divide-[#2D2D2D]/10">
                  {isLoadingFiles ? (
                    <div className="p-12 text-center text-xs font-mono text-gray-500 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#E5C158]" />
                      <span>Reading Drive folder file metadata...</span>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-gray-500">
                      Folder is empty. Click "Deploy Demo Docs" to populate two high-fidelity Google Docs.
                    </div>
                  ) : (
                    driveFiles.map((file) => {
                      const isDoc = file.mimeType === 'application/vnd.google-apps.document';
                      const isSelected = selectedFile?.id === file.id;
                      
                      return (
                        <button
                          key={file.id}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left p-3 flex items-center justify-between hover:bg-gray-50 transition text-xs font-mono ${
                            isSelected ? 'bg-[#FDF9ED] border-l-4 border-[#E5C158]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className={`h-4 w-4 shrink-0 ${isDoc ? 'text-blue-500' : 'text-gray-400'}`} />
                            <div className="truncate">
                              <span className="font-bold text-black block truncate">{file.name}</span>
                              <span className="text-[9px] text-[#1A3A4B] block uppercase">
                                {isDoc ? 'Google Doc (Ready to Ingest)' : 'Drive File'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right text-[9px] text-gray-400 shrink-0">
                            {file.size ? `${(parseInt(file.size)/1024).toFixed(1)} KB` : 'Doc'}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {selectedFile && (
                  <div className="bg-[#FDF9ED] border border-[#E5C158] p-3 flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="truncate">
                      <span className="text-[9px] font-mono uppercase text-[#B2902C] font-bold block">SELECTED TARGET</span>
                      <span className="text-xs font-mono text-black font-bold truncate block">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={handleIngestSelectedFile}
                      disabled={isProcessing}
                      className="bg-[#2D2D2D] hover:bg-black text-[#7FFF00] disabled:bg-gray-300 disabled:text-gray-500 px-4 py-2 font-mono font-bold text-xs uppercase shrink-0"
                    >
                      {isProcessing ? 'PARSING...' : '[ INGEST GOOGLE DOC ]'}
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
