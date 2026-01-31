/**
 * API Configuration and Utility Functions
 * Re-exports from centralized API service for backward compatibility
 */
import { API_BASE_URL } from '../services/api.service';

// Re-export for backward compatibility
export { API_BASE_URL };

// Remove trailing slash if present
export const API_URL = API_BASE_URL.replace(/\/$/, '');

/**
 * Create full API endpoint URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

/**
 * Fetch with error handling and authentication
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = getApiUrl(endpoint);
  // Check both token keys for compatibility
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * Upload file with progress tracking
 */
export const uploadFile = async (
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const url = getApiUrl(endpoint);
  // Check both token keys for compatibility
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || error.message || 'Upload failed'));
        } catch {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      }
    });

    // Error handler
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred'));
    });

    // Abort handler
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', url);
    xhr.withCredentials = true;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
};

/**
 * Health check endpoint
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(getApiUrl('/health'));
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  API_URL,
  getApiUrl,
  apiFetch,
  uploadFile,
  checkApiHealth,
};
