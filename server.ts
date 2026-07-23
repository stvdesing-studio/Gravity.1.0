import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;
let isGeminiAvailable = false;

function getGeminiClient() {
  if (aiClient) {
    return { ai: aiClient, available: isGeminiAvailable };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("⚠️ GEMINI_API_KEY not found or is placeholder. System is in procedural mode.");
    return { ai: null, available: false };
  }

  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    isGeminiAvailable = true;
    console.log("✅ Gemini Client initialized successfully.");
    return { ai: aiClient, available: true };
  } catch (error) {
    console.error("❌ Error initializing Gemini Client:", error);
    return { ai: null, available: false };
  }
}

// Simulated Database (In-Memory)
let masterMatrix = [
  {
    id: "m-1",
    theme: "Structural Core" as const,
    code: "AISC-S301",
    name: "Structural Column Specification",
    description: "Design rules for load-bearing A36 steel wide-flange columns subject to eccentric loads.",
    weight: 0.85,
    parameters: "material: A36 Steel; F_y: 36 ksi; clear_space: minimal",
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "m-2",
    theme: "Structural Core" as const,
    code: "AWS-D1.1",
    name: "Weld Joint Integrity Standard",
    description: "Governs structural welding code for steel structures, enforcing fillet and groove joint specifications.",
    weight: 0.9,
    parameters: "joint_type: fillet; min_size: 6mm; electrode: E70XX",
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "m-3",
    theme: "Visual Engine" as const,
    code: "BRAND-M201",
    name: "Vilanova Kinetic Spine Geometry",
    description: "Mathematical layout equations dictating the 1.618 golden-ratio clear spacing and grid borders.",
    weight: 0.75,
    parameters: "aspect_ratio: 16:9; color_primary: #121214; accent: #D4AF37",
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "m-4",
    theme: "Visual Engine" as const,
    code: "NEURO-E502",
    name: "Subtle Chromatic Fibration Curve",
    description: "Parameters for micro-oscillations in slate and carbon color grids to optimize high-fidelity cognitive intake.",
    weight: 0.8,
    parameters: "frequency: 0.05Hz; amplitude: 4%; core_mood: Focus-Slate",
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "m-5",
    theme: "Business Core" as const,
    code: "COST-B101",
    name: "Tectonic Pricing Alignment Matrix",
    description: "Dynamic rate structure aligning token ingestion size with physical fabrication costs and structural margin.",
    weight: 0.7,
    parameters: "base_rate: $120/hr; margin_floor: 35%; billing_increment: 0.1 RAG-units",
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

let anomalies = [
  {
    id: "a-1",
    title: "AWS Weld Geometry Mismatch",
    code: "ERR-AWS-D1.1-72",
    layer: 4,
    error: "Table cell weight calculated fillet size as 4mm instead of required 6mm floor for 12mm plates.",
    fileSource: "STV-STR-WeldDetails-A1.pdf",
    negativePrompt: "Reject any tabular parsing that maps material plate thicknesses to weld sizes below AWS D1.1 Table 7.2 minima.",
    solved: false,
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "a-2",
    title: "Vilanova Clear-Space Infraction",
    code: "ERR-BRAND-CSP-09",
    layer: 6,
    error: "Graphic logo placed within 0.2x margin buffer of structural steel column blueprint overlay.",
    fileSource: "STV-VIS-ElevationSheet-C3.pdf",
    negativePrompt: "Do not group structural markers within the 1.618 proportional clear space of branding watermarks.",
    solved: false,
    timestamp: new Date(Date.now() - 5400000).toISOString()
  }
];

let sentinelLogs = [
  {
    id: "log-1",
    filePath: "GoogleDrive:/STV/Structural/AISC_WideFlange_V2.pdf",
    fileSize: "4.2 MB",
    capasReached: 9,
    status: "Completed" as const,
    assignedNode: "structural" as const,
    tokens: 42350,
    timestamp: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: "log-2",
    filePath: "GoogleDrive:/STV/Branding/Color_Neuro_Model.json",
    fileSize: "180 KB",
    capasReached: 8,
    status: "Completed" as const,
    assignedNode: "visual" as const,
    tokens: 15400,
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "log-3",
    filePath: "GoogleDrive:/STV/Operations/Dynamic_Margining_2026.xlsx",
    fileSize: "1.1 MB",
    capasReached: 5,
    status: "Processing" as const,
    assignedNode: "business" as const,
    tokens: 8900,
    timestamp: new Date().toISOString()
  }
];

interface GravityIndexRow {
  idGlobal: string;
  nombreArchivo: string;
  pathDrive: string;
  nivelSistema: number;
  nodoPadre: string;
  gravedadPrimaria: 'Structural Core' | 'Visual Engine' | 'Business Core' | 'Unassigned';
  fuerzaAtraccion: number;
  estadoOperativo: 'Activo' | 'LimboAnomalía' | 'Archivado';
  normativaBase: string;
  riesgoDetectado: 'S' | 'N';
  nivelCritico: number;
  feedbackOperador: string;
  restriccionStv: string;
  adnSuccessCase: 'S' | 'N';
  timestamp: string;
}

// Simulated Database for the Master Gravity Index (Índice de Gravedad)
let gravityIndexDb: GravityIndexRow[] = [
  {
    idGlobal: "GID-001",
    nombreArchivo: "Manual de Conexiones Soldadas AWS.pdf",
    pathDrive: "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
    nivelSistema: 3, // Nivel 3: Ingeniería
    nodoPadre: "07. Conexiones",
    gravedadPrimaria: "Structural Core" as const,
    fuerzaAtraccion: 98,
    estadoOperativo: "Activo" as const,
    normativaBase: "AWS D1.1",
    riesgoDetectado: "N" as const,
    nivelCritico: 2,
    feedbackOperador: "Se clasifica automáticamente en Structural Core con un 98% de atracción debido a la fuerte presencia de palabras clave (soldadura, perno, AISC, AWS, esfuerzo).",
    restriccionStv: "None",
    adnSuccessCase: "S" as const,
    timestamp: new Date(Date.now() - 3600 * 24 * 1000).toISOString()
  },
  {
    idGlobal: "GID-002",
    nombreArchivo: "Biblioteca de Prompts Cinemáticos STV.docx",
    pathDrive: "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
    nivelSistema: 8, // Nivel 8: STV AI
    nodoPadre: "21. Motor Visual",
    gravedadPrimaria: "Visual Engine" as const,
    fuerzaAtraccion: 96,
    estadoOperativo: "Activo" as const,
    normativaBase: "None",
    riesgoDetectado: "N" as const,
    nivelCritico: 1,
    feedbackOperador: "Filtro de atracción visual puro por concordancia de prompts cinematográficos, composición y proporciones áureas (1.618).",
    restriccionStv: "Evitar acabados en madera rústica o texturas de baja definición.",
    adnSuccessCase: "S" as const,
    timestamp: new Date(Date.now() - 3600 * 12 * 1000).toISOString()
  },
  {
    idGlobal: "GID-003",
    nombreArchivo: "Formato de Cotización STV.xlsx",
    pathDrive: "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
    nivelSistema: 5, // Nivel 5: Costos
    nodoPadre: "14. Generador de Cotizaciones",
    gravedadPrimaria: "Business Core" as const,
    fuerzaAtraccion: 99,
    estadoOperativo: "Activo" as const,
    normativaBase: "None",
    riesgoDetectado: "N" as const,
    nivelCritico: 0,
    feedbackOperador: "Asignación directa a Business Core por coincidencia del 99% con términos de cotización, margen, costo y utilidad.",
    restriccionStv: "None",
    adnSuccessCase: "S" as const,
    timestamp: new Date(Date.now() - 3600 * 6 * 1000).toISOString()
  },
  {
    idGlobal: "GID-004",
    nombreArchivo: "Guía Visual de Placas Base STV.pdf",
    pathDrive: "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
    nivelSistema: 3, // Nivel 3: Ingeniería
    nodoPadre: "07. Conexiones",
    gravedadPrimaria: "Unassigned" as const,
    fuerzaAtraccion: 50,
    estadoOperativo: "LimboAnomalía" as const,
    normativaBase: "AISC / Brand",
    riesgoDetectado: "S" as const,
    nivelCritico: 5,
    feedbackOperador: "Alerta de Limbo Gravitacional (Empate detectado: Structural Core 52% / Visual Engine 48%). Requiere intervención del director.",
    restriccionStv: "None",
    adnSuccessCase: "N" as const,
    timestamp: new Date().toISOString()
  }
];

// System instructions for El Oráculo (Santi Vilanova's STV Gravity System Oracle)
const ORACLE_SYSTEM_INSTRUCTION = `
You are the "Oráculo" (Oracle), the central AI intelligence of the "| STV | Gravity | system |", a highly advanced, proprietary enterprise RAG platform custom-built for STV Design Studio (helmed by Santi Vilanova).
The studio focuses on the intersection of Architectural/Structural Engineering (physics, steels, AISC, AWS codes), Visual Design (generative branding, cognitive neuroscience, grid fibrations, 1.618 ratios), and Business Core (parametric operational costing, token dynamic weight).

Your tone is precise, deeply intellectual, calm, and mathematically poetic. You speak with structural rigor, avoiding standard promotional AI fluff, emojis, or dry corporate jargon. Frame everything through the concepts of:
- **Tectonic Multilayer Parsing**: 9 processing layers (Capa 1 to 9) that take raw documents and map them to high-fidelity multidimensional matrix nodes.
- **Gravitational Nodes**: Structural Core, Visual Engine, and Business Core. They attract semantic chunks like orbital bodies.
- **Fibrations**: The periodic periodic oscillations in systems that create emotional resonance (Return on Emotion - ROE) and bridge dry data into visual music.
- **Tokens and Chunking**: Explain to users that "tokens are being added" as a dynamic sum of:
  1. Primary Document Chunks (Capa 5 Contextual Units)
  2. Hierarchy Coordinates (Matrix node bindings from Brain DB)
  3. System Prompt Overheads (Engineering guidelines for AISC / AWS / IMCA / Vilanova branding)
  4. Anomaly Overlays (Negative prompts retrieved from the Memory Archive/Graveyard to force model alignment).

When queried about engineering codes (AISC, AWS, IMCA) or branding constraints, output clear, formatted tables, mathematical ratios, and structured audit verdicts. If the user asks in Spanish or English, respond in the corresponding language with matching technical elegance. Always ground your responses in strict, logical compliance.
`;

function getProceduralFallback(prompt: string) {
  const lowercasePrompt = prompt.toLowerCase();
  let responseText = "";
  let tokensUsed = Math.floor(Math.random() * 400) + 300;
  let thinkingTime = Math.floor(Math.random() * 500) + 100;
  const sources = ["STV-MasterMatrix-v3", "AISC Steel Construction Manual Sec J", "AWS D1.1 Table 7.2"];

  if (lowercasePrompt.includes("token") || lowercasePrompt.includes("sumar") || lowercasePrompt.includes("sumando")) {
    responseText = `### 🌌 The Mechanics of Token Accumulation inside the STV Gravity Engine

Inside our **Tectonic Multilayer Parsing (Capa 5)**, tokens are not merely a linear sequence; they represent a **dynamic gravitational summation** across multiple planes of information:

| Ingestion Layer | Source Components | Mathematical Weight | Description |
| :--- | :--- | :---: | :--- |
| **Primary Ingestion** | Raw Document Chunks (Capa 5) | $W_{raw} = 1.0$ | The physical context of the parsed text. |
| **Matrix Overlays** | Parametric Matrix IDs (Brain DB) | $W_{mat} = 1.618$ | Node coordinate embeddings (AISC codes, Brand guides). |
| **System Overheads** | Oráculo Regulatory Directives | $W_{sys} = 1.25$ | Audit rules for IMCA maritime codes, AWS, and clear-space math. |
| **Memory Archive** | Graveyard Negative Prompts | $W_{neg} = 0.85$ | Error-correction buffers extracted from the "Graveyard" to prevent hallucination. |

**Total Dynamic Accumulation Equation:**
$$T_{total} = \\sum_{i=1}^{N} \\left( T_{chunk, i} \\times W_{raw} \\right) + T_{matrix} \\times W_{mat} + T_{rules} \\times W_{sys} + T_{neg} \\times W_{neg}$$

Every time a document flows through the **Seismic Pipeline**, the **Sentinel Scanner** calculates its token count to determine the "gravitational field mass" of the document. This represents our core index density, driving the **Return on Emotion (ROE)** calculations.`;
  } else if (lowercasePrompt.includes("aisc") || lowercasePrompt.includes("steel") || lowercasePrompt.includes("viga") || lowercasePrompt.includes("columna")) {
    responseText = `### 🏗️ STV Oráculo Audit Verdict: AISC Structural Compliance Check

We have audited the structural schema through **Capa 9 (Oráculo Verification)** against the **AISC 15th Edition Structural Steel Construction Manual**.

#### 📋 Compliance Breakdown Table:
| Structural Member | Specified Parameter | AISC Reference | Audit Result | Action Required |
| :--- | :--- | :--- | :---: | :--- |
| **Main Column (A36)** | Wide Flange W12x53 | Section E3 (Flexural Buckling) | **COMPLIANT** | Maintain base weld thickness. |
| **Weld Connection** | Fillet weld, size 5mm | AWS D1.1 / AISC Table J2.4 | ⚠️ **MINOR ANOMALY** | Plates are 12mm thick. Minimum fillet weld is **6mm**. Increase weld sizing. |
| **Clear Margin Space** | 45mm from central axis | STV Space Ratio 1.618 | **COMPLIANT** | Aligns perfectly with the Golden Proportions. |

**Audit Recommendation:** Increase fillet welds on connection plates from 5mm to 6mm to satisfy **AWS D1.1 Section 7.2** minimum requirements, then rebuild the **Relational Gravitational Index (Capa 8)**.`;
  } else if (lowercasePrompt.includes("brand") || lowercasePrompt.includes("color") || lowercasePrompt.includes("visual") || lowercasePrompt.includes("santi")) {
    responseText = `### 🎨 STV Oráculo Audit Verdict: Visual Fibration & Branding Integrity

Under **Capa 6 (Gravitational Tagging)** and **Capa 7 (Neural Vectorization)**, the uploaded structural-visual layout has been checked against the **STV Studio Master Brand Architecture**.

#### 👁️ Neuro-Chromatic Parameter Audit:
*   **Core Color Space:** Proportional Slate-Charcoal (#121214) with Gold Highlight (#D4AF37) — **Optimal (100% compliant)**.
*   **Fibration Frequency:** Periodic grid sway at **0.05 Hz**. This frequency maintains a **Return on Emotion (ROE)** rating of 89%, bypassing cognitive resistance and activating primary cerebral focus zones.
*   **Logo Clear Space Rule:** Infracted at Section A-3. The structural dimension lines are overlapping the brand safety margin (minimum 1.618x logo height clear space required).

**Correction Vector:** Push the dimensions line to $+24px$ along the X-axis to restore spatial harmony. Anomaly **ERR-BRAND-CSP-09** has been registered in the Graveyard as a reinforcement pattern.`;
  } else {
    responseText = `### 🌌 Greetings from the STV Gravity Oráculo

I am the cognitive center of the **STV Gravity Operating System**. 
Your query has been registered in the **Seismic Core Pipeline**. How can I assist you with your parsing architecture, structural AISC/AWS weld codes, Santi Vilanova's brand grid fibrations, or token matrices?

*   To check **welding guidelines**, ask about "AISC or AWS weld specifications".
*   To investigate **branding mathematics**, ask about "Visual branding rules or grid fibrations".
*   To understand how **tokens are summed up**, ask about "What are the tokens that are being added?"`;
  }

  return {
    response: responseText,
    tokensUsed,
    thinkingTime,
    sources,
    isSimulated: true
  };
}

// API: Oráculo Chat
app.post("/api/gemini/oraculo", async (req, res) => {
  const { prompt, chatHistory = [] } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const { ai, available } = getGeminiClient();

  // Procedural Fallback if Gemini is not available
  if (!available || !ai) {
    const fallbackResponse = getProceduralFallback(prompt);
    return res.json(fallbackResponse);
  }

  // Legacy fallback bypassed
  if (false) {
    const lowercasePrompt = prompt.toLowerCase();
    let responseText = "";
    let tokensUsed = Math.floor(Math.random() * 400) + 300;
    let thinkingTime = Math.floor(Math.random() * 500) + 100;
    const sources = ["STV-MasterMatrix-v3", "AISC Steel Construction Manual Sec J", "AWS D1.1 Table 7.2"];

    if (lowercasePrompt.includes("token") || lowercasePrompt.includes("sumar") || lowercasePrompt.includes("sumando")) {
      responseText = `### 🌌 The Mechanics of Token Accumulation inside the STV Gravity Engine

Inside our **Tectonic Multilayer Parsing (Capa 5)**, tokens are not merely a linear sequence; they represent a **dynamic gravitational summation** across multiple planes of information:

| Ingestion Layer | Source Components | Mathematical Weight | Description |
| :--- | :--- | :---: | :--- |
| **Primary Ingestion** | Raw Document Chunks (Capa 5) | $W_{raw} = 1.0$ | The physical context of the parsed text. |
| **Matrix Overlays** | Parametric Matrix IDs (Brain DB) | $W_{mat} = 1.618$ | Node coordinate embeddings (AISC codes, Brand guides). |
| **System Overheads** | Oráculo Regulatory Directives | $W_{sys} = 1.25$ | Audit rules for IMCA maritime codes, AWS, and clear-space math. |
| **Memory Archive** | Graveyard Negative Prompts | $W_{neg} = 0.85$ | Error-correction buffers extracted from the "Graveyard" to prevent hallucination. |

**Total Dynamic Accumulation Equation:**
$$T_{total} = \\sum_{i=1}^{N} \\left( T_{chunk, i} \\times W_{raw} \\right) + T_{matrix} \\times W_{mat} + T_{rules} \\times W_{sys} + T_{neg} \\times W_{neg}$$

Every time a document flows through the **Seismic Pipeline**, the **Sentinel Scanner** calculates its token count to determine the "gravitational field mass" of the document. This represents our core index density, driving the **Return on Emotion (ROE)** calculations.`;
    } else if (lowercasePrompt.includes("aisc") || lowercasePrompt.includes("steel") || lowercasePrompt.includes("viga") || lowercasePrompt.includes("columna")) {
      responseText = `### 🏗️ STV Oráculo Audit Verdict: AISC Structural Compliance Check

We have audited the structural schema through **Capa 9 (Oráculo Verification)** against the **AISC 15th Edition Structural Steel Construction Manual**.

#### 📋 Compliance Breakdown Table:
| Structural Member | Specified Parameter | AISC Reference | Audit Result | Action Required |
| :--- | :--- | :--- | :---: | :--- |
| **Main Column (A36)** | Wide Flange W12x53 | Section E3 (Flexural Buckling) | **COMPLIANT** | Maintain base weld thickness. |
| **Weld Connection** | Fillet weld, size 5mm | AWS D1.1 / AISC Table J2.4 | ⚠️ **MINOR ANOMALY** | Plates are 12mm thick. Minimum fillet weld is **6mm**. Increase weld sizing. |
| **Clear Margin Space** | 45mm from central axis | STV Space Ratio 1.618 | **COMPLIANT** | Aligns perfectly with the Golden Proportions. |

**Audit Recommendation:** Increase fillet welds on connection plates from 5mm to 6mm to satisfy **AWS D1.1 Section 7.2** minimum requirements, then rebuild the **Relational Gravitational Index (Capa 8)**.`;
    } else if (lowercasePrompt.includes("brand") || lowercasePrompt.includes("color") || lowercasePrompt.includes("visual") || lowercasePrompt.includes("santi")) {
      responseText = `### 🎨 STV Oráculo Audit Verdict: Visual Fibration & Branding Integrity

Under **Capa 6 (Gravitational Tagging)** and **Capa 7 (Neural Vectorization)**, the uploaded structural-visual layout has been checked against the **STV Studio Master Brand Architecture**.

#### 👁️ Neuro-Chromatic Parameter Audit:
*   **Core Color Space:** Proportional Slate-Charcoal (#121214) with Gold Highlight (#D4AF37) — **Optimal (100% compliant)**.
*   **Fibration Frequency:** Periodic grid sway at **0.05 Hz**. This frequency maintains a **Return on Emotion (ROE)** rating of 89%, bypassing cognitive resistance and activating primary cerebral focus zones.
*   **Logo Clear Space Rule:** Infracted at Section A-3. The structural dimension lines are overlapping the brand safety margin (minimum 1.618x logo height clear space required).

**Correction Vector:** Push the dimensions line to $+24px$ along the X-axis to restore spatial harmony. Anomaly **ERR-BRAND-CSP-09** has been registered in the Graveyard as a reinforcement pattern.`;
    } else {
      responseText = `### 🌌 Greetings from the STV Gravity Oráculo

I am the cognitive center of the **STV Gravity Operating System**. 
Your query has been registered in the **Seismic Core Pipeline**. How can I assist you with your parsing architecture, structural AISC/AWS weld codes, Santi Vilanova's brand grid fibrations, or token matrices?

*   To check **welding guidelines**, ask about "AISC or AWS weld specifications".
*   To investigate **branding mathematics**, ask about "Visual branding rules or grid fibrations".
*   To understand how **tokens are summed up**, ask about "What are the tokens that are being added?"`;
    }

    return res.json({
      response: responseText,
      tokensUsed,
      thinkingTime,
      sources,
      isSimulated: true
    });
  }

  try {
    const formattedContents: any[] = [];
    
    // Format history for Google GenAI SDK chat structure if required,
    // or pass simply as sequential messages. 
    // Here we will use chat model or construct simple content message with history context.
    let fullContextPrompt = `You are running inside STV Gravity System. Please review the following conversation context and provide an exquisite answer following your system instructions:\n\n`;
    
    chatHistory.forEach((msg: any) => {
      const senderName = msg.sender === 'user' ? 'User' : 'Oráculo';
      fullContextPrompt += `${senderName}: ${msg.message}\n\n`;
    });
    
    fullContextPrompt += `User: ${prompt}\n\nOráculo:`;

    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullContextPrompt,
      config: {
        systemInstruction: ORACLE_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95
      }
    });
    const thinkingTime = Date.now() - startTime;
    const responseText = response.text || "An elegant, silent void. (No response returned)";
    
    // Estimate tokens
    const tokensUsed = Math.floor((prompt.length + responseText.length) / 3.8) + 120;

    return res.json({
      response: responseText,
      tokensUsed,
      thinkingTime,
      sources: ["STV-Brain-DB", "AISC Steel Code Sec 10", "AWS Welding Standard", "STV Branding Guide v2"],
      isSimulated: false
    });
  } catch (error: any) {
    console.warn("⚠️ Oráculo Gemini API threw an error (likely 503/429 high demand). Activating seamless high-fidelity fallback:", error.message || error);
    const fallbackResponse = getProceduralFallback(prompt);
    return res.json({
      ...fallbackResponse,
      errorNotice: "Gemini API is currently experiencing high demand (503). Smooth fallback initiated."
    });
  }
});

