import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { EventEmitter } from 'events';

export interface Session {
  id: string;
  created: Date;
  lastActivity: Date;
  requests: Set<express.Response>;
}

export class StreamableHttpTransport extends EventEmitter {
  private app: express.Application;
  private sessions: Map<string, Session> = new Map();
  private sessionCleanupInterval: NodeJS.Timeout | undefined;
  private requestHandler: ((request: any) => Promise<any>) | null = null;

  constructor() {
    super();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.startSessionCleanup();
  }

  private setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = config.transport.allowedOrigins;
        const isAllowed = allowedOrigins.some((allowed: string) => {
          if (allowed.endsWith('*')) {
            const prefix = allowed.slice(0, -1);
            return origin.startsWith(prefix);
          }
          return origin === allowed;
        });
        
        callback(null, isAllowed);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // DNS rebinding protection
      if (config.transport.enableDnsRebindingProtection) {
        const host = req.get('host');
        const allowedHosts = config.transport.allowedHosts;
        
        if (host && !allowedHosts.includes(host) && !host.includes('railway.app')) {
          return res.status(403).json({ error: 'Forbidden host' });
        }
      }
      
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sessions: this.sessions.size,
      });
    });

    // MCP POST endpoint (client-to-server)
    this.app.post('/mcp', (req, res) => {
      this.handleMcpRequest(req, res);
    });

    // MCP SSE endpoint (server-to-client)
    this.app.get('/mcp', (req, res) => {
      this.handleMcpStream(req, res);
    });
    
    // OpenAI compatibility SSE endpoint
    this.app.get('/sse/', (req, res) => {
      this.handleMcpStream(req, res);
    });
  }

  private createSession(): Session {
    const session: Session = {
      id: uuidv4(),
      created: new Date(),
      lastActivity: new Date(),
      requests: new Set(),
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  private getOrCreateSession(sessionId?: string): Session {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = new Date();
      return session;
    }
    
    return this.createSession();
  }

  private async handleMcpRequest(req: express.Request, res: express.Response) {
    const sessionId = req.headers['x-session-id'] as string;
    const session = this.getOrCreateSession(sessionId);
    
    // Add session ID to response headers
    res.setHeader('X-Session-ID', session.id);
    
    try {
      // Validate JSON-RPC 2.0 request
      const { jsonrpc, method, params, id } = req.body;
      
      if (jsonrpc !== '2.0') {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: Missing or invalid jsonrpc version'
          },
          id: id || null
        });
        return;
      }
      
      if (!method || typeof method !== 'string') {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: Missing or invalid method'
          },
          id: id || null
        });
        return;
      }
      
      // Process the request through the handler
      if (this.requestHandler) {
        const result = await this.requestHandler({
          jsonrpc,
          method,
          params: params || {},
          id
        });
        
        // Send JSON-RPC 2.0 response
        res.json({
          jsonrpc: '2.0',
          result,
          id
        });
      } else {
        // No handler registered
        res.status(503).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error: No request handler available'
          },
          id: id || null
        });
      }
      
      // Broadcast to SSE clients if needed
      for (const sseRes of session.requests) {
        sseRes.write(`data: ${JSON.stringify({
          type: 'request',
          method,
          sessionId: session.id,
          timestamp: new Date().toISOString()
        })}\n\n`);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal error: ${message}`
        },
        id: req.body?.id || null
      });
    }
  }

  private handleMcpStream(req: express.Request, res: express.Response) {
    const sessionId = req.headers['x-session-id'] as string || 
                      req.query.session as string;
    
    const session = this.getOrCreateSession(sessionId);
    
    // Setup Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Session-ID': session.id,
      'Access-Control-Expose-Headers': 'X-Session-ID',
    });

    // Add response to session
    session.requests.add(res);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      sessionId: session.id,
      timestamp: new Date().toISOString(),
    })}\n\n`);

    // Handle connection close
    req.on('close', () => {
      session.requests.delete(res);
    });

    // Keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      if (session.requests.has(res)) {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
      } else {
        clearInterval(keepAlive);
      }
    }, 30000);
  }

  private startSessionCleanup() {
    this.sessionCleanupInterval = setInterval(() => {
      const now = new Date();
      const timeout = config.transport.sessionTimeout;
      
      for (const [sessionId, session] of this.sessions.entries()) {
        const age = now.getTime() - session.lastActivity.getTime();
        
        if (age > timeout) {
          // Close all SSE connections for this session
          for (const res of session.requests) {
            res.end();
          }
          this.sessions.delete(sessionId);
        }
      }
    }, 60000); // Run every minute
  }

  public getApp(): express.Application {
    return this.app;
  }

  public setRequestHandler(handler: (request: any) => Promise<any>) {
    this.requestHandler = handler;
  }

  public close() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
  }
}