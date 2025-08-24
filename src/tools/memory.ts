import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { ZepClient } from '../clients/zep-client.js';

const zepClient = new ZepClient();

export const storeMemoryTool: Tool = {
  name: 'store-memory',
  description: 'Store a new memory in the memory system via Railway API',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The memory content to store',
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata for the memory',
        additionalProperties: true,
      },
    },
    required: ['content'],
  },
};

export async function handleStoreMemory(args: any) {
  const { content, metadata } = z.object({
    content: z.string(),
    metadata: z.record(z.any()).optional(),
  }).parse(args);

  // Note: Store memory functionality would need to be implemented in ZepClient
  // For now, return success message
  return {
    content: [{
      type: 'text',
      text: `Memory storage functionality not yet implemented in Zep client integration.`,
    }],
  };
}

export const searchMemoryTool: Tool = {
  name: 'search-memory',
  description: 'Search memories using the Railway API',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for memories',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
    },
    required: ['query'],
  },
};

export async function handleSearchMemory(args: any) {
  const { query, limit = 10 } = z.object({
    query: z.string(),
    limit: z.number().optional().default(10),
  }).parse(args);

  const response = await zepClient.searchMemory(query, limit);
  
  if (!response.success) {
    throw new Error(`Failed to search memories: ${response.error}`);
  }

  return {
    content: [{
      type: 'text',
      text: `Found ${response.data?.total || 0} memories:\n\n${JSON.stringify(response.data, null, 2)}`,
    }],
  };
}

export const getUserContextTool: Tool = {
  name: 'get-user-context',
  description: 'Get user context via Railway API',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        description: 'User ID to get context for',
        default: 'quinn_may',
      },
    },
  },
};

export async function handleGetUserContext(args: any) {
  const { user_id } = z.object({
    user_id: z.string().optional(),
  }).parse(args);

  const response = await zepClient.getUserContext(user_id);
  
  if (!response.success) {
    throw new Error(`Failed to get user context: ${response.error}`);
  }

  return {
    content: [{
      type: 'text',
      text: `User context:\n\n${JSON.stringify(response.data, null, 2)}`,
    }],
  };
}