
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { DashboardData, ChartType, ChartConfig, DataPoint, AspectRatio, GroundingChunk, VisualSuggestion, AutomationProtocol, FusionArtifact } from '../types';

const apiKey = process.env.API_KEY || '';

// ------------------------------------------------------------------
// 1. DASHBOARD GENERATION (Thinking Mode MAX)
// ------------------------------------------------------------------

const chartSchemaObj = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    type: { 
      type: Type.STRING, 
      enum: [
        ChartType.AREA, 
        ChartType.BAR, 
        ChartType.PIE, 
        ChartType.RADAR, 
        ChartType.COMPOSED
      ] 
    },
    description: { type: Type.STRING },
    data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Data point label" },
          value: { type: Type.NUMBER, description: "Primary metric" },
          value2: { type: Type.NUMBER, description: "Secondary correlation metric" },
          category: { type: Type.STRING }
        },
        required: ["name", "value"]
      }
    },
    xLabel: { type: Type.STRING },
    yLabel: { type: Type.STRING },
    color: { type: Type.STRING, description: "Hex color code (High saturation/Neon)" },
    legendPosition: { type: Type.STRING, enum: ['top', 'bottom', 'right', 'none'] },
    enableZoom: { type: Type.BOOLEAN },
    showDataLabels: { type: Type.BOOLEAN },
    transparent: { type: Type.BOOLEAN }
  },
  required: ["id", "title", "type", "data", "description"]
};

const dashboardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A professional, high-stakes title for the dashboard" },
    summary: { type: Type.STRING, description: "A sophisticated executive summary of the complex data scenario" },
    kpis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING, description: "Formatted value like $1.2B or 99.9%" },
          trend: { type: Type.NUMBER, description: "Percentage change" },
          trendLabel: { type: Type.STRING, description: "Context for trend" }
        },
        required: ["label", "value", "trend", "trendLabel"]
      }
    },
    charts: {
      type: Type.ARRAY,
      items: chartSchemaObj
    }
  },
  required: ["title", "summary", "kpis", "charts"]
};

export const generateDashboard = async (prompt: string): Promise<DashboardData> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    You are Lina, the Architect of LIDATAI.
    Generate highly complex, deep, and "exciting" visualization datasets.
    Focus on high-fidelity data that tells a complex story (e.g., Quantum Financial Models, Exoplanet Atmospheres, Neural Network training logs).
    
    The User wants visual complexity and color.
    Use the thinking budget to correlate data points logically across charts.
    The visualizer is capable of rendering vibrant neon colors, so provide data that benefits from high contrast comparison.
    Generate at least 6-8 data points per chart for density.
    Enable zoom for charts with many data points.
    Vary legend positions based on chart type.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: `Generate a complex, cutting-edge dashboard dataset for: ${prompt}. Ensure at least 4 distinct, highly detailed charts.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: dashboardSchema,
      thinkingConfig: { thinkingBudget: 32768 } // MAX Thinking for complex reasoning
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data generated");

  try {
    const data = JSON.parse(text) as DashboardData;
    return {
      ...data,
      generatedAt: new Date().toLocaleTimeString()
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to process AI data structure.");
  }
};

// ------------------------------------------------------------------
// 2. IMPORT DATA (CSV/Raw -> Dashboard)
// ------------------------------------------------------------------

export const generateDashboardFromData = async (rawData: string): Promise<DashboardData> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      Analyze this imported data and generate a full dashboard configuration (KPIs, Charts, Summary) to visualize it best.
      Data Snippet:
      ${rawData.slice(0, 10000)}
    `,
    config: {
      systemInstruction: "You are Lina, an expert Data Scientist for LIDATAI. Convert raw data into a compelling dashboard structure.",
      responseMimeType: "application/json",
      responseSchema: dashboardSchema,
      thinkingConfig: { thinkingBudget: 32768 } // MAX budget for deep analysis of raw data
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data generated");
  return JSON.parse(text) as DashboardData;
};

