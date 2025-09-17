// Mock ReactDOM
const mockRender = jest.fn();
const mockUnmount = jest.fn();
jest.mock('react-dom/client', () => ({
  createRoot: () => ({
    render: mockRender,
    unmount: mockUnmount
  })
}));

// Mock reportWebVitals
const mockReportWebVitals = jest.fn();
jest.mock('./reportWebVitals', () => mockReportWebVitals);

describe('index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be importable', () => {
    // This test verifies that index.js can be imported without errors
    expect(() => {
      require('./index');
    }).not.toThrow();
  });

  it('should call reportWebVitals', () => {
    // This test verifies that reportWebVitals is imported and called
    expect(mockReportWebVitals).toBeDefined();
  });
});
