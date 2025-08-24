import { Zep } from '@getzep/zep-cloud';
import { ZEP_CONFIG } from '../config/env';
import type { UserContext, GraphSearchResult, MemorySearchResult } from '../types/memory';

export class ZepClient {
  private client: Zep;

  constructor() {
    this.client = new Zep({
      apiKey: ZEP_CONFIG.apiKey,
    });
  }

  async getUserContext(userId: string): Promise<UserContext> {
    const threadId = this.getWeeklyThreadId(userId);
    
    const memory = await this.client.thread.getUserContext(threadId, {
      mode: 'basic'
    });

    return {
      context: memory.context || '',
      facts: memory.facts || [],
      entities: memory.entities || [],
      messages: []
    };
  }

  async searchGraph(userId: string, query: string, limit: number = 10): Promise<GraphSearchResult> {
    const results = await this.client.graph.search({
      userId: userId,
      query: query,
      limit: limit
    });

    return {
      edges: results.edges || [],
      nodes: results.nodes || [],
      episodes: results.episodes || []
    };
  }

  private getWeeklyThreadId(userId: string): string {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startMonth = monday.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const startDay = monday.getDate();
    const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const endDay = sunday.getDate();
    const year = sunday.getFullYear();

    return `${userId}_week_${startMonth}_${startDay}_${endMonth}_${endDay}_${year}`;
  }
}

export const zepClient = new ZepClient();