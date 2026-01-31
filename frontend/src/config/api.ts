import { API_BASE_URL } from '../services/api.service';

/**
 * Get full API URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

export { API_BASE_URL };
