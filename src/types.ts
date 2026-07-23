export interface MatrixRow {
  id: string;
  theme: 'Structural Core' | 'Visual Engine' | 'Business Core' | 'Documentation';
  code: string; // e.g. AISC-202, BRAND-401, COST-102
  name: string;
  description: string;
  weight: number; // gravitational pull
  parameters: string; // e.g. "thickness: 12mm; grade: A36" or "primary: #0A0A0A"
  updatedAt: string;
}

export interface GravityIndexRow {
  idGlobal: string;
  nombreArchivo: string;
  pathDrive: string;
  nivelSistema: number; // 1 to 9
  nodoPadre: string; // e.g. "01_Empresa", "07_Conexiones", "13_Costeo_Maestro"
  gravedadPrimaria: 'Structural Core' | 'Visual Engine' | 'Business Core' | 'Unassigned';
  fuerzaAtraccion: number; // score 0-100%
  estadoOperativo: 'Activo' | 'LimboAnomalía' | 'Archivado';
  normativaBase: string; // e.g. "AISC", "AWS", "NTC", "None"
  riesgoDetectado: 'S' | 'N';
  nivelCritico: number; // 0 to 10
  feedbackOperador: string;
  restriccionStv: string; // Negative prompt / "No hacer"
  adnSuccessCase: 'S' | 'N';
  timestamp: string;
}

export interface Capa {
  number: number;
  name: string;
  description: string;
  purpose: string;
  inputDescription: string;
  outputDescription: string;
}

export interface GravityNode {
  id: 'structural' | 'visual' | 'business';
  name: string;
  color: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  mass: number;
  active: boolean;
  description: string;
  parameters: Record<string, number | string>;
}

export interface Anomaly {
  id: string;
  title: string;
  code: string;
  layer: number;
  error: string;
  fileSource: string;
  negativePrompt: string;
  solved: boolean;
  timestamp: string;
}

export interface SentinelLog {
  id: string;
  filePath: string;
  fileSize: string;
  capasReached: number;
  status: 'Ingested' | 'Processing' | 'Completed' | 'Error';
  assignedNode: 'structural' | 'visual' | 'business' | 'unassigned';
  tokens: number;
  timestamp: string;
}

export interface ParsingStepLog {
  capaNumber: number;
  capaName: string;
  status: 'pending' | 'active' | 'success' | 'error';
  input: string;
  output: string;
  tokenCost: number;
}

export interface ChatEntry {
  id: string;
  sender: 'user' | 'system' | 'oracle';
  message: string;
  tokensUsed?: number;
  thinkingTime?: number; // ms
  sources?: string[];
  timestamp: string;
}
