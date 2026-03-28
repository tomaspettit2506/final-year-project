import initializeFirebase from "../../src/config/firebase";
import { describe, expect, it, jest } from '@jest/globals';

describe('Firebase Configuration', () => {
  it('should initialize Firebase without errors', () => {
    expect(() => initializeFirebase()).not.toThrow();
  });

  it('should log a warning if no service account is provided', () => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.FIREBASE_SERVICE_ACCOUNT = '';
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 = '';
    
    initializeFirebase();
    
    expect(consoleWarnMock).toHaveBeenCalledWith(expect.stringContaining('No Firebase service account found'));
    
    consoleWarnMock.mockRestore();
  });
});