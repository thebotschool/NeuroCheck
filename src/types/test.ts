export interface CPTResult {
  totalStimuli: number;
  targetsPresented: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  reactionTimes: number[];
  accuracy: number;
  averageReactionTime: number;
  // Added in Stage 0: standard deviation of reaction times (hits only)
  // Optional for backward compatibility; will be required by computation later
  sdReactionTime?: number;
}

// Updated structure to support per-hand metrics while keeping legacy fields optional
export interface GoNoGoHandMetrics {
  correctGo: number;
  missedGo: number;
  falseAlarms: number;
  reactionTimes: number[];
  averageReactionTime: number;
  // Optional during migration; will compute later
  sdReactionTime?: number;
}

export interface GoNoGoResult {
  // Aggregates
  totalStimuli: number;
  goStimuli: number;
  noGoStimuli: number;
  accuracy: number;

  // New per-hand metrics
  rightHand?: GoNoGoHandMetrics;
  leftHand?: GoNoGoHandMetrics;

  // Legacy flat fields (optional for backward compatibility)
  correctGo?: number;
  missedGo?: number;
  falseAlarms?: number;
  correctNoGo?: number;
  reactionTimes?: number[];
  averageReactionTime?: number;
}

export interface MemoryResult {
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  timeSpent: number;
  accuracy: number;
  // Added metrics for ordering analysis (optional for migration)
  correctPositions?: number;
  orderErrors?: number;
  substitutionErrors?: number;
  startPosition?: number;
  reconstructionTime?: number;
}

export interface TestSession {
  id: string;
  userId: string;
  currentStep: number;
  cptResults?: CPTResult;
  gonogoResults?: GoNoGoResult;
  memoryResults?: MemoryResult;
  handUsed: 'left' | 'right';
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
}

export interface UserData {
  id: string;
  userId: string;
  childName?: string;
  age: number;
  email: string;
  consentAgreed: boolean;
  createdAt: Date;
}

export type TestStep = 
  | 'promo-check' 
  | 'name-step'
  | 'user-data' 
  | 'time-check' 
  | 'cpt-test' 
  | 'hand-switch' 
  | 'gonogo-test' 
  | 'video-rest' 
  | 'memory-test' 
  | 'results' 
  | 'report';