import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { config } from './config/env.js';
import { ExpressServer } from './server.js';

// Import tools
import { 
  storeMemoryTool, 
  handleStoreMemory,
  searchMemoryTool,
  handleSearchMemory,
  getUserContextTool,
  handleGetUserContext,
} from './tools/memory.js';

import {
  addFactTool,
  handleAddFact,
  searchFactsTool,
  handleSearchFacts,
} from './tools/knowledge.js';

// Import resources
import {
  contextResource,
  recentMemoriesResource,
  statsResource,
  getContextResource,
  getRecentMemoriesResource,
  getStatsResource,
} from './resources/context.js';

class ZepMcpServer {
  private server: Server;
  private expressServer: ExpressServer;

  constructor() {
    this.server = new Server({
      name: config.server.name,
      version: config.server.version,
    }, {
      capabilities: {
        tools: {},
        resources: {},
      },
    });

    this.expressServer = new ExpressServer();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          storeMemoryTool,
          searchMemoryTool,
          getUserContextTool,
          addFactTool,
          searchFactsTool,
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Tool execution failed: ${message}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          contextResource,
          recentMemoriesResource,
          statsResource,
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Resource read failed: ${message}`);
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]:', error);
    };

    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  public async start() {
    try {
      // Start Express server for HTTP/SSE transport
      await this.expressServer.start();
      
      // Only connect stdio transport if running in MCP mode
      if (process.env.RUN_MODE !== 'http-only') {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
      }
      
      console.log('🧠 Zep MCP Server started successfully');
      console.log(`📋 Available tools: 5`);
      console.log(`📄 Available resources: 3`);
      console.log(`🔗 Railway API connection ready`);
      
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  private async cleanup() {
    console.log('🛑 Shutting down MCP server...');
    await this.expressServer.stop();
  }
}

// Start the server
const mcpServer = new ZepMcpServer();
mcpServer.start();