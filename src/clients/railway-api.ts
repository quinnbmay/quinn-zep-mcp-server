import { ZepClient } from './zep-client';
import type { UserContext, RailwayApiResponse } from '../types/memory';

export class RailwayApiClient {
  private zepClient: ZepClient;

  constructor() {
    this.zepClient = new ZepClient();
  }

  async getUserContext(userId: string): Promise<RailwayApiResponse<UserContext>> {
    try {
      const context = await this.zepClient.getUserContext(userId);
      return {
        success: true,
        data: context
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async searchMemory(userId: string, query: string, limit?: number): Promise<RailwayApiResponse<any>> {
    try {
      const results = await this.zepClient.searchGraph(userId, query, limit);
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}