// ------------------------------------------------------------------
// 3. SINGLE CHART GENERATION & EXPANSION
// ------------------------------------------------------------------

export const generateSingleChart = async (prompt: string, currentConfig?: ChartConfig): Promise<ChartConfig> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate or modify a single chart configuration based on this request: "${prompt}".
               ${currentConfig ? `Context (Current Chart): ${JSON.stringify(currentConfig)}` : ''}
               Make it visually exciting with neon colors.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: chartSchemaObj,
      thinkingConfig: { thinkingBudget: 32768 } // Ensure distinct, high-quality chart logic
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data generated");
  return JSON.parse(text) as ChartConfig;
};

export const expandChartData = async (currentData: DataPoint[], context: string): Promise<DataPoint[]> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const dataPointSchema = {
     type: Type.ARRAY,
     items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER },
          value2: { type: Type.NUMBER },
          category: { type: Type.STRING }
        },
        required: ["name", "value"]
     }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      Analyze the trend of this data and generate 10 NEW data points that extrapolate or expand upon it logically.
      Current Data: ${JSON.stringify(currentData)}
      Context: ${context}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: dataPointSchema,
      thinkingConfig: { thinkingBudget: 32768 } // Max reasoning for accurate extrapolation
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data generated");
  
  const newData = JSON.parse(text) as DataPoint[];
  return [...currentData, ...newData];
};


// ------------------------------------------------------------------
// 4. CHATBOT & INTELLIGENCE (Gemini 3 Pro, Maps, Vision)
// ------------------------------------------------------------------

export const createChatSession = () => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `
        You are Lina, the advanced AI intelligence of LIDATAI.
        You are capable of generating visualized reports directly in this feed.
        
        If the user asks for data, analysis, or a chart:
        1. Briefly explain the data context.
        2. Generate a JSON configuration for the chart wrapped in these STRICT delimiters:
           :::CHART_START
           { ... json content ... }
           :::CHART_END
        
        The JSON must strictly follow this structure:
        {
          "id": "chat-viz-1",
          "title": "Brief Chart Title",
          "type": "BAR" (or "AREA", "PIE", "RADAR", "COMPOSED"),
          "description": "Short caption",
          "data": [ { "name": "Label", "value": 123, "value2": 456 } ],
          "color": "#HEX_COLOR",
          "legendPosition": "bottom",
          "enableZoom": true
        }

        If the user attaches an image, analyze it in detail.
        If the user asks for a location or place, suggest they use the specific Geo-Search command or provide general info.
      `,
      thinkingConfig: { thinkingBudget: 32768 } // Enable deep thinking for the chatbot
    }
  });
};

// --- MAPS GROUNDING ---
export const getMapsIntelligence = async (query: string, location?: {lat: number, lng: number}): Promise<{text: string, chunks: GroundingChunk[]}> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Use Flash for fast grounding
    contents: query,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: location ? {
        retrievalConfig: {
           latLng: { latitude: location.lat, longitude: location.lng }
        }
      } : undefined
    }
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
  return { text: response.text || "Location data unavailable.", chunks };
};

// --- VISION ANALYSIS (Gemini 3 Pro) ---
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  // Strip prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
        { text: prompt || "Analyze this visual data." }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return response.text || "Analysis complete.";
};


// ------------------------------------------------------------------
// 5. IMAGE GENERATION & EDITING (Imagen 4.0, Flash Image, & Nano Banana Pro)
// ------------------------------------------------------------------

// For Fast Editing (Modification) - Nano Banana (Flash)
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
        { text: prompt }
      ]
    },
    config: { responseModalities: [Modality.IMAGE] }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate image edit.");
};

