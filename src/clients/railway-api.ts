import fetch from 'node-fetch';
import { config } from '../config/env.js';
import { 
  MemoryItem, 
  SearchResult, 
  UserContext, 
  Fact, 
  FactSearchResult, 
  RailwayApiResponse 
} from '../types/memory.js';

export class RailwayApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: any = {}
  ): Promise<RailwayApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as RailwayApiResponse<T>;
      return data;
    } catch (error) {
      console.error(`Railway API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async storeMemory(content: string, metadata?: Record<string, any>): Promise<RailwayApiResponse<MemoryItem>> {
    return this.makeRequest<MemoryItem>('/add_memory', {
      method: 'POST',
      body: JSON.stringify({
        content,
        metadata,
        user_id: config.api.defaultUserId,
      }),
    });
  }

  async searchMemory(query: string, limit = 10): Promise<RailwayApiResponse<SearchResult>> {
    return this.makeRequest<SearchResult>('/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        limit,
        user_id: config.api.defaultUserId,
      }),
    });
  }

  async getUserContext(userId = config.api.defaultUserId): Promise<RailwayApiResponse<UserContext>> {
    return this.makeRequest<UserContext>(`/context/${userId}`);
  }

  async addFact(fact: string, category?: string): Promise<RailwayApiResponse<Fact>> {
    return this.makeRequest<Fact>('/graph/add', {
      method: 'POST',
      body: JSON.stringify({
        fact,
        category,
        user_id: config.api.defaultUserId,
      }),
    });
  }

  async searchFacts(query: string): Promise<RailwayApiResponse<FactSearchResult>> {
    return this.makeRequest<FactSearchResult>('/graph/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        user_id: config.api.defaultUserId,
      }),
    });
  }

  async healthCheck(): Promise<RailwayApiResponse<{ status: string }>> {
    return this.makeRequest<{ status: string }>('/health');
  }
}