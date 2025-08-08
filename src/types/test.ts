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
}

export interface GoNoGoResult {
  totalStimuli: number;
  goStimuli: number;
  noGoStimuli: number;
  correctGo: number;
  missedGo: number;
  falseAlarms: number;
  correctNoGo: number;
  reactionTimes: number[];
  averageReactionTime: number;
  accuracy: number;
}

export interface MemoryResult {
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  timeSpent: number;
  accuracy: number;
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
  | 'user-data' 
  | 'time-check' 
  | 'cpt-test' 
  | 'hand-switch' 
  | 'gonogo-test' 
  | 'visual-rest' 
  | 'memory-test' 
  | 'results' 
  | 'report';