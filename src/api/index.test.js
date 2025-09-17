import api, { addAuthHeader, handleRequestError } from './index';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addAuthHeader', () => {
    test('adds Authorization header when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');
      
      const config = {
        url: '/api/test',
        headers: {}
      };
      
      const result = addAuthHeader(config);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(result.headers.Authorization).toBe('Bearer test-token-123');
      expect(result).toBe(config); // Should return the same config object
    });

    test('does not add Authorization header when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const config = {
        url: '/api/test',
        headers: {}
      };
      
      const result = addAuthHeader(config);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(result.headers.Authorization).toBeUndefined();
      expect(result).toBe(config);
    });

    test('preserves existing headers when adding Authorization', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-456');
      
      const config = {
        url: '/api/test',
        headers: {
          'Custom-Header': 'custom-value',
          'Content-Type': 'application/json'
        }
      };
      
      const result = addAuthHeader(config);
      
      expect(result.headers.Authorization).toBe('Bearer test-token-456');
      expect(result.headers['Custom-Header']).toBe('custom-value');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    test('handles empty token string', () => {
      mockLocalStorage.getItem.mockReturnValue('');
      
      const config = {
        url: '/api/test',
        headers: {}
      };
      
      const result = addAuthHeader(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });

    test('handles undefined token', () => {
      mockLocalStorage.getItem.mockReturnValue(undefined);
      
      const config = {
        url: '/api/test',
        headers: {}
      };
      
      const result = addAuthHeader(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });

    test('logs when token is added', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-789');
      
      const config = {
        url: '/api/test',
        headers: {}
      };
      
      addAuthHeader(config);
      
      expect(console.log).toHaveBeenCalledWith('Added Authorization header:', 'Bearer test-token-789');
    });

    test('logs when no token is found', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const config = {
        url: '/api/test',
        headers: {}
      };
      
      addAuthHeader(config);
      
      expect(console.log).toHaveBeenCalledWith('No token found in localStorage for request:', '/api/test');
    });
  });

  describe('handleRequestError', () => {
    test('logs error and re-throws it', () => {
      const error = new Error('Request failed');
      
      expect(() => handleRequestError(error)).rejects.toThrow('Request failed');
      expect(console.error).toHaveBeenCalledWith('Request interceptor error:', error);
    });

    test('handles different error types', () => {
      const networkError = new Error('Network Error');
      
      expect(() => handleRequestError(networkError)).rejects.toThrow('Network Error');
      expect(console.error).toHaveBeenCalledWith('Request interceptor error:', networkError);
    });
  });

  describe('Integration Scenarios', () => {
    test('handles multiple requests with different token states', () => {
      // First request with token
      mockLocalStorage.getItem.mockReturnValueOnce('token-1');
      const config1 = { url: '/api/test1', headers: {} };
      const result1 = addAuthHeader(config1);
      expect(result1.headers.Authorization).toBe('Bearer token-1');
      
      // Second request without token
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const config2 = { url: '/api/test2', headers: {} };
      const result2 = addAuthHeader(config2);
      expect(result2.headers.Authorization).toBeUndefined();
      
      // Third request with different token
      mockLocalStorage.getItem.mockReturnValueOnce('token-2');
      const config3 = { url: '/api/test3', headers: {} };
      const result3 = addAuthHeader(config3);
      expect(result3.headers.Authorization).toBe('Bearer token-2');
    });

    test('maintains config object reference', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const originalConfig = {
        url: '/api/test',
        method: 'GET',
        headers: { 'Custom-Header': 'value' },
        data: { test: 'data' }
      };
      
      const result = addAuthHeader(originalConfig);
      
      // Should return the same object reference
      expect(result).toBe(originalConfig);
      expect(result.url).toBe('/api/test');
      expect(result.method).toBe('GET');
      expect(result.data).toEqual({ test: 'data' });
      expect(result.headers['Custom-Header']).toBe('value');
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('API Instance Configuration', () => {
    test('creates axios instance with correct base URL', () => {
      expect(api.defaults.baseURL).toBe(process.env.REACT_APP_API_URL);
    });

    test('sets correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    test('has request interceptor configured', () => {
      expect(api.interceptors.request.handlers).toHaveLength(1);
    });

    test('request interceptor uses addAuthHeader function', () => {
      const interceptor = api.interceptors.request.handlers[0];
      expect(interceptor.fulfilled).toBe(addAuthHeader);
      expect(interceptor.rejected).toBe(handleRequestError);
    });
  });

  describe('Environment Variable Handling', () => {
    test('uses REACT_APP_API_URL from environment', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      
      // Test with different environment values
      process.env.REACT_APP_API_URL = 'https://test-api.example.com';
      
      // Re-import the module to get fresh instance
      jest.resetModules();
      const freshApi = require('./index').default;
      
      expect(freshApi.defaults.baseURL).toBe('https://test-api.example.com');
      
      // Restore original value
      process.env.REACT_APP_API_URL = originalEnv;
    });

    test('handles undefined REACT_APP_API_URL', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      
      delete process.env.REACT_APP_API_URL;
      
      // Re-import the module to get fresh instance
      jest.resetModules();
      const freshApi = require('./index').default;
      
      expect(freshApi.defaults.baseURL).toBeUndefined();
      
      // Restore original value
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe('Request Interceptor Integration', () => {
    test('interceptor adds auth header when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('integration-token');
      
      const config = {
        url: '/api/integration-test',
        headers: {}
      };
      
      // Call the interceptor function directly
      const result = api.interceptors.request.handlers[0].fulfilled(config);
      
      expect(result.headers.Authorization).toBe('Bearer integration-token');
      expect(result).toBe(config);
    });

    test('interceptor handles errors correctly', async () => {
      const error = new Error('Interceptor error');
      
      // Call the interceptor error handler directly
      await expect(api.interceptors.request.handlers[0].rejected(error))
        .rejects.toThrow('Interceptor error');
      
      expect(console.error).toHaveBeenCalledWith('Request interceptor error:', error);
    });
  });

  describe('Module Exports', () => {
    test('exports default api instance', () => {
      expect(api).toBeDefined();
      expect(api.defaults).toBeDefined();
      expect(api.interceptors).toBeDefined();
    });

    test('exports addAuthHeader function', () => {
      expect(addAuthHeader).toBeDefined();
      expect(typeof addAuthHeader).toBe('function');
    });

    test('exports handleRequestError function', () => {
      expect(handleRequestError).toBeDefined();
      expect(typeof handleRequestError).toBe('function');
    });
  });
});
