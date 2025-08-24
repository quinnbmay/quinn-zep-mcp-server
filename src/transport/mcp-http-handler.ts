import { Server } from '@modelcontextprotocol/sdk/server/index';
import { 
  CallToolRequestSchema, 
  ListResourcesRequestSchema, 
  ListToolsRequestSchema, 
  ReadResourceRequestSchema,
  InitializeRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types';

// Import tools
import { 
  storeMemoryTool, 
  handleStoreMemory,
  searchMemoryTool,
  handleSearchMemory,
  getUserContextTool,
  handleGetUserContext,
} from '../tools/memory.js';

import {
  addFactTool,
  handleAddFact,
  searchFactsTool,
  handleSearchFacts,
} from '../tools/knowledge.js';

// Import resources
import {
  contextResource,
  recentMemoriesResource,
  statsResource,
  getContextResource,
  getRecentMemoriesResource,
  getStatsResource,
} from '../resources/context.js';

export class McpHttpHandler {
  private tools = [
    storeMemoryTool,
    searchMemoryTool,
    getUserContextTool,
    addFactTool,
    searchFactsTool,
  ];

  private resources = [
    contextResource,
    recentMemoriesResource,
    statsResource,
  ];

  constructor() {}

  async handleRequest(request: any): Promise<any> {
    const { method, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return this.handleInitialize(params);
        
        case 'tools/list':
          return this.handleListTools(params);
        
        case 'tools/call':
          return this.handleCallTool(params);
        
        case 'resources/list':
          return this.handleListResources(params);
        
        case 'resources/read':
          return this.handleReadResource(params);
        
        case 'prompts/list':
          return this.handleListPrompts(params);
        
        case 'prompts/get':
          return this.handleGetPrompt(params);
        
        case 'ping':
          return { pong: true };
        
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      console.error(`[MCP Handler Error] Method: ${method}`, error);
      throw error;
    }
  }

  private async handleInitialize(params: any) {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      serverInfo: {
        name: 'quinn-zep-mcp-server',
        version: '1.0.0',
      },
    };
  }

  private async handleListTools(params: any) {
    return {
      tools: this.tools,
    };
  }

  private async handleCallTool(params: any) {
    const { name, arguments: args } = params;

    switch (name) {
      case 'store-memory':
        return await handleStoreMemory(args);
      case 'search-memory':
        return await handleSearchMemory(args);
      case 'get-user-context':
        return await handleGetUserContext(args);
      case 'add-fact':
        return await handleAddFact(args);
      case 'search-facts':
        return await handleSearchFacts(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async handleListResources(params: any) {
    return {
      resources: this.resources,
    };
  }

  private async handleReadResource(params: any) {
    const { uri } = params;

    switch (uri) {
      case contextResource.uri:
        return await getContextResource();
      case recentMemoriesResource.uri:
        return await getRecentMemoriesResource();
      case statsResource.uri:
        return await getStatsResource();
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  private async handleListPrompts(params: any) {
    return {
      prompts: [],
    };
  }

  private async handleGetPrompt(params: any) {
    throw new Error('No prompts available');
  }
}