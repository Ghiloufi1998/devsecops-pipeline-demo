# devsecops-pipeline-demo

[![CI/CD](https://github.com/Ghiloufi1998/devsecops-pipeline-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/Ghiloufi1998/devsecops-pipeline-demo/actions/workflows/ci.yml)

A deliberately small Node.js REST API used to demonstrate a **complete DevSecOps pipeline** on GitHub Actions:

```
push / PR
   │
   ▼
┌─────────────┐    ┌────────────────┐    ┌──────────────────┐    ┌──────────────┐
│ ESLint      │──▶ │ Jest tests     │──▶ │ Docker build     │──▶ │ Push to GHCR │
│ (static     │    │ (+ coverage)   │    │ + Trivy scan     │    │ (main only)  │
│  analysis)  │    │                │    │ (fails on HIGH+) │    │              │
└─────────────┘    └────────────────┘    └──────────────────┘    └──────────────┘
```

The point is not the app — it's the pipeline. Every commit is linted, tested, built into a hardened container image, scanned for known vulnerabilities, and only then published.

## Security practices demonstrated

- **Multi-stage Docker build** — production dependencies only, no build tooling in the final image
- **Non-root container** — runs as the unprivileged `node` user
- **Vulnerability scanning** — [Trivy](https://github.com/aquasecurity/trivy) blocks the pipeline on HIGH/CRITICAL CVEs; results are uploaded to the GitHub Security tab (SARIF)
- **Least-privilege workflow permissions** — the workflow requests only the scopes it needs
- **No secrets in the repo** — registry auth uses the ephemeral `GITHUB_TOKEN`

## The API

A minimal task manager with health and metrics endpoints (Prometheus format via `prom-client`):

| Method | Path             | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/healthz`       | Liveness/readiness probe       |
| GET    | `/metrics`       | Prometheus metrics             |
| GET    | `/api/tasks`     | List tasks                     |
| POST   | `/api/tasks`     | Create a task `{ "title": "…" }` |
| GET    | `/api/tasks/:id` | Get one task                   |
| PATCH  | `/api/tasks/:id` | Update title / mark done       |
| DELETE | `/api/tasks/:id` | Delete a task                  |

## Run it

```bash
# Locally
npm ci
npm test
npm start            # http://localhost:3000

# In Docker
docker build -t devsecops-demo .
docker run --rm -p 3000:3000 devsecops-demo

# From the registry (published by the pipeline)
docker run --rm -p 3000:3000 ghcr.io/ghiloufi1998/devsecops-pipeline-demo:latest
```

## Related

This image is deployed by my GitOps repo: [k8s-gitops-platform](https://github.com/Ghiloufi1998/k8s-gitops-platform) — ArgoCD pulls it into a local Kubernetes cluster with monitoring via Prometheus/Grafana.