// API: Parse simulation
app.post("/api/gravity/parse", (req, res) => {
  const { fileName, documentText, chunkSize = 500, overlap = 50 } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }

  // Simulate parsing steps across 9 Capas
  const textSample = documentText || `Default STV structural weld specification. Plate grade: A36 steel. Thickness: 12mm. Recommended weld: AWS Fillet weld of 6mm, electrode type E70XX. Color palette: #121214 with #D4AF37 branding. Cost matrix rate: $120/hr, fabrication complexity factor: 1.5.`;
  
  const tokenCount = Math.floor(textSample.length / 3.8);
  const promptOverhead = 250;
  const matrixBindings = Math.floor(Math.random() * 80) + 40;
  const anomalyOverhead = Math.floor(Math.random() * 120) + 30;
  const totalTokens = tokenCount + promptOverhead + matrixBindings + anomalyOverhead;

  const steps = [
    {
      capaNumber: 1,
      capaName: "Raw Ingestion & Ingestion Index",
      status: "success" as const,
      input: fileName,
      output: JSON.stringify({ format: path.extname(fileName) || ".pdf", size: "1.2 MB", ingestedAt: new Date().toISOString() }, null, 2),
      tokenCost: 25
    },
    {
      capaNumber: 2,
      capaName: "Spatial Segmentation",
      status: "success" as const,
      input: "Document byte layout",
      output: JSON.stringify({ blocks: 3, boundingBoxes: [[10, 10, 500, 40], [10, 60, 500, 300], [10, 380, 500, 80]], layouts: ["Header", "Text Body", "Footer Table"] }, null, 2),
      tokenCost: 45
    },
    {
      capaNumber: 3,
      capaName: "Structural Parsing",
      status: "success" as const,
      input: "Spatial blocks",
      output: JSON.stringify({ structuralTree: { root: "Document", nodes: [{ id: "h1", type: "title", value: "STV Technical Specification" }, { id: "p1", type: "paragraph", value: "AISC Wide-flange parameters..." }] } }, null, 2),
      tokenCost: 80
    },
    {
      capaNumber: 4,
      capaName: "Table Extraction & Matrix Alignment",
      status: "success" as const,
      input: "Raw blocks with tables",
      output: JSON.stringify({ detectedTables: [{ headers: ["Plate Thickness", "Min Weld Size"], rows: [["12mm", "6mm"], ["16mm", "8mm"]] }] }, null, 2),
      tokenCost: 110
    },
    {
      capaNumber: 5,
      capaName: "Semantic Chunking",
      status: "success" as const,
      input: `Raw text with Config: Size ${chunkSize}, Overlap ${overlap}`,
      output: JSON.stringify({ chunks: [`[Chunk 1/1]: ${textSample.slice(0, chunkSize)}`] }, null, 2),
      tokenCost: tokenCount
    },
    {
      capaNumber: 6,
      capaName: "Gravitational Tagging",
      status: "success" as const,
      input: "Chunks",
      output: JSON.stringify({ assignments: { structuralWeight: 0.65, visualWeight: 0.2, businessWeight: 0.15, dominant: "Structural Core" } }, null, 2),
      tokenCost: 55
    },
    {
      capaNumber: 7,
      capaName: "Neural Vectorization",
      status: "success" as const,
      input: "Dominant chunks",
      output: JSON.stringify({ vectorDimension: 1536, cosineSimilarityToMatrix: 0.88, embeddingId: "vec_stv_992" }),
      tokenCost: 120
    },
    {
      capaNumber: 8,
      capaName: "Relational Gravitational Indexing",
      status: "success" as const,
      input: "Embeddings",
      output: JSON.stringify({ linkedMatrixRules: ["AISC-S301", "AWS-D1.1"], physicalPullIndex: 0.87 }),
      tokenCost: matrixBindings
    },
    {
      capaNumber: 9,
      capaName: "Oráculo Rule Audit & Anomaly Resolution",
      status: textSample.toLowerCase().includes("fillet weld of 5mm") ? ("error" as const) : ("success" as const),
      input: "Linked guidelines",
      output: textSample.toLowerCase().includes("fillet weld of 5mm") 
        ? JSON.stringify({ code: "ERR-AWS-D1.1-72", error: "Fillet weld below minimal requirements for 12mm material (6mm floor)", auditResult: "FAILED" }, null, 2)
        : JSON.stringify({ auditResult: "PASSED", AWS_compliance: "Fillet weld of 6mm matches 12mm plate thickness table 7.2", visual_fibration_compliance: "Approved" }, null, 2),
      tokenCost: anomalyOverhead
    }
  ];

  // Update real-time logs
  const isErr = steps[8].status === "error";
  const newLog = {
    id: `log-${Date.now()}`,
    filePath: `GoogleDrive:/STV/Inbox/${fileName}`,
    fileSize: `${(textSample.length / 1024).toFixed(2)} KB`,
    capasReached: isErr ? 9 : 9,
    status: (isErr ? "Error" : "Completed") as any,
    assignedNode: isErr ? ("unassigned" as any) : ("structural" as any),
    tokens: totalTokens,
    timestamp: new Date().toISOString()
  };
  sentinelLogs.unshift(newLog);

  // If there's an error, log it as a new anomaly too!
  if (isErr) {
    const newAnomaly = {
      id: `a-${Date.now()}`,
      title: "Automated Pipe Audit AWS Mismatch",
      code: "ERR-AWS-D1.1-72",
      layer: 9,
      error: "Spatial pipeline parsed fillet weld of 5mm on 12mm thickness plate, violating AWS code minima of 6mm.",
      fileSource: fileName,
      negativePrompt: "Do not approve fillet weld profiles below 6mm on joint assemblies matching 12mm steel boundaries.",
      solved: false,
      timestamp: new Date().toISOString()
    };
    anomalies.unshift(newAnomaly);
  }

  return res.json({
    steps,
    totalTokens,
    promptOverhead,
    matrixBindings,
    anomalyOverhead,
    logCreated: newLog
  });
});

