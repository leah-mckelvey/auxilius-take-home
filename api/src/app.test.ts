import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app';

describe('createApp', () => {
  const app = createApp();

  it('returns application health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns not implemented for listing tasks', async () => {
    const response = await request(app).get('/tasks');

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });

  it('returns not implemented for creating tasks', async () => {
    const response = await request(app).post('/tasks').send({
      title: 'Draft architecture',
    });

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });

  it('returns not implemented for updating tasks', async () => {
    const response = await request(app).patch('/tasks/task-123').send({
      title: 'Refine architecture',
    });

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });

  it('returns not implemented for deleting tasks', async () => {
    const response = await request(app).delete('/tasks/task-123');

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });
});
