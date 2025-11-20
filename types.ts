
export enum ChartType {
  AREA = 'AREA',
  BAR = 'BAR',
  PIE = 'PIE',
  RADAR = 'RADAR',
  SCATTER = 'SCATTER',
  COMPOSED = 'COMPOSED'
}

export interface DataPoint {
  name: string;
  value: number;
  value2?: number; // Optional secondary metric
  category?: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  data: DataPoint[];
  description: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  legendPosition?: 'top' | 'bottom' | 'right' | 'none';
  enableZoom?: boolean;
  showDataLabels?: boolean;
  transparent?: boolean; // New for Fusion Mode
}

export interface KPI {
  label: string;
  value: string;
  trend: number; // Percentage, positive or negative
  trendLabel: string;
}

export interface DashboardData {
  title: string;
  summary: string;
  kpis: KPI[];
  charts: ChartConfig[];
  generatedAt: string;
}

export interface GenerationState {
  isGenerating: boolean;
  stage: 'IDLE' | 'ANALYZING' | 'GENERATING' | 'RENDERING' | 'FUSION_PROTOCOL' | 'SIMULATING' | 'SYNTHESIZING_AUDIO';
  progress: number;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  IMAGE_LAB = 'IMAGE_LAB',
  CONSOLE = 'CONSOLE',
  DEVELOPER = 'DEVELOPER',
  FUSION = 'FUSION'
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  mobile?: { title: string; source_id: string };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  attachments?: Attachment[];
  groundingChunks?: GroundingChunk[]; // For Maps/Search results
  audioData?: string; // Base64 MP3/WAV for TTS playback
}

export interface ConsoleEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string; // Text content or JSON for charts
  timestamp: Date;
}

export type DataSourceType = 'FILE' | 'DRIVE' | 'DROPBOX' | 'ZAPIER' | 'NOTION';

export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  lastSync?: string;
}

export interface Attachment {
  type: 'image' | 'file' | 'audio';
  url: string; // Base64 or Blob URL
  name: string;
  mimeType: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3';

export interface ChartTemplate {
  name: string;
  icon: any;
  config: Partial<ChartConfig>;
}

export interface AutomationProtocol {
  id: string;
  trigger: string;
  action: string;
  status: 'ACTIVE' | 'PAUSED';
}

export interface VisualSuggestion {
  suggestedType: ChartType;
  reason: string;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: any;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  latency?: number;
  tokens?: number;
}

export interface FusionArtifact {
  id: string;
  baseImage: string; // Base64
  analysis: {
    palette: string[];
    layout: 'center' | 'left' | 'right' | 'bottom';
    description: string;
  }; 
  pythonCode: string; // The simulated code
  chartConfig: ChartConfig; // The resulting data
  prompt: string;
}

export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string[];
  icon: any;
  action: () => void;
  group: 'Navigation' | 'System' | 'Tools' | 'Theme';
}