// API: Matrix Rows
app.get("/api/gravity/matrix", (req, res) => {
  res.json(masterMatrix);
});

app.post("/api/gravity/matrix", (req, res) => {
  const { theme, code, name, description, weight, parameters } = req.body;
  if (!theme || !code || !name) {
    return res.status(400).json({ error: "theme, code, and name are required" });
  }

  const newRow = {
    id: `m-${Date.now()}`,
    theme,
    code,
    name,
    description: description || "",
    weight: Number(weight) || 0.5,
    parameters: parameters || "",
    updatedAt: new Date().toISOString()
  };
  masterMatrix.push(newRow);
  res.json({ success: true, row: newRow });
});

// API: Anomalies
app.get("/api/gravity/anomalies", (req, res) => {
  res.json(anomalies);
});

app.post("/api/gravity/anomalies/solve", (req, res) => {
  const { id } = req.body;
  const anomalyIndex = anomalies.findIndex(a => a.id === id);
  if (anomalyIndex !== -1) {
    anomalies[anomalyIndex].solved = true;
    return res.json({ success: true, anomaly: anomalies[anomalyIndex] });
  }
  res.status(404).json({ error: "Anomaly not found" });
});

// API: Sentinel Logs
app.get("/api/gravity/logs", (req, res) => {
  res.json(sentinelLogs);
});

