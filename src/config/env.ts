import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  // Railway Memory API (existing)
  RAILWAY_MEMORY_API_URL: z.string().default('https://quinn-memory-api-production.up.railway.app'),
  DEFAULT_USER_ID: z.string().default('quinn_may'),
  
  // MCP Server Config
  MCP_SERVER_NAME: z.string().default('quinn-zep-mcp-server'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.string().default('production'),
  
  // HTTPS/SSE Transport
  ALLOWED_ORIGINS: z.string().default('https://claude.ai,https://claude.ai/code,http://localhost:*'),
  ALLOWED_HOSTS: z.string().default('localhost,127.0.0.1'),
  ENABLE_DNS_REBINDING_PROTECTION: z.string().transform((val) => val === 'true').default('true'),
  SESSION_TIMEOUT: z.string().transform(Number).default('3600000'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const config = {
  api: {
    baseUrl: env.RAILWAY_MEMORY_API_URL,
    defaultUserId: env.DEFAULT_USER_ID,
    timeout: 10000,
  },
  server: {
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
  transport: {
    allowedOrigins: env.ALLOWED_ORIGINS.split(','),
    allowedHosts: env.ALLOWED_HOSTS.split(','),
    enableDnsRebindingProtection: env.ENABLE_DNS_REBINDING_PROTECTION,
    sessionTimeout: env.SESSION_TIMEOUT,
  },
};