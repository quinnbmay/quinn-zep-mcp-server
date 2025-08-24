import { StreamableHttpTransport } from './transport/streamable.js';
import { McpHttpHandler } from './transport/mcp-http-handler.js';
import { config } from './config/env.js';

export class ExpressServer {
  private transport: StreamableHttpTransport;
  private mcpHandler: McpHttpHandler;
  private server: any;

  constructor() {
    this.transport = new StreamableHttpTransport();
    this.mcpHandler = new McpHttpHandler();
    
    // Connect the MCP handler to the transport
    this.transport.setRequestHandler((request) => this.mcpHandler.handleRequest(request));
  }

  public async start(): Promise<void> {
    const app = this.transport.getApp();
    const port = config.server.port;

    return new Promise((resolve, reject) => {
      this.server = app.listen(port, () => {
        console.log(`🚀 MCP Server running on port ${port}`);
        console.log(`📡 MCP endpoints:`);
        console.log(`   POST /mcp - Client requests`);
        console.log(`   GET  /mcp - Server-Sent Events`);
        console.log(`   GET  /sse/ - OpenAI SSE compatibility`);
        console.log(`🔗 Railway API: ${config.api.baseUrl}`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        console.error('Server failed to start:', error);
        reject(error);
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.transport.close();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}