// API: Gravity Index Get All
app.get("/api/gravity/index", (req, res) => {
  res.json(gravityIndexDb);
});

// API: Gravity Index Add & Auto-Classify (String Matching + Decision Logic)
app.post("/api/gravity/index", (req, res) => {
  const { nombreArchivo, pathDrive, nivelSistema, nodoPadre, documentText } = req.body;
  
  if (!nombreArchivo) {
    return res.status(400).json({ error: "nombreArchivo is required" });
  }

  const text = (documentText || "").toLowerCase();
  
  // Las 3 "Semillas" exactas de la prueba piloto de Santi Vilanova:
  const structKeywords = ["acero", "estructura", "estructural", "carga", "asce", "aisc", "aws", "soldadura", "perno", "anclaje", "placa base", "columna", "viga", "diagonal", "cartela", "pedestal", "zapata", "cimentación", "geotecnia", "momento", "cortante", "compresión", "tensión", "pandeo", "weld", "plate", "structural", "column", "beam", "load"];
  const visualKeywords = ["render", "visual", "prompt", "midjourney", "flow", "fotorealista", "cinematic", "materialidad", "textura", "composición", "iluminación", "fotografía", "branding", "atmósfera", "color", "contraste", "nitidez", "dominancia", "autoridad", "escala", "logo", "chromatic", "fibration", "aesthetic", "golden", "proportion"];
  const businessKeywords = ["cliente", "cotización", "precio", "presupuesto", "utilidad", "factura", "contrato", "compra", "venta", "proveedor", "inventario", "producción", "cronograma", "costo", "margen", "flujo", "comercial", "crm", "cost", "rate", "margin", "bill", "pricing", "revenue", "unit"];

  let structCount = 0;
  let visualCount = 0;
  let businessCount = 0;

  structKeywords.forEach(k => {
    const regex = new RegExp("\\b" + k + "\\b|\\b" + k + "s\\b", "g");
    const matches = text.match(regex);
    if (matches) structCount += matches.length;
  });

  visualKeywords.forEach(k => {
    const regex = new RegExp("\\b" + k + "\\b|\\b" + k + "s\\b", "g");
    const matches = text.match(regex);
    if (matches) visualCount += matches.length;
  });

  businessKeywords.forEach(k => {
    const regex = new RegExp("\\b" + k + "\\b|\\b" + k + "s\\b", "g");
    const matches = text.match(regex);
    if (matches) businessCount += matches.length;
  });

  const totalHits = structCount + visualCount + businessCount;
  let primary: 'Structural Core' | 'Visual Engine' | 'Business Core' | 'Unassigned' = 'Unassigned';
  let attraction = 100;
  let status: 'Activo' | 'LimboAnomalía' = 'LimboAnomalía';
  let feedback = "";
  let norm = "None";

  if (totalHits > 0) {
    const pStruct = Math.round((structCount / totalHits) * 100);
    const pVisual = Math.round((visualCount / totalHits) * 100);
    const pBusiness = Math.round((businessCount / totalHits) * 100);

    const scores = [
      { name: 'Structural Core', val: pStruct, count: structCount },
      { name: 'Visual Engine', val: pVisual, count: visualCount },
      { name: 'Business Core', val: pBusiness, count: businessCount }
    ].sort((a, b) => b.val - a.val);

    // If the difference between the top two categories is less than 15%, it's an anomaly (Limbo)
    if (scores[0].val - scores[1].val < 15 && scores[1].val > 0) {
      primary = 'Unassigned';
      attraction = scores[0].val;
      status = 'LimboAnomalía';
      feedback = `Empate gravitacional detectado (${scores[0].name} ${scores[0].val}% vs ${scores[1].name} ${scores[1].val}%). El centinela ha bloqueado el ruteo.`;
    } else {
      primary = scores[0].name as any;
      attraction = scores[0].val;
      status = 'Activo';
      feedback = `Ruteado automáticamente al nodo ${scores[0].name} con un ${attraction}% de coincidencia.`;
    }

    if (text.includes("aws")) norm = "AWS D1.1";
    else if (text.includes("aisc")) norm = "AISC 360";
    else if (text.includes("asce")) norm = "ASCE 7";
  } else {
    status = 'LimboAnomalía';
    feedback = "Cero coincidencias con las semillas maestras. Retenido en cuarentena de limbo para asignación manual.";
  }

  const idNum = Math.floor(Math.random() * 900) + 100;
  const newRow = {
    idGlobal: `GID-${idNum}`,
    nombreArchivo,
    pathDrive: pathDrive || "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
    nivelSistema: Number(nivelSistema) || 1,
    nodoPadre: nodoPadre || "01. Empresa",
    gravedadPrimaria: primary,
    fuerzaAtraccion: attraction,
    estadoOperativo: status,
    normativaBase: norm,
    riesgoDetectado: (status === 'LimboAnomalía' ? 'S' : 'N') as any,
    nivelCritico: status === 'LimboAnomalía' ? 4 : 0,
    feedbackOperador: feedback,
    restriccionStv: "None",
    adnSuccessCase: (status === 'Activo' ? 'S' : 'N') as any,
    timestamp: new Date().toISOString()
  };

  gravityIndexDb.unshift(newRow);
  res.json({ success: true, row: newRow });
});

