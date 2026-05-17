export type LifecycleState = 'setup' | 'running' | 'paused' | 'partial' | 'finished';

export type EmailStatus = 'verified' | 'unverified' | 'invalid' | 'missing';
export type LinkedinStatus = 'verified' | 'unverified' | 'missing';

export interface Lead {
  id: string;
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  company: string;
  location: string;
  score: number;
  scoreBreakdown: { label: string; points: number }[];
  emailStatus: EmailStatus;
  linkedinStatus: LinkedinStatus;
  segmentId: string | null;
  outreachStarted: boolean;
  // Runtime-only fields
  currentStep?: number;
  lastActivity?: string;
  engagement?: 'opened' | 'replied' | 'clicked' | 'bounced' | null;
}

export type SequenceSource = 'use-existing' | 'clone' | 'generate' | 'scratch';

export type StepChannel = 'email' | 'linkedin_connection' | 'linkedin_message';

export interface MessageStep {
  id: string;
  channel: StepChannel;
  dayOffset: number;
  subject?: string;
  body: string;
  aiGenerated: boolean;
  charLimit?: number;
}

export interface Variant {
  id: string;
  label: string; // A / B / C
  angle: string;
  subjectPreview: string;
  bodyPreview: string;
  weight: number; // 0-1
}

export interface Sequence {
  id: string;
  name: string;
  channel: 'email' | 'linkedin' | 'email_then_linkedin' | 'multichannel';
  steps: number;
  durationDays: number;
  variants: Variant[];
  messageSteps?: MessageStep[];
  locked?: boolean;
}

export interface Segment {
  id: string;
  name: string;
  isDefault: boolean;
  rules: SegmentRule[];
  sequenceId: string;
  sequenceSource: SequenceSource;
  senderMode: 'campaign-pool' | 'segment-specific';
  segmentSenderIds?: string[];
  matchedLeadIds: string[];
  abTest: {
    enabled: boolean;
    variants: Variant[];
  };
}

export interface SegmentRule {
  field: 'title' | 'location' | 'industry' | 'seniority' | 'company' | 'has_email' | 'has_linkedin' | 'score';
  operator: 'contains' | 'equals' | 'in' | 'gte' | 'lte' | 'is_true' | 'is_false';
  value: string | string[] | number | boolean;
}

export interface Sender {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'paused' | 'blocked';
  dailyCap: number;
  sentToday: number;
}

export interface Campaign {
  id: string;
  name: string;
  state: LifecycleState;
  companiesCount: number;
  contactsCount: number;
  inOutreachCount: number;
  createdAt: string;
  plan: string;
  outreachPlan: string;
}
