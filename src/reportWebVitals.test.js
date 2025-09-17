import reportWebVitals from './reportWebVitals';

describe('reportWebVitals', () => {
  it('should be a function', () => {
    expect(typeof reportWebVitals).toBe('function');
  });

  it('should not throw when called with a function', () => {
    const mockFunction = jest.fn();
    expect(() => reportWebVitals(mockFunction)).not.toThrow();
  });

  it('should not throw when called with non-function values', () => {
    expect(() => reportWebVitals(null)).not.toThrow();
    expect(() => reportWebVitals(undefined)).not.toThrow();
    expect(() => reportWebVitals('string')).not.toThrow();
    expect(() => reportWebVitals(123)).not.toThrow();
    expect(() => reportWebVitals({})).not.toThrow();
  });

  it('should handle arrow functions', () => {
    const arrowFunction = () => {};
    expect(() => reportWebVitals(arrowFunction)).not.toThrow();
  });

  it('should handle regular functions', () => {
    function regularFunction() {}
    expect(() => reportWebVitals(regularFunction)).not.toThrow();
  });
});