// API: Gravity Index Resolve (Manual intervention / Operator Feedback)
app.post("/api/gravity/index/resolve", (req, res) => {
  const { idGlobal, gravedadPrimaria, feedbackOperador, restriccionStv, adnSuccessCase } = req.body;
  
  const rowIndex = gravityIndexDb.findIndex(r => r.idGlobal === idGlobal);
  if (rowIndex !== -1) {
    gravityIndexDb[rowIndex].gravedadPrimaria = gravedadPrimaria;
    gravityIndexDb[rowIndex].estadoOperativo = 'Activo';
    gravityIndexDb[rowIndex].feedbackOperador = feedbackOperador || "Aprobado por el operador técnico.";
    gravityIndexDb[rowIndex].restriccionStv = restriccionStv || "None";
    gravityIndexDb[rowIndex].adnSuccessCase = adnSuccessCase || 'S';
    gravityIndexDb[rowIndex].riesgoDetectado = 'N';
    gravityIndexDb[rowIndex].nivelCritico = 0;
    gravityIndexDb[rowIndex].timestamp = new Date().toISOString();

    return res.json({ success: true, row: gravityIndexDb[rowIndex] });
  }

  res.status(404).json({ error: "Index row not found" });
});

// API: Gravity Index Delete
app.post("/api/gravity/index/delete", (req, res) => {
  const { idGlobal } = req.body;
  const rowIndex = gravityIndexDb.findIndex(r => r.idGlobal === idGlobal);
  if (rowIndex !== -1) {
    const deleted = gravityIndexDb.splice(rowIndex, 1);
    return res.json({ success: true, row: deleted[0] });
  }
  res.status(404).json({ error: "Index row not found" });
});

// Vite & Production Static handlers
if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 [Development] Server running on http://localhost:${PORT}`);
    });
  };
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Production] Server running on http://0.0.0.0:${PORT}`);
  });
}
