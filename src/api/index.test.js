import { addAuthHeader, handleRequestError } from './index';

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
});
