import app, { auth } from './config';

describe('Firebase Config', () => {
  it('should export the initialized app', () => {
    expect(app).toBeDefined();
  });

  it('should export the auth instance', () => {
    expect(auth).toBeDefined();
  });

  it('should have correct app properties', () => {
    expect(app).toHaveProperty('name');
  });

  it('should have correct auth properties', () => {
    expect(auth).toHaveProperty('name');
  });
});
