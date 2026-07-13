const express = require('express');
const client = require('prom-client');

const app = express();
app.use(express.json());

// --- Prometheus metrics ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3],
});
register.registerMetric(httpRequestDuration);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode });
  });
  next();
});

// --- In-memory task store (demo purposes only) ---
let nextId = 1;
const tasks = new Map();

// --- Routes ---
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/tasks', (req, res) => {
  res.json([...tasks.values()]);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'task not found' });
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  const task = { id: nextId++, title: title.trim(), done: false, createdAt: new Date().toISOString() };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = tasks.get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'task not found' });
  if (typeof req.body.done === 'boolean') task.done = req.body.done;
  if (typeof req.body.title === 'string' && req.body.title.trim() !== '') task.title = req.body.title.trim();
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!tasks.has(id)) return res.status(404).json({ error: 'task not found' });
  tasks.delete(id);
  res.status(204).end();
});

module.exports = app;
