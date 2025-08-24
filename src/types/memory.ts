export interface MemoryItem {
  id?: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  user_id?: string;
}

export interface SearchResult {
  memories: MemoryItem[];
  total: number;
  query: string;
}

export interface UserContext {
  user_id: string;
  context: string;
  last_updated: string;
  memories_count: number;
}

export interface Fact {
  id?: string;
  fact: string;
  category?: string;
  confidence?: number;
  user_id?: string;
}

export interface FactSearchResult {
  facts: Fact[];
  total: number;
  query: string;
}

export interface RailwayApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}