export type SystemHealthStatus = 'optimal' | 'warning' | 'remediating' | 'critical';

export interface TelemetryMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  status: 'normal' | 'elevated' | 'optimal';
  history: number[];
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  category: 'code' | 'network' | 'auth' | 'document' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  autoResolved: boolean;
  resolutionTimeMs: number;
  remediationSteps: string[];
  aiExplanation: string;
  patchScript?: string;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'sentinel-ai';
  text: string;
  timestamp: string;
  status?: 'analyzing' | 'remediating' | 'resolved';
  actionablePatch?: string;
  autoTriageData?: {
    rootCause: string;
    confidence: number;
    subsystem: string;
  };
}
