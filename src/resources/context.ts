import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { RailwayApiClient } from '../clients/railway-api.js';
import { config } from '../config/env.js';

const railwayClient = new RailwayApiClient();

export const contextResource: Resource = {
  uri: `memory://${config.api.defaultUserId}/context`,
  name: 'Quinn\'s Memory Context',
  description: 'Real-time user memory context from Railway API',
  mimeType: 'application/json',
};

export async function getContextResource() {
  const response = await railwayClient.getUserContext();
  
  if (!response.success) {
    throw new Error(`Failed to get context: ${response.error}`);
  }

  return {
    contents: [{
      uri: contextResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify(response.data, null, 2),
    }],
  };
}

export const recentMemoriesResource: Resource = {
  uri: `memory://${config.api.defaultUserId}/recent`,
  name: 'Recent Memories',
  description: 'Latest memories from Quinn\'s memory system',
  mimeType: 'application/json',
};

export async function getRecentMemoriesResource() {
  const response = await railwayClient.searchMemory('', 10);
  
  if (!response.success) {
    throw new Error(`Failed to get recent memories: ${response.error}`);
  }

  return {
    contents: [{
      uri: recentMemoriesResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify(response.data, null, 2),
    }],
  };
}

export const statsResource: Resource = {
  uri: `memory://${config.api.defaultUserId}/stats`,
  name: 'Memory Statistics',
  description: 'Usage statistics for Quinn\'s memory system',
  mimeType: 'application/json',
};

export async function getStatsResource() {
  const contextResponse = await railwayClient.getUserContext();
  const healthResponse = await railwayClient.healthCheck();
  
  const stats = {
    context: contextResponse.data,
    health: healthResponse.data,
    timestamp: new Date().toISOString(),
  };

  return {
    contents: [{
      uri: statsResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify(stats, null, 2),
    }],
  };
}