export type WorkspaceType =
  | 'home'
  | 'user-room'
  | 'history'
  | 'settings'
  | 'help'
  | 'pricing'
  | 'student-verify'
  | 'coding'
  | 'student-shield'
  | 'general'
  | 'health'
  | 'market'
  /** Legacy IDs — hidden from nav; still typed for old routes/history */
  | 'image'
  | 'translate'
  | 'document'
  | 'voice'
  | 'memory';

export type HelpSection = 'overview' | 'privacy' | 'terms' | 'contact' | 'license';

export type PlanTier = 'free' | 'student' | 'pro';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface StudentVerification {
  status: VerificationStatus;
  submittedAt?: number;
  reviewedAt?: number;
  reason?: string;
  institutionName?: string;
  expiryDate?: string;
}

export interface Subscription {
  plan: PlanTier;
  studentVerification: StudentVerification;
  subscriptionStatus?: string | null;
  paddleCustomerId?: string | null;
  paddleSubscriptionId?: string | null;
  billingActive?: boolean;
}

export interface AuthUser {
  id?: string;
  signupDate: number;
  name: string;
  email?: string;
  picture?: string;
  launchFree?: boolean;
  trialActive: boolean;
  trialDaysRemaining: number;
  subscription?: Subscription;
}

export interface StudentVerifyResponse {
  approved: boolean;
  reason: string;
  institutionName?: string;
  expiryDate?: string;
  expiryValid?: boolean;
}

export type WorkspaceId = Exclude<
  WorkspaceType,
  'home' | 'user-room' | 'history' | 'settings' | 'help' | 'pricing' | 'student-verify'
>;

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  imageUrl?: string;
  generatedImageUrl?: string;
  liveSearch?: boolean;
}

export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface ChatRequest {
  message: string;
  workspaceId: WorkspaceId;
  imageUrl?: string;
  history?: Pick<Message, 'role' | 'content'>[];
  targetLanguage?: string;
  memoryContext?: string;
  planTier?: PlanTier;
  studentVerified?: boolean;
}

export interface ChatResponse {
  reply: string;
  redirected?: boolean;
  generatedImageUrl?: string;
  liveSearch?: boolean;
}

export interface RouteResponse {
  targetWorkspace: WorkspaceId;
  confidence: number;
  cleanedPrompt: string;
}
