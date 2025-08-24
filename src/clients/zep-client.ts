import { ZepClient as ZepCloudClient } from '@getzep/zep-cloud';
import { config } from '../config/env.js';

export class ZepClient {
  private client: ZepCloudClient;

  constructor() {
    this.client = new ZepCloudClient({
      apiKey: config.zep.apiKey,
    });
  }

  /**
   * Calculate weekly thread ID based on current date
   * Format: quinn_week_aug_19_aug_25_2025
   */
  private getWeeklyThreadId(): string {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get start of week (Monday)
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    
    // Get end of week (Sunday)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Format month names
    const months = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    
    const startMonth = months[monday.getMonth()];
    const endMonth = months[sunday.getMonth()];
    const startDay = monday.getDate();
    const endDay = sunday.getDate();
    
    return `quinn_week_${startMonth}_${startDay}_${endMonth}_${endDay}_${year}`;
  }

  /**
   * Get user context from the current weekly thread
   */
  async getUserContext(userId: string = config.zep.userId): Promise<any> {
    try {
      const threadId = this.getWeeklyThreadId();
      console.log(`Getting context for thread: ${threadId}`);
      
      // Use official Zep thread.get_user_context() method
      const memory = await this.client.thread.getUserContext(threadId, {
        mode: 'basic'
      });
      
      return {
        success: true,
        data: {
          thread_id: threadId,
          user_id: userId,
          context: memory.context,
          facts: [], // ThreadContextResponse doesn't have facts
          entities: [], // ThreadContextResponse doesn't have entities
        }
      };
    } catch (error) {
      console.error('Zep getUserContext error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search memory using legacy method name (for compatibility)
   */
  async searchMemory(query: string, limit: number = 10): Promise<any> {
    return await this.searchMemoryGraph(query);
  }

  /**
   * Search the personal memory graph directly
   */
  async searchMemoryGraph(query: string, userId: string = config.zep.userId): Promise<any> {
    try {
      const results = await this.client.graph.search({
        userId: userId,
        query: query
      });
      
      return {
        success: true,
        data: {
          query: query,
          user_id: userId,
          results: results,
        }
      };
    } catch (error) {
      console.error('Zep searchMemoryGraph error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add memory to the current weekly thread
   */
  async addMemory(content: string, metadata?: Record<string, any>, userId: string = config.zep.userId): Promise<any> {
    try {
      const threadId = this.getWeeklyThreadId();
      
      const message = await this.client.thread.addMessages(threadId, {
        messages: [{
          content: content,
          role: "user",
        }],
      });
      
      return {
        success: true,
        data: {
          thread_id: threadId,
          user_id: userId,
          message: message,
        }
      };
    } catch (error) {
      console.error('Zep addMemory error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Health check for Zep connection
   */
  async healthCheck(): Promise<any> {
    try {
      const threadId = this.getWeeklyThreadId();
      
      // Test by getting user info
      const user = await this.client.user.get(config.zep.userId);
      
      return {
        success: true,
        data: {
          status: 'healthy',
          thread_id: threadId,
          user_id: user.userId,
          user_name: `${user.firstName} ${user.lastName}`,
        },
      };
    } catch (error) {
      console.error('Zep health check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }
}