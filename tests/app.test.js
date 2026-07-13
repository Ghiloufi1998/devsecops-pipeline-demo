const request = require('supertest');
const app = require('../src/app');

describe('health and metrics', () => {
  it('GET /healthz returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /metrics exposes Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_request_duration_seconds');
  });
});

describe('tasks API', () => {
  it('POST /api/tasks creates a task', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'write tests' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ title: 'write tests', done: false });
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/tasks rejects missing title', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/tasks lists created tasks', async () => {
    await request(app).post('/api/tasks').send({ title: 'another task' });
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('PATCH /api/tasks/:id marks a task done', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'finish me' });
    const res = await request(app).patch(`/api/tasks/${created.body.id}`).send({ done: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.done).toBe(true);
  });

  it('DELETE /api/tasks/:id removes a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'delete me' });
    const del = await request(app).delete(`/api/tasks/${created.body.id}`);
    expect(del.statusCode).toBe(204);
    const get = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(get.statusCode).toBe(404);
  });

  it('returns 404 for unknown task', async () => {
    const res = await request(app).get('/api/tasks/99999');
    expect(res.statusCode).toBe(404);
  });
});