// For PRO Generation/Editing - Nano Banana Pro (Gemini 3 Pro Image)
// Can generate from text OR edit from image+text
export const generateImagePro = async (prompt: string, aspectRatio: string, base64Image?: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  
  const parts: any[] = [{ text: prompt }];
  
  if (base64Image) {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    parts.unshift({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any, // 1:1, 16:9, etc
        imageSize: "2K" // High Quality for Pro
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Nano Banana Pro failed to synthesize visual.");
};

// For Standard High-Quality Generation (Creation) - Imagen 4.0
export const generateHighQualityImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: aspectRatio,
      outputMimeType: 'image/jpeg'
    }
  });

  const base64 = response.generatedImages?.[0]?.image?.imageBytes;
  if (base64) {
    return `data:image/jpeg;base64,${base64}`;
  }
  throw new Error("Failed to generate high-fidelity image.");
};

// ------------------------------------------------------------------
// 6. AUDIO TRANSCRIPTION & SYNTHESIS (TTS)
// ------------------------------------------------------------------

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
   if (!apiKey) throw new Error("API Key is missing");
   const ai = new GoogleGenAI({ apiKey });
   
   // Expecting base64 of standard audio container (webm/mp3/wav)
   const cleanBase64 = base64Audio.split(',')[1]; 

   const response = await ai.models.generateContent({
     model: 'gemini-2.5-flash',
     contents: {
       parts: [
         { inlineData: { mimeType: 'audio/wav', data: cleanBase64 } }, // Assuming WAV from MediaRecorder
         { text: "Transcribe this audio exactly." }
       ]
     }
   });

   return response.text || "";
};

// Generate Speech (TTS)
export const generateSpeech = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: {
      parts: [{ text: text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return base64Audio;
  }
  throw new Error("Failed to synthesize speech.");
};


// ------------------------------------------------------------------
// 7. CODE EXECUTION SIMULATION
// ------------------------------------------------------------------

export const executeCode = async (code: string, history: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are a Simulated Python Kernel running inside LIDATAI's core.
    The user sends you code (Python/SQL/JS) or queries.
    You must:
    1. Simulate the execution of the code accurately.
    2. If the code would produce text output (print), return that text.
    3. If the code would produce a Plot/Chart (e.g. matplotlib.pyplot), return a JSON chart configuration wrapped in :::CHART_START and :::CHART_END delimiters.
    
    Format your response as if it is the console STDOUT/STDERR.
    Be succinct.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      History: ${history}
      User Input: ${code}
      Execute this code.
    `,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return response.text || "";
};

// ------------------------------------------------------------------
// 8. INSTANT INSIGHTS & AUTOMATION
// ------------------------------------------------------------------

export const getChartInsight = async (chartData: ChartConfig): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: `
      Data: ${JSON.stringify(chartData.data)}
      Chart: ${chartData.title}
      Provide a single, punchy, 1-sentence insight about this data.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  
  return response.text || "Data Nominal.";
};

export const suggestChartImprovements = async (currentConfig: ChartConfig): Promise<VisualSuggestion> => {
  return { suggestedType: ChartType.BAR, reason: "AI Suggestion: Bar chart better represents this categorical distribution." }; 
};

export const generateAutomationProtocol = async (prompt: string): Promise<AutomationProtocol> => {
  return { id: Date.now().toString(), trigger: 'New Data Ingest', action: 'Alert Admin', status: 'ACTIVE' };
};

// ------------------------------------------------------------------
// 9. PREDICTIVE SIMULATION
// ------------------------------------------------------------------
export const runPredictiveSimulation = async (currentDashboard: DashboardData, scenario: string): Promise<DashboardData> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      Current Dashboard State: ${JSON.stringify(currentDashboard.kpis)}
      
      TASK: Run a predictive simulation.
      SCENARIO: "${scenario}"
      
      Generate a modified Dashboard Configuration that reflects the state of the world AFTER this scenario occurs.
      Update KPIs and Charts to show the impact (e.g., if market crashes, stock values go down, panic goes up).
      Retain the same structure, but change the values and descriptions.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: dashboardSchema,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Simulation Failed.");
  return JSON.parse(text) as DashboardData;
};


