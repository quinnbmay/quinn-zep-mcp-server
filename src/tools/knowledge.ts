import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { RailwayApiClient } from '../clients/railway-api.js';

const railwayClient = new RailwayApiClient();

export const addFactTool: Tool = {
  name: 'add-fact',
  description: 'Add a fact to the knowledge graph via Railway API',
  inputSchema: {
    type: 'object',
    properties: {
      fact: {
        type: 'string',
        description: 'The fact to add to the knowledge graph',
      },
      category: {
        type: 'string',
        description: 'Optional category for the fact',
      },
    },
    required: ['fact'],
  },
};

export async function handleAddFact(args: any) {
  const { fact, category } = z.object({
    fact: z.string(),
    category: z.string().optional(),
  }).parse(args);

  const response = await railwayClient.addFact(fact, category);
  
  if (!response.success) {
    throw new Error(`Failed to add fact: ${response.error}`);
  }

  return {
    content: [{
      type: 'text',
      text: `Fact added successfully: ${JSON.stringify(response.data, null, 2)}`,
    }],
  };
}

export const searchFactsTool: Tool = {
  name: 'search-facts',
  description: 'Search facts in the knowledge graph via Railway API',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for facts',
      },
    },
    required: ['query'],
  },
};

export async function handleSearchFacts(args: any) {
  const { query } = z.object({
    query: z.string(),
  }).parse(args);

  const response = await railwayClient.searchFacts(query);
  
  if (!response.success) {
    throw new Error(`Failed to search facts: ${response.error}`);
  }

  return {
    content: [{
      type: 'text',
      text: `Found ${response.data?.total || 0} facts:\n\n${JSON.stringify(response.data, null, 2)}`,
    }],
  };
}