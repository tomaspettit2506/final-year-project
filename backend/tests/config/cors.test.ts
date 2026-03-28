import validateCorsOrigin from "../../src/config/cors";
import { describe, expect, it, jest } from '@jest/globals';

describe('validateCorsOrigin', () => {
  it('should allow allowed origins', () => {
    const callback = jest.fn();
    validateCorsOrigin('http://localhost:5173', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should not allow disallowed origins', () => {
    const callback = jest.fn();
    validateCorsOrigin('http://example.com', callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });
});
