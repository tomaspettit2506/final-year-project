// Testing the backend server
import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/index';

describe('GET /', () => {
  it('should return a welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Welcome to the backend server!');
  });
});

describe('GET /health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    expect(res.body).toHaveProperty('initialized');
    expect(typeof res.body.initialized).toBe('boolean');
  });
});

describe('GET /nonexistent', () => {
  it('should return 404 for non-existent route', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toEqual(404);
  });
});