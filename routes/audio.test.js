import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('GET /api/audio', () => {
  it('should return 400 if url parameter is missing', async () => {
    // Write your test here!
    const response = await request(app).get('/api/audio');
    expect(response.status).toBe(400);
    expect(response.text).toBe('Missing url parameter'); 
  });
});

