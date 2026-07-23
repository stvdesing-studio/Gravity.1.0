import React, { useState, useEffect } from 'react';
import { MatrixRow, GravityIndexRow } from '../types';
import { 
  Database, Search, Plus, Filter, HelpCircle, CheckCircle,
  FileSpreadsheet, Download, Upload, RefreshCw, Loader2,
  CheckCircle2, AlertTriangle, ExternalLink, LogOut, Check,
  Lock, Settings, Link, Trash2, Compass, Cpu, Network, FileCode, CheckSquare, Info
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { findSTVFolder, extractFolderId } from '../lib/drive';
import { 
  createMatrixSpreadsheet, 
  listSpreadsheetsInFolder, 
  readSpreadsheetValues, 
  writeSpreadsheetValues, 
  SheetRow 
} from '../lib/sheets';
import { User } from 'firebase/auth';

interface BrainDBProps {
  matrix: MatrixRow[];
  onAddRow: (row: Omit<MatrixRow, 'id' | 'updatedAt'>) => Promise<void>;
  isLoading: boolean;
}

export default function BrainDB({ matrix, onAddRow, isLoading }: BrainDBProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTheme, setFilterTheme] = useState<string>('All');
  
  // Google Drive & Sheets Sync State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [customFolderInput, setCustomFolderInput] = useState(() => localStorage.getItem('stv_gravity_folder_id') || '');
  const [isSearchingFolder, setIsSearchingFolder] = useState(false);
  
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State for new Row
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTheme, setFormTheme] = useState<'Structural Core' | 'Visual Engine' | 'Business Core'>('Structural Core');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formWeight, setFormWeight] = useState(0.8);
  const [formParams, setFormParams] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Sub-tab Navigation
  const [dbSubTab, setDbSubTab] = useState<'matrix' | 'gravityIndex'>('matrix');

  // Master Gravity Index (Índice de Gravedad) States
  const [gravityIndexRows, setGravityIndexRows] = useState<GravityIndexRow[]>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [indexSearchTerm, setIndexSearchTerm] = useState('');
  const [indexFilterTheme, setIndexFilterTheme] = useState<string>('All');
  const [indexFilterStatus, setIndexFilterStatus] = useState<string>('All');
  
  // Apps Script copying state
  const [copiedGasCode, setCopiedGasCode] = useState(false);

  // Ingestion Sandbox Simulation States
  const [sandboxFilename, setSandboxFilename] = useState('STV_Folleto_Soldaduras_AISC.txt');
  const [sandboxNivel, setSandboxNivel] = useState(3);
  const [sandboxParentNode, setSandboxParentNode] = useState('07. Conexiones');
  const [sandboxText, setSandboxText] = useState('AWS STANDARD COMPLIANCE: Fillet weld thickness 6mm and weld joint configuration. Grade A36 plate steel.');
  const [isIngestingSandbox, setIsIngestingSandbox] = useState(false);
  const [sandboxMessage, setSandboxMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Human-in-the-Loop Operator Intervention States
  const [resolvingRow, setResolvingRow] = useState<GravityIndexRow | null>(null);
  const [operatorFeedback, setOperatorFeedback] = useState('');
  const [operatorPrimary, setOperatorPrimary] = useState<'Structural Core' | 'Visual Engine' | 'Business Core'>('Structural Core');
  const [operatorNegativePrompt, setOperatorNegativePrompt] = useState('');
  const [operatorSuccessCase, setOperatorSuccessCase] = useState<'S' | 'N'>('S');
  const [isResolvingAnomaly, setIsResolvingAnomaly] = useState(false);

  // Fetch Gravity Index Rows
  const fetchGravityIndex = async () => {
    setIsLoadingIndex(true);
    try {
      const res = await fetch('/api/gravity/index');
      if (res.ok) {
        const data = await res.json();
        setGravityIndexRows(data);
      }
    } catch (err) {
      console.error("Failed to fetch gravity index:", err);
    } finally {
      setIsLoadingIndex(false);
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
    fetchGravityIndex();
    return () => unsubscribe();
  }, []);

  const handleSearchFolder = async (token: string, forceId?: string) => {
    setIsSearchingFolder(true);
    setSyncMessage(null);
    try {
      const savedCustomId = forceId !== undefined ? forceId : localStorage.getItem('stv_gravity_folder_id');
      let activeId = savedCustomId || null;
      if (!activeId) {
        activeId = await findSTVFolder(token);
      }
      setFolderId(activeId);
      if (activeId) {
        await handleFetchSheets(activeId, token);
      } else {
        setSpreadsheets([]);
      }
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: 'Failed to access Google Drive' });
    } finally {
      setIsSearchingFolder(false);
    }
  };

  const handleConnectCustomFolder = async (inputStr: string) => {
    if (!accessToken) return;
    const cleanId = extractFolderId(inputStr);
    if (!cleanId) {
      setSyncMessage({ type: 'error', text: "Please input a valid Google Drive Folder ID or Folder Link." });
      return;
    }
    
    setIsSearchingFolder(true);
    setSyncMessage(null);
    try {
      localStorage.setItem('stv_gravity_folder_id', cleanId);
      setFolderId(cleanId);
      setCustomFolderInput(cleanId);
      await handleFetchSheets(cleanId, accessToken);
      setSyncMessage({ type: 'success', text: "Successfully connected to custom Google Drive folder!" });
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: "Could not access custom folder. Ensure it is shared with reader access." });
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

  const handleFetchSheets = async (fId: string, token: string) => {
    setIsLoadingSheets(true);
    try {
      const files = await listSpreadsheetsInFolder(fId, token);
      setSpreadsheets(files);
      if (files.length > 0) {
        setSelectedSheetId(files[0].id);
        setSelectedSheetName(files[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSheets(false);
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
    setSpreadsheets([]);
    setSelectedSheetId('');
    setSelectedSheetName('');
  };

  const handleCreateSyncSheet = async () => {
    if (!accessToken || !folderId) return;
    setIsSyncing(true);
    setSyncStatus('Creating blank spreadsheet...');
    setSyncMessage(null);
    try {
      const sheetId = await createMatrixSpreadsheet(folderId, accessToken);
      setSelectedSheetId(sheetId);
      setSelectedSheetName('STV Brain DB Matrix Sync');
      
      setSyncStatus('Seeding spreadsheet with current matrix rows...');
      const exportRows = matrix.map(row => ({
        theme: row.theme,
        code: row.code,
        name: row.name,
        description: row.description,
        weight: row.weight,
        parameters: row.parameters
      }));
      await writeSpreadsheetValues(sheetId, exportRows, accessToken);
      
      setSyncMessage({ type: 'success', text: "Created & seeded 'STV Brain DB Matrix Sync' successfully!" });
      await handleFetchSheets(folderId, accessToken);
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: 'Failed to create spreadsheet template' });
    } finally {
      setIsSyncing(false);
      setSyncStatus(null);
    }
  };

  const handleImportFromSheet = async () => {
    if (!accessToken || !selectedSheetId) return;
    setIsSyncing(true);
    setSyncStatus(`Reading values from ${selectedSheetName}...`);
    setSyncMessage(null);
    try {
      const sheetRows = await readSpreadsheetValues(selectedSheetId, accessToken);
      if (sheetRows.length === 0) {
        setSyncMessage({ type: 'error', text: 'Spreadsheet contains no data rows or invalid headers' });
        return;
      }

      setSyncStatus(`Importing ${sheetRows.length} matrix nodes...`);
      let addedCount = 0;
      let skippedCount = 0;

      for (const row of sheetRows) {
        const exists = matrix.some(m => m.code.toLowerCase() === row.code.toLowerCase());
        if (!exists) {
          await onAddRow({
            theme: row.theme as any,
            code: row.code,
            name: row.name,
            description: row.description,
            weight: row.weight,
            parameters: row.parameters
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      setSyncMessage({
        type: 'success',
        text: `Sync complete! Imported ${addedCount} new nodes. Skipped ${skippedCount} existing codes.`
      });
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: 'Import failed. Check formatting of Sheet.' });
    } finally {
      setIsSyncing(false);
      setSyncStatus(null);
    }
  };

  const handleExportToSheet = async () => {
    if (!accessToken || !selectedSheetId) return;
    const confirmed = window.confirm(
      `Are you sure you want to overwrite all contents of '${selectedSheetName}' in Google Sheets with the current local Brain DB Matrix?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncStatus(`Writing ${matrix.length} rows to Google Sheet...`);
    setSyncMessage(null);
    try {
      const exportRows = matrix.map(row => ({
        theme: row.theme,
        code: row.code,
        name: row.name,
        description: row.description,
        weight: row.weight,
        parameters: row.parameters
      }));
      await writeSpreadsheetValues(selectedSheetId, exportRows, accessToken);
      setSyncMessage({ type: 'success', text: `Successfully exported ${matrix.length} local rows to ${selectedSheetName}!` });
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: 'Export failed' });
    } finally {
      setIsSyncing(false);
      setSyncStatus(null);
    }
  };

  const filteredMatrix = matrix.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          row.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTheme = filterTheme === 'All' || row.theme === filterTheme;
    return matchesSearch && matchesTheme;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName) return;

    setIsSubmitting(true);
    try {
      await onAddRow({
        theme: formTheme,
        code: formCode,
        name: formName,
        description: formDesc,
        weight: Number(formWeight),
        parameters: formParams
      });

      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 2500);

      // Reset form
      setFormCode('');
      setFormName('');
      setFormDesc('');
      setFormParams('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sandbox Ingestion with Auto Classification
  const handleIngestSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxFilename.trim()) return;

    setIsIngestingSandbox(true);
    setSandboxMessage(null);
    try {
      const res = await fetch('/api/gravity/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreArchivo: sandboxFilename,
          pathDrive: "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
          nivelSistema: sandboxNivel,
          nodoPadre: sandboxParentNode,
          documentText: sandboxText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGravityIndexRows(prev => [data.row, ...prev]);
        setSandboxMessage({ 
          type: 'success', 
          text: `Documento "${data.row.nombreArchivo}" ingresado exitosamente en el índice con ID ${data.row.idGlobal} (${data.row.gravedadPrimaria !== 'Unassigned' ? data.row.gravedadPrimaria : 'Limbo/Anomalía'}).` 
        });
        
        // Auto reset sandbox text but keep filename
        setSandboxText('');
      } else {
        setSandboxMessage({ type: 'error', text: 'Error en la asimilación del archivo.' });
      }
    } catch (err) {
      console.error(err);
      setSandboxMessage({ type: 'error', text: 'Conexión interrumpida con el motor de ingesta.' });
    } finally {
      setIsIngestingSandbox(false);
    }
  };

  // Open the Human-in-the-Loop intervention form
  const handleStartResolveAnomaly = (row: GravityIndexRow) => {
    setResolvingRow(row);
    setOperatorPrimary(row.gravedadPrimaria !== 'Unassigned' ? row.gravedadPrimaria as any : 'Structural Core');
    setOperatorFeedback(`Auditoría de operador STV finalizada. El archivo contiene parámetros clave aprobados para ${row.nombreArchivo}.`);
    setOperatorNegativePrompt('None');
    setOperatorSuccessCase('S');
  };

  // Submit human intervention to resolve limbo
  const handleResolveAnomalySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRow) return;

    setIsResolvingAnomaly(true);
    try {
      const res = await fetch('/api/gravity/index/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idGlobal: resolvingRow.idGlobal,
          gravedadPrimaria: operatorPrimary,
          feedbackOperador: operatorFeedback,
          restriccionStv: operatorNegativePrompt,
          adnSuccessCase: operatorSuccessCase
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGravityIndexRows(prev => prev.map(r => r.idGlobal === resolvingRow.idGlobal ? data.row : r));
        setResolvingRow(null);
        // Show temporary success message inside sandbox message space
        setSandboxMessage({ type: 'success', text: `Anomalía en ${data.row.nombreArchivo} resuelta con éxito. Gravedad fijada en ${data.row.gravedadPrimaria}.` });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolvingAnomaly(false);
    }
  };

  // Delete/Purge row from index
  const handleDeleteIndexRow = async (idGlobal: string) => {
    const confirmed = window.confirm(`¿Seguro que deseas depurar permanentemente el registro ${idGlobal} del Índice de Gravedad?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/gravity/index/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idGlobal })
      });
      if (res.ok) {
        setGravityIndexRows(prev => prev.filter(r => r.idGlobal !== idGlobal));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const appsScriptCode = `/**
 * STV GRAVITY SYSTEM | ENTERPRISE OS
 * Google Apps Script - Ingestion Engine and Gravity Index Syncer
 */
const FOLDER_ID = "REEMPLAZA_CON_EL_ID_DE_TU_CARPETA_DRIVE";

function inicializarMasterIndex() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  const headers = ["ID_Global", "Nombre_Archivo", "Path_Drive", "Nivel_Sistema", "Nodo_Padre", "Gravedad_Primaria", "Fuerza_Atraccion", "Estado_Operativo", "Normativa_Base", "Riesgo_Detectado", "Nivel_Critico", "Feedback_Operador", "Restriccion_STV", "ADN_Success_Case", "Timestamp"];
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontFamily("Inter").setFontSize(10).setFontWeight("bold").setBackground("#121214").setFontColor("#D4AF37").setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert("Matriz de Índice de Gravedad Inicializada Exitosamente.");
}

function ingestarArchivosEnIndice() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  const data = sheet.getDataRange().getValues();
  const existing = {};
  for (let i = 1; i < data.length; i++) { existing[data[i][1]] = true; }
  let count = 0;
  while (files.hasNext()) {
    const file = files.next();
    if (existing[file.getName()]) continue;
    
    const fileText = file.getAs("text/plain").getDataAsString().toLowerCase();
    
    // Clasificación 3 Semillas
    const struct = ["acero", "estructura", "estructural", "carga", "asce", "aisc", "aws", "soldadura", "perno", "anclaje", "placa base", "columna", "viga", "diagonal", "cartela", "pedestal", "zapata", "cimentación", "geotecnia", "momento", "cortante", "compresión", "tensión", "pandeo"];
    const visual = ["render", "visual", "prompt", "midjourney", "flow", "fotorealista", "cinematic", "materialidad", "textura", "composición", "iluminación", "fotografía", "branding", "atmósfera", "color", "contraste", "nitidez", "dominancia", "autoridad", "escala", "logo"];
    const business = ["cliente", "cotización", "precio", "presupuesto", "utilidad", "factura", "contrato", "compra", "venta", "proveedor", "inventario", "producción", "cronograma", "costo", "margen", "flujo", "comercial", "crm"];
    
    let sc = 0, vc = 0, bc = 0;
    struct.forEach(w => { if (fileText.indexOf(w) !== -1) sc++; });
    visual.forEach(w => { if (fileText.indexOf(w) !== -1) vc++; });
    business.forEach(w => { if (fileText.indexOf(w) !== -1) bc++; });
    
    const total = sc + vc + bc;
    let primary = "Unassigned", attraction = 100, status = "Activo", feedback = "Ingesta automática con éxito.", norm = "None";
    
    if (total > 0) {
      const pStruct = Math.round((sc / total) * 100);
      const pVisual = Math.round((vc / total) * 100);
      const pBusiness = Math.round((bc / total) * 100);
      const scores = [{ name: "Structural Core", val: pStruct }, { name: "Visual Engine", val: pVisual }, { name: "Business Core", val: pBusiness }].sort((a, b) => b.val - a.val);
      if (scores[0].val - scores[1].val < 15) {
        primary = "Unassigned";
        attraction = scores[0].val;
        status = "LimboAnomalía";
        feedback = "Empate gravitacional: Requiere feedback de operador.";
      } else {
        primary = scores[0].name;
        attraction = scores[0].val;
        status = "Activo";
      }
      if (fileText.indexOf("aws") !== -1) norm = "AWS D1.1";
      if (fileText.indexOf("aisc") !== -1) norm = "AISC 360";
    } else {
      status = "LimboAnomalía";
      feedback = "Cero coincidencias con semillas.";
    }
    
    sheet.appendRow([
      "GID-" + Math.floor(Math.random() * 900 + 100),
      file.getName(),
      file.getUrl(),
      primary === "Structural Core" ? 3 : (primary === "Visual Engine" ? 8 : 5),
      primary === "Structural Core" ? "07. Conexiones" : (primary === "Visual Engine" ? "21. Motor Visual" : "14. Costos"),
      primary,
      attraction + "%",
      status,
      norm,
      status === "LimboAnomalía" ? "S" : "N",
      status === "LimboAnomalía" ? 5 : 0,
      feedback,
      "None",
      status === "Activo" ? "S" : "N",
      new Date()
    ]);
    count++;
  }
  SpreadsheetApp.getUi().alert("Sincronización terminada: " + count + " archivos procesados.");
}`;

  const filteredGravityIndex = gravityIndexRows.filter(row => {
    const matchesSearch = row.nombreArchivo.toLowerCase().includes(indexSearchTerm.toLowerCase()) ||
                          row.pathDrive.toLowerCase().includes(indexSearchTerm.toLowerCase()) ||
                          (row.feedbackOperador && row.feedbackOperador.toLowerCase().includes(indexSearchTerm.toLowerCase()));
    
    const matchesTheme = indexFilterTheme === 'All' || 
                         (indexFilterTheme === 'Unassigned' && row.gravedadPrimaria === 'Unassigned') ||
                         row.gravedadPrimaria === indexFilterTheme;
                         
    const matchesStatus = indexFilterStatus === 'All' || row.estadoOperativo === indexFilterStatus;
    
    return matchesSearch && matchesTheme && matchesStatus;
  });

  const sandboxTemplates = [
    {
      name: "🧬 Semilla: Estructural Core",
      filename: "STV_AISC_VigaPilas.txt",
      nivel: 3,
      parent: "07. Conexiones",
      text: "AWS D1.1 STANDARD CODE COUPLING: Fillet weld thickness of 6mm, connecting beam to vertical column anclajes on A36 high structural plate steel, loads calculated according to AISC."
    },
    {
      name: "👁️ Semilla: Visual Engine",
      filename: "STV_Render_BrandingStyle.txt",
      nivel: 8,
      parent: "21. Motor Visual",
      text: "Minimalist render composition utilizing golden proportion ratios, cinematic fotorrealista illumination, natural concrete textures, warm chromatic fibration, and aesthetic branding assets."
    },
    {
      name: "💼 Semilla: Business Core",
      filename: "STV_Invoice_Utilidades.xlsx",
      nivel: 5,
      parent: "14. Costos",
      text: "Preparación de la factura final del cliente, determinando el presupuesto real, margen de utilidad del costo del proyecto, cronograma de cotizaciones y CRM tracker."
    },
    {
      name: "⚠️ Caso de Limbo (Anomalía)",
      filename: "STV_Draft_JointSpec.txt",
      nivel: 6,
      parent: "11. LimboAnomalía",
      text: "Plano de elevación de viga que combina un detallado estructural de soldadura de perno y placa base de acero, con un sofisticado render de diseño visual fotorrealista y branding cromático."
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedGasCode(true);
    setTimeout(() => setCopiedGasCode(false), 2000);
  };

  return (
    <div className="space-y-6" id="brain-db-tab">
      
      {/* Dynamic Selector Header */}
      <div className="flex border-b border-brand-slate-light">
        <button
          onClick={() => setDbSubTab('matrix')}
          className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            dbSubTab === 'matrix'
              ? 'border-brand-gold text-brand-gold bg-brand-slate-medium/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" />
          ADN STV: Matriz de Parámetros
        </button>
        <button
          onClick={() => {
            setDbSubTab('gravityIndex');
            fetchGravityIndex();
          }}
          className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            dbSubTab === 'gravityIndex'
              ? 'border-brand-gold text-brand-gold bg-brand-slate-medium/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Network className="h-4 w-4 text-brand-gold" />
          Capa 8: Índice de Gravedad (Base de Datos Paramétrica)
        </button>
      </div>

      {dbSubTab === 'matrix' ? (
        <>
          {/* GOOGLE SHEETS SYNCHRONIZATION SUITE */}
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-slate-light/60 pb-3 gap-3">
              <div className="space-y-1">
                <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-brand-gold" /> Google Sheets Brain DB Sync
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  Link live parametric spreadsheets directly into Capa 8 dynamic indexing schemas
                </p>
              </div>
              
              {user && (
                <div className="flex items-center gap-2 bg-brand-slate-dark/50 px-2.5 py-1 rounded-lg border border-brand-slate-light/30">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="user" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-brand-gold/20 flex items-center justify-center text-[9px] text-brand-gold font-bold font-mono">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-white max-w-[100px] truncate">{user.displayName}</span>
                  <button onClick={handleLogout} className="p-0.5 hover:bg-red-500/10 rounded transition">
                    <LogOut className="h-3 w-3 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>

            {needsAuth ? (
              <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-lg bg-brand-slate-dark/60 border border-brand-slate-light/40 gap-4">
                <div className="space-y-1 max-w-lg">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-brand-gold" /> Access Permission Required
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Unlock bidirectional Google Sheets sync. Add, modify, or download matrix thresholds in real-time from a collaborative spreadsheet stored in Google Drive.
                  </p>
                </div>
                
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button flex items-center justify-center cursor-pointer hover:bg-slate-50 transition shrink-0"
                  style={{
                    background: 'white',
                    border: '1px solid #dadce0',
                    borderRadius: '8px',
                    color: '#3c4043',
                    fontSize: '11px',
                    fontWeight: '500',
                    height: '34px',
                    padding: '0 12px',
                  }}
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '15px', height: '15px' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Authorize Sheets Sync</span>
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* CUSTOM FOLDER INTEGRATION SUITE */}
                <div className="p-3.5 rounded-lg bg-brand-slate-dark/30 border border-brand-slate-light/40 space-y-2">
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
                      className="flex-1 bg-brand-slate-dark border border-gray-700 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-brand-gold"
                    />
                    <button
                      onClick={() => handleConnectCustomFolder(customFolderInput)}
                      className="px-3 py-1.5 bg-brand-gold hover:bg-yellow-400 text-brand-slate-dark font-mono font-semibold text-[10px] rounded transition flex items-center gap-1 shrink-0"
                    >
                      <Link className="h-3 w-3" /> Connect
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-400 leading-normal">
                    Connect any shared Google Drive folder (like <span className="text-gray-300 select-all font-semibold">1siDxv0fZgNIM2BE9J13-3L8tJ4ocS9rT</span>) to adopt Sheets instantly.
                  </p>
                </div>

                {isSearchingFolder ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-400 gap-2 font-mono bg-brand-slate-dark/30 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                    <span>Searching Google Drive...</span>
                  </div>
                ) : !folderId ? (
                  <div className="p-4 rounded-lg bg-amber-950/15 border border-amber-900/30 text-center space-y-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" />
                    <h5 className="text-xs font-semibold text-amber-300">STV gravity engine Folder Not Detected</h5>
                    <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed">
                      To synchronize your parameters with Google Sheets, please make sure the <strong className="text-white">"STV gravity engine"</strong> folder is created in your Google Drive (you can easily initialize it on the <strong className="text-brand-gold">Tectonic Parsing</strong> tab) or connect a custom folder above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Folder Found & Sync Sheet Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6 space-y-1.5">
                        <label className="text-[10px] font-mono text-gray-400 block uppercase tracking-wider flex items-center gap-1">
                          Active Spreadsheet Target
                        </label>
                        {spreadsheets.length === 0 ? (
                          <div className="text-xs text-gray-400 py-2 px-3 bg-brand-slate-dark border border-gray-700 rounded-lg italic">
                            No spreadsheets found in STV directory.
                          </div>
                        ) : (
                          <select
                            value={selectedSheetId}
                            onChange={(e) => {
                              const sheet = spreadsheets.find(s => s.id === e.target.value);
                              if (sheet) {
                                setSelectedSheetId(sheet.id);
                                setSelectedSheetName(sheet.name);
                              }
                            }}
                            className="w-full text-xs font-mono bg-brand-slate-dark border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-gold"
                          >
                            {spreadsheets.map((sheet) => (
                              <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Action Suite */}
                      <div className="md:col-span-6 flex flex-wrap gap-2 justify-start md:justify-end">
                        <button
                          onClick={() => handleSearchFolder(accessToken!)}
                          disabled={isLoadingSheets || isSyncing}
                          className="py-2 px-3 bg-brand-slate-dark text-gray-300 border border-gray-700 rounded-lg hover:border-gray-500 transition text-[10px] uppercase font-mono font-semibold flex items-center gap-1.5"
                          title="Rescan Folder"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingSheets ? 'animate-spin text-brand-gold' : ''}`} />
                          Refresh
                        </button>

                        {spreadsheets.length > 0 ? (
                          <>
                            <button
                              onClick={handleImportFromSheet}
                              disabled={isSyncing}
                              className="py-2 px-3 bg-brand-gold text-brand-slate-dark font-semibold rounded-lg hover:bg-yellow-400 transition text-[10px] uppercase font-mono flex items-center gap-1.5"
                            >
                              <Download className="h-3 w-3" />
                              Import Matrix
                            </button>
                            <button
                              onClick={handleExportToSheet}
                              disabled={isSyncing}
                              className="py-2 px-3 bg-brand-slate-medium text-white border border-brand-gold/40 hover:bg-brand-slate-dark rounded-lg transition text-[10px] uppercase font-mono flex items-center gap-1.5"
                            >
                              <Upload className="h-3 w-3 text-brand-gold" />
                              Export Matrix
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleCreateSyncSheet}
                            disabled={isSyncing}
                            className="py-2 px-4 bg-brand-gold text-brand-slate-dark font-semibold rounded-lg hover:bg-yellow-400 transition text-[10px] uppercase font-mono flex items-center gap-1.5"
                          >
                            <Plus className="h-3 w-3" />
                            Create Sync Sheet Template
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Selected sheet details */}
                    {selectedSheetId && spreadsheets.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] font-mono p-2 bg-brand-slate-dark/30 rounded border border-brand-slate-light/30">
                        <span className="text-gray-400 flex items-center gap-1">
                          Active target: <strong className="text-white">{selectedSheetName}</strong>
                        </span>
                        <a 
                          href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-brand-gold hover:underline flex items-center gap-1"
                        >
                          Open Google Sheet <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}

                    {/* Sync Status Overlay */}
                    {isSyncing && (
                      <div className="flex items-center gap-2 p-3 bg-brand-gold/5 border border-brand-gold/30 rounded-lg text-brand-gold text-[11px] font-mono animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{syncStatus || 'Accessing spreadsheet api...'}</span>
                      </div>
                    )}

                    {/* Sync Outcome Message */}
                    {syncMessage && (
                      <div className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-mono leading-relaxed animate-fadeIn ${
                        syncMessage.type === 'success' 
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                          : 'bg-red-950/40 border-red-900 text-red-400'
                      }`}>
                        {syncMessage.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <span>{syncMessage.text}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl border border-brand-slate-light bg-brand-slate-medium p-4">
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search matrix codes or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-brand-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-gray-400 hidden sm:inline" />
              {['All', 'Structural Core', 'Visual Engine', 'Business Core'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setFilterTheme(theme)}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition ${
                    filterTheme === theme
                      ? 'bg-brand-gold/15 border-brand-gold text-white'
                      : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {theme}
                </button>
              ))}
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="ml-auto md:ml-4 py-2 px-3 text-xs font-semibold rounded-lg bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 flex items-center gap-1 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Reference Node
              </button>
            </div>

          </div>

          {/* Form Overlay/Dropdown to add node */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-brand-gold/40 bg-brand-slate-medium space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-brand-slate-light pb-2">
                <h4 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-brand-gold" /> Add Parametric Matrix Node
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Theme selection */}
                <div>
                  <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Matrix Theme</label>
                  <select
                    value={formTheme}
                    onChange={(e: any) => setFormTheme(e.target.value)}
                    className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Structural Core">Structural Core</option>
                    <option value="Visual Engine">Visual Engine</option>
                    <option value="Business Core">Business Core</option>
                  </select>
                </div>

                {/* Code identifier */}
                <div>
                  <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Matrix Code ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AISC-J2.4 or BRAND-301"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold font-mono"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Rule Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AISC Minimum Welds"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description */}
                <div>
                  <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Functional Description</label>
                  <textarea
                    placeholder="Describe the load computations, color workspaces, or parametric thresholds..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full h-20 text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold resize-none"
                  />
                </div>

                {/* Parameters & Weight */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Gravitational Weight (Mass Pull)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.1"
                        max="1.5"
                        step="0.05"
                        value={formWeight}
                        onChange={(e) => setFormWeight(Number(e.target.value))}
                        className="flex-1 h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
                      />
                      <span className="text-xs font-mono text-white w-10 text-right">{formWeight.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-gray-400 block uppercase mb-1">Key Parameters (Semicolon separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. material: E70; thickness: 12mm; spacing: 1.618"
                      value={formParams}
                      onChange={(e) => setFormParams(e.target.value)}
                      className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-gold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 text-xs font-semibold rounded-lg bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 transition"
                >
                  {isSubmitting ? 'Registering Node...' : 'Commit to Brain DB'}
                </button>
              </div>
            </form>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs font-mono animate-fadeIn">
              <CheckCircle className="h-4 w-4" />
              <span>Matrix coordinate committed successfully. Dynamic RAG parameters updated.</span>
            </div>
          )}

          {/* Spreadsheet grid */}
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-brand-slate-light bg-brand-slate-dark/40 text-[10px] font-mono uppercase text-gray-400">
                    <th className="p-4">Theme</th>
                    <th className="p-4">Code ID</th>
                    <th className="p-4">Rule/Node Title</th>
                    <th className="p-4">Operational Parameters</th>
                    <th className="p-4">Gravity mass</th>
                    <th className="p-4">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-light/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-mono">
                        Syncing matrix parameters with Google Sheets Brain DB...
                      </td>
                    </tr>
                  ) : filteredMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-mono">
                        No matching matrix nodes found. Try checking another theme.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrix.map((row) => (
                      <tr key={row.id} className="hover:bg-brand-slate-dark/25 transition">
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            row.theme === 'Structural Core' 
                              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-800'
                              : row.theme === 'Visual Engine'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                          }`}>
                            {row.theme}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-white font-medium">{row.code}</td>
                        <td className="p-4">
                          <div>
                            <div className="text-gray-200 font-semibold">{row.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{row.description}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {row.parameters.split(';').map((p, idx) => (
                              <span key={idx} className="bg-brand-slate-dark px-1.5 py-0.5 rounded text-[10px] text-gray-400 font-mono">
                                {p.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[50px] h-1.5 bg-brand-slate-dark rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  row.theme === 'Structural Core' 
                                    ? 'bg-indigo-500'
                                    : row.theme === 'Visual Engine'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(row.weight * 100, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-gray-400">{row.weight.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-400 text-[10px]">
                          {new Date(row.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RAG Context notice */}
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 flex items-start gap-4">
            <HelpCircle className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider">
                Parametric Matrix Linkage Rule
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every reference committed here acts as an structural grounding vector. When new files are parsed in <strong className="text-brand-gold">Capa 8 (Relational Gravitational Indexing)</strong>, they are matched against this database to map engineering compliance. Adding rule definitions will seamlessly expand the Oráculo system’s auditing boundaries.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Capa 8 Overview */}
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 flex items-start gap-4">
            <Cpu className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider">
                CAPA 8: ÍNDICE DE GRAVEDAD GENERAL (BASE DE DATOS PARAMÉTRICA)
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Este panel representa la <strong>Base de Datos Paramétrica</strong> donde se gobiernan, clasifican y auditan todas las piezas de conocimiento asimiladas. Cada archivo cargado es sometido a un análisis paramétrico de <strong>3 Semillas (Estructural, Visual y Negocio)</strong>, midiendo su <strong>Fuerza de Atracción</strong>. Si hay ambigüedades, el Centinela las coloca en <strong>LimboAnomalía</strong> para que el Operador determine manualmente el destino, evitando la dilución del ADN corporativo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* INGESTION SIMULATOR SANDBOX */}
            <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
              <div className="border-b border-brand-slate-light pb-2">
                <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Compass className="h-4 w-4 text-brand-gold" /> SIMULAR INGESTA Y CLASIFICACIÓN PILOTO
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Prueba las 3 Semillas Maestras de Santi Vilanova. Introduce textos técnicos y observa el ruteo.
                </p>
              </div>

              {/* Template triggers */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-gray-400 uppercase block">Cargar Semillas de Prueba Piloto:</span>
                <div className="flex flex-wrap gap-1.5">
                  {sandboxTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSandboxFilename(tpl.filename);
                        setSandboxNivel(tpl.nivel);
                        setSandboxParentNode(tpl.parent);
                        setSandboxText(tpl.text);
                        setSandboxMessage(null);
                      }}
                      className="px-2 py-1 bg-brand-slate-dark hover:bg-brand-slate-light border border-gray-700 rounded text-[9px] font-mono text-gray-300 hover:text-white transition"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleIngestSandbox} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Nombre Archivo</label>
                    <input
                      type="text"
                      value={sandboxFilename}
                      onChange={(e) => setSandboxFilename(e.target.value)}
                      required
                      className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Nivel Sistema</label>
                    <select
                      value={sandboxNivel}
                      onChange={(e) => setSandboxNivel(Number(e.target.value))}
                      className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono"
                    >
                      <option value="1">Capa 1: Ingesta</option>
                      <option value="3">Capa 3: Estructural</option>
                      <option value="5">Capa 5: Chunking</option>
                      <option value="6">Capa 6: Tagging</option>
                      <option value="8">Capa 8: Índice de Gravedad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Nodo Padre</label>
                    <input
                      type="text"
                      value={sandboxParentNode}
                      onChange={(e) => setSandboxParentNode(e.target.value)}
                      className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Contenido / Parámetros del Documento</label>
                  <textarea
                    placeholder="Escribe aquí el contenido textual para activar los ruteos de las 3 Semillas..."
                    value={sandboxText}
                    onChange={(e) => setSandboxText(e.target.value)}
                    required
                    className="w-full h-24 text-xs bg-brand-slate-dark border border-gray-700 rounded p-2.5 text-white font-mono resize-none focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isIngestingSandbox}
                    className="py-1.5 px-4 bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 text-xs font-mono font-semibold rounded transition flex items-center gap-1"
                  >
                    {isIngestingSandbox ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Alineando Gravedad...
                      </>
                    ) : (
                      "Ingestar en Capa 8"
                    )}
                  </button>
                </div>
              </form>

              {sandboxMessage && (
                <div className={`p-3 rounded-lg border text-[11px] font-mono leading-relaxed flex items-start gap-2 animate-fadeIn ${
                  sandboxMessage.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                    : 'bg-red-950/30 border-red-900 text-red-400'
                }`}>
                  {sandboxMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  )}
                  <span>{sandboxMessage.text}</span>
                </div>
              )}

            </div>

            {/* GOOGLE APPS SCRIPT SOURCE CONTROLLER */}
            <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
              <div className="border-b border-brand-slate-light pb-2 flex justify-between items-center">
                <div>
                  <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-brand-gold" /> GOOGLE APPS SCRIPT: SEED CODE
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Instala este script en tu Google Sheet para recibir y sincronizar archivos de Google Drive.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 text-[10px] font-mono bg-brand-slate-dark text-gray-300 hover:text-white border border-gray-700 rounded hover:border-gray-500 transition flex items-center gap-1"
                >
                  {copiedGasCode ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    "Copiar Código"
                  )}
                </button>
              </div>

              <div className="bg-brand-slate-dark p-3.5 rounded border border-gray-800 h-64 overflow-y-auto font-mono text-[9px] text-gray-400 leading-normal select-all">
                <pre>{appsScriptCode}</pre>
              </div>
              <div className="text-[9px] font-mono text-gray-500 flex items-start gap-1">
                <Info className="h-3.5 w-3.5 text-brand-gold shrink-0 mt-0.5" />
                <span>Modo de uso: Reemplaza FOLDER_ID con el identificador de tu carpeta Drive de asimilación para procesar y clasificar en tiempo real.</span>
              </div>
            </div>

          </div>

          {/* HUMAN IN THE LOOP RESOLUTION PANEL */}
          {resolvingRow && (
            <div className="rounded-xl border-2 border-brand-gold bg-brand-slate-medium p-5 space-y-4 animate-scaleUp">
              <div className="border-b border-brand-slate-light/80 pb-2 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-display text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" /> INTERVENCIÓN OPERADOR: RESOLVER LIMBO GRAVITACIONAL
                  </h4>
                  <p className="text-[10px] text-white">
                    Resolviendo conflicto para: <strong className="text-brand-gold">{resolvingRow.nombreArchivo}</strong> ({resolvingRow.idGlobal})
                  </p>
                </div>
                <button
                  onClick={() => setResolvingRow(null)}
                  className="text-xs text-gray-400 hover:text-white font-mono uppercase bg-brand-slate-dark px-2 py-0.5 rounded border border-gray-700"
                >
                  Cerrar Panel
                </button>
              </div>

              <form onSubmit={handleResolveAnomalySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Forzar Gravedad Primaria</label>
                    <select
                      value={operatorPrimary}
                      onChange={(e: any) => setOperatorPrimary(e.target.value)}
                      className="w-full text-xs bg-brand-slate-dark border border-brand-gold/60 rounded px-2.5 py-2 text-white"
                    >
                      <option value="Structural Core">Structural Core (Estructural)</option>
                      <option value="Visual Engine">Visual Engine (Visual)</option>
                      <option value="Business Core">Business Core (Negocio)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Feedback de Operador (Justificación de la Sentencia)</label>
                    <input
                      type="text"
                      value={operatorFeedback}
                      onChange={(e) => setOperatorFeedback(e.target.value)}
                      required
                      className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded px-2.5 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Marcar ADN Éxito (Success Case)</label>
                    <div className="flex gap-4 pt-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="scase"
                          checked={operatorSuccessCase === 'S'}
                          onChange={() => setOperatorSuccessCase('S')}
                          className="accent-brand-gold"
                        /> SÍ
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="scase"
                          checked={operatorSuccessCase === 'N'}
                          onChange={() => setOperatorSuccessCase('N')}
                          className="accent-brand-gold"
                        /> NO
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Restricción STV (Negative Prompt / Parámetros a bloquear para evitar dilución de ADN)</label>
                  <input
                    type="text"
                    value={operatorNegativePrompt}
                    onChange={(e) => setOperatorNegativePrompt(e.target.value)}
                    className="w-full text-xs bg-brand-slate-dark border border-gray-700 rounded px-2.5 py-2 text-white font-mono"
                    placeholder="e.g. Evitar combinaciones de color fuera de la paleta corporativa"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingRow(null)}
                    className="py-1.5 px-4 bg-brand-slate-dark text-gray-300 hover:text-white text-xs font-mono rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isResolvingAnomaly}
                    className="py-1.5 px-5 bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 font-semibold text-xs font-mono rounded transition flex items-center gap-1"
                  >
                    {isResolvingAnomaly ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Grabar Sentencia & Recalibrar Gravedad
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Master Table Filter Suite */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl border border-brand-slate-light bg-brand-slate-medium p-4">
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar archivos, links o justificaciones..."
                value={indexSearchTerm}
                onChange={(e) => setIndexSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-brand-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Quick Filter Themes */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-mono text-gray-400 uppercase mr-1">Nodo:</span>
              {['All', 'Structural Core', 'Visual Engine', 'Business Core', 'Unassigned'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setIndexFilterTheme(theme)}
                  className={`py-1 px-2.5 text-[10px] font-medium rounded border transition ${
                    indexFilterTheme === theme
                      ? 'bg-brand-gold/15 border-brand-gold text-white'
                      : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {theme}
                </button>
              ))}

              <span className="text-[10px] font-mono text-gray-400 uppercase ml-2 mr-1">Estado:</span>
              {['All', 'Activo', 'LimboAnomalía'].map((st) => (
                <button
                  key={st}
                  onClick={() => setIndexFilterStatus(st)}
                  className={`py-1 px-2.5 text-[10px] font-medium rounded border transition ${
                    indexFilterStatus === st
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-brand-slate-dark border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {st === 'LimboAnomalía' ? 'Limbo' : st}
                </button>
              ))}
            </div>

          </div>

          {/* MASTER PARAMETRIC INDEX TABLE */}
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 table-auto min-w-[1200px]">
                <thead>
                  {/* Grouped Headers */}
                  <tr className="border-b border-brand-slate-light/60 bg-brand-slate-dark/80 text-[10px] font-mono uppercase text-gray-400 text-center divide-x divide-brand-slate-light/40">
                    <th colSpan={6} className="py-2 bg-brand-slate-dark px-4 text-left text-brand-gold font-bold">I. Grupo de Control: Identidad</th>
                    <th colSpan={3} className="py-2 bg-indigo-950/20 px-4 text-indigo-300 font-bold">II. Grupo de Control: Gravedad</th>
                    <th colSpan={3} className="py-2 bg-red-950/20 px-4 text-red-300 font-bold">III. Grupo de Control: Auditoría</th>
                    <th colSpan={4} className="py-2 bg-emerald-950/20 px-4 text-emerald-300 font-bold">IV. Grupo de Control: Inteligencia & Sincronía</th>
                  </tr>
                  {/* Real Columns */}
                  <tr className="border-b border-brand-slate-light bg-brand-slate-dark/40 text-[9px] font-mono uppercase text-gray-400 divide-x divide-brand-slate-light/40">
                    <th className="p-3">Global ID</th>
                    <th className="p-3">Nombre del Archivo</th>
                    <th className="p-3">Path Cloud Drive</th>
                    <th className="p-3">Nivel</th>
                    <th className="p-3">Nodo Padre</th>
                    <th className="p-3">Acciones</th>
                    
                    <th className="p-3 bg-indigo-950/10">Gravedad Primaria</th>
                    <th className="p-3 bg-indigo-950/10">Atracción</th>
                    <th className="p-3 bg-indigo-950/10">Estado Operativo</th>
                    
                    <th className="p-3 bg-red-950/10">Norma Base</th>
                    <th className="p-3 bg-red-950/10">Riesgo</th>
                    <th className="p-3 bg-red-950/10">Crítico</th>
                    
                    <th className="p-3 bg-emerald-950/10">Feedback Operador (Justificación)</th>
                    <th className="p-3 bg-emerald-950/10">Restricción STV</th>
                    <th className="p-3 bg-emerald-950/10">ADN Caso Éxito</th>
                    <th className="p-3 bg-emerald-950/10">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-light/50 font-mono text-[10px]">
                  {isLoadingIndex ? (
                    <tr>
                      <td colSpan={16} className="p-8 text-center text-gray-400 font-mono">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-brand-gold mb-2" />
                        Accediendo a la Base de Datos Paramétrica del Índice de Gravedad...
                      </td>
                    </tr>
                  ) : filteredGravityIndex.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="p-8 text-center text-gray-400 italic">
                        No se detectan registros en el índice de gravedad. Utiliza el simulador de arriba para poblar la matriz en tiempo real.
                      </td>
                    </tr>
                  ) : (
                    filteredGravityIndex.map((row) => (
                      <tr 
                        key={row.idGlobal} 
                        className={`hover:bg-brand-slate-dark/20 transition divide-x divide-brand-slate-light/30 ${
                          row.estadoOperativo === 'LimboAnomalía' ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''
                        }`}
                      >
                        {/* Identidad */}
                        <td className="p-3 text-white font-semibold whitespace-nowrap">{row.idGlobal}</td>
                        <td className="p-3 text-gray-200 max-w-[200px] truncate" title={row.nombreArchivo}>{row.nombreArchivo}</td>
                        <td className="p-3">
                          <a 
                            href={row.pathDrive.startsWith("http") ? row.pathDrive : `https://docs.google.com/spreadsheets/d/${row.pathDrive}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-brand-gold hover:underline flex items-center gap-0.5 whitespace-nowrap"
                          >
                            Drive Link <ExternalLink className="h-2 w-2" />
                          </a>
                        </td>
                        <td className="p-3 text-center text-gray-300">Capa {row.nivelSistema}</td>
                        <td className="p-3 text-gray-300 whitespace-nowrap">{row.nodoPadre}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {row.estadoOperativo === 'LimboAnomalía' ? (
                              <button
                                onClick={() => handleStartResolveAnomaly(row)}
                                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-brand-slate-dark font-bold text-[9px] rounded uppercase"
                                title="Intervenir"
                              >
                                Sentenciar
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleDeleteIndexRow(row.idGlobal)}
                              className="p-1 hover:bg-red-500/15 rounded text-gray-400 hover:text-red-400 transition"
                              title="Borrar Registro"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        {/* Gravedad */}
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium ${
                            row.gravedadPrimaria === 'Structural Core' 
                              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-800'
                              : row.gravedadPrimaria === 'Visual Engine'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-800'
                              : row.gravedadPrimaria === 'Business Core'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950/40 text-red-400 border border-red-800'
                          }`}>
                            {row.gravedadPrimaria}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-right text-white">{row.fuerzaAtraccion}%</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                            row.estadoOperativo === 'Activo' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-400 animate-pulse'
                          }`}>
                            {row.estadoOperativo}
                          </span>
                        </td>

                        {/* Auditoría */}
                        <td className="p-3 text-gray-400">{row.normativaBase}</td>
                        <td className="p-3 text-center font-bold text-gray-300">{row.riesgoDetectado}</td>
                        <td className="p-3 text-center font-semibold">
                          <span className={`${
                            row.nivelCritico >= 4 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {row.nivelCritico}
                          </span>
                        </td>

                        {/* Inteligencia */}
                        <td className="p-3 text-gray-300 max-w-[250px] truncate" title={row.feedbackOperador}>{row.feedbackOperador || "N/A"}</td>
                        <td className="p-3 text-gray-400 max-w-[150px] truncate" title={row.restriccionStv}>{row.restriccionStv}</td>
                        <td className="p-3 text-center font-semibold text-white">{row.adnSuccessCase}</td>
                        <td className="p-3 text-gray-400 whitespace-nowrap text-[9px]">
                          {new Date(row.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RAG Context notice */}
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 flex items-start gap-4">
            <HelpCircle className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider">
                Base Paramétrica General y Ley de Atracción
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Este sistema utiliza <strong>Motos Gravitacionales</strong> en tiempo real. Cuando los archivos son arrastrados por las semillas, sus coeficientes numéricos determinan el ruteo lógico en la nube corporativa de <strong>STV Design Studio</strong>. El control biparámetrico del operador técnico previene distorsiones algorítmicas, dándole al sistema de inteligencia artificial una verdadera <strong>conciencia y espina dorsal</strong>.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