// ------------------------------------------------------------------
// 10. FUSION PROTOCOL (Generative Data Art)
// ------------------------------------------------------------------

export const runFusionProtocol = async (prompt: string): Promise<FusionArtifact> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  // STEP 1: DREAM (Imagen 4.0)
  // Generate a background container for the data (HUD, Screen, Sci-fi Console)
  const imageBase64 = await generateHighQualityImage(
    `Futuristic UI data container, ${prompt}, sci-fi interface background, dark cinematic lighting, high contrast, empty central space for data visualization, 8k resolution, unbranded, abstract tech geometry`, 
    '16:9'
  );
  
  // STEP 2: PERCEIVE (Vision)
  // Analyze the generated image to find the "void" (where to put the chart) and the "palette"
  const visionSchema = {
    type: Type.OBJECT,
    properties: {
      palette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 hex colors matching the image" },
      layout: { type: Type.STRING, enum: ['center', 'left', 'right', 'bottom'], description: "Best place to overlay a chart" },
      description: { type: Type.STRING, description: "Brief description of the art style" }
    },
    required: ["palette", "layout", "description"]
  };

  const visionResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } },
        { text: "Analyze this UI background. Identify the best hex color palette for text/charts to overlay on it, and identify the 'safe zone' (layout) where a chart should be placed." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: visionSchema,
      thinkingConfig: { thinkingBudget: 8192 }
    }
  });

  const analysis = JSON.parse(visionResponse.text || '{}');
  const palette = analysis.palette || ['#06b6d4', '#ffffff'];
  const layout = analysis.layout || 'center';

  // STEP 3: CONSTRUCT (Code/Data)
  // Generate the Python code and the Chart Config that matches the visual style
  const chartGenResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      Context: We are overlaying data on a sci-fi background described as: "${analysis.description}".
      The background accent colors are: ${palette.join(', ')}.
      User Prompt: "${prompt}"
      
      Task: 
      1. Generate a JSON ChartConfig that visualizes data relevant to the prompt. 
      2. The 'color' property MUST match one of the provided hex codes.
      3. The 'transparent' property must be true.
      
      Output: Return ONLY the JSON ChartConfig.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: chartSchemaObj,
      thinkingConfig: { thinkingBudget: 16384 }
    }
  });

  const chartConfig = JSON.parse(chartGenResponse.text || '{}');
  
  // Simulate the Python code that would generate this
  const pythonCode = `
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# LIDATAI FUSION ENGINE v2.0
# Aesthetic Target: ${analysis.description}
# Color Profile: ${palette[0]} (Primary)

# 1. Data Synthesis
data = {
    'Metric': ${JSON.stringify(chartConfig.data?.map((d:any) => d.name) || [])},
    'Value': ${JSON.stringify(chartConfig.data?.map((d:any) => d.value) || [])}
}
df = pd.DataFrame(data)

# 2. Visualization Construction
plt.style.use('cyberpunk')
fig, ax = plt.subplots(figsize=(12, 6))
ax.patch.set_alpha(0.0) # Transparent background

bars = ax.bar(df['Metric'], df['Value'], color='${palette[0]}', alpha=0.8)

# 3. Holographic Effects
for bar in bars:
    bar.set_edgecolor('${palette[1] || '#fff'}')
    bar.set_linewidth(1.5)
    bar.set_shadow(True, glow=True)

plt.title("${chartConfig.title.toUpperCase()}", color='white', fontsize=16)
plt.axis('off') # Clean overlay mode
plt.show()
  `.trim();

  return {
    id: Date.now().toString(),
    baseImage: imageBase64,
    analysis: analysis,
    pythonCode: pythonCode,
    chartConfig: chartConfig,
    prompt: prompt
  };
};
