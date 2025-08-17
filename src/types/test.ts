import { type Tables } from "./supabase";

// The raw database row type
export type TestRow = Tables<'tests'>;

export interface UserData {
  name: string;
  age: number;
  email: string;
}

// --- Result Types ---
export interface TCPResult {
  totalStimuli: number;
  targetsPresented: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  reactionTimes: number[];
  accuracy: number;
  averageReactionTime: number;
  sdReactionTime?: number;
}

export interface GoNoGoHandMetrics {
  correctGo: number;
  missedGo: number;
  falseAlarms: number;
  reactionTimes: number[];
  averageReactionTime: number;
  sdReactionTime?: number;
}

export interface GoNoGoResult {
  totalStimuli: number;
  goStimuli: number;
  noGoStimuli: number;
  accuracy: number;
  rightHand?: GoNoGoHandMetrics;
  leftHand?: GoNoGoHandMetrics;
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
  correctPositions?: number;
  orderErrors?: number;
  substitutionErrors?: number;
  startPosition?: number;
  reconstructionTime?: number;
}

// --- App-level Test Type ---
// This is the type we use in the application code.
// It's based on the database row but adds app-specific fields and converts types.
export interface Test extends Omit<TestRow, 'tcp_results' | 'gonogo_results' | 'memory_results'> {
  // App-specific fields that are not in the database
  name?: string; 
  email?: string;
  handUsed?: 'left' | 'right';

  // Overwrite raw DB types with more specific app-level types
  tcp_results?: TCPResult;
  gonogo_results?: GoNoGoResult;
  memory_results?: MemoryResult;
}

export type TestStep = 
  | 'name-step'
  | 'user-data' 
  | 'time-check' 
  | 'tcp-test' 
  | 'hand-switch' 
  | 'gonogo-test' 
  | 'video-rest' 
  | 'memory-test' 
  | 'results' 
  | 'report';