const app = require('./app');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`devsecops-pipeline-demo listening on port ${port}`);
});

// Graceful shutdown so Kubernetes rolling updates drain cleanly
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
