# 🏆 ClashCode — Real-Time DSA Multiplayer Platform

A team-based competitive programming platform where users battle in real time, submit code that is judged asynchronously in a Dockerized sandbox, and watch verdicts and leaderboards update live over WebSocket — built end-to-end on a free-tier AWS stack.

**Live:** `https://clashcode.duckdns.org` (API) · `https://clashcode-dsa-multiplayer.netlify.app` (frontend)
**Repo:** `github.com/007Gowtham/clashcode`

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Async Submission & Judging Flow](#async-submission--judging-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket — Real-Time Events](#websocket--real-time-events)
- [Frontend](#frontend)
- [Cloud Infrastructure (AWS Free Tier)](#cloud-infrastructure-aws-free-tier)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Issues We Hit & How They Were Fixed](#issues-we-hit--how-they-were-fixed)
- [Project Status / Roadmap](#project-status--roadmap)
- [License](#license)

---

## Overview

ClashCode lets users join a room, form teams, and solve DSA problems against each other. The core engineering challenge: **code judging is slow** (compiling and running untrusted code in Docker against multiple test cases), but an HTTP request can't sit open for seconds at a time. The platform solves this with an **async, queue-based judging pipeline** and pushes the result back to the browser the moment it's ready — no polling required.

## Features

- JWT-based authentication
- Run code against sample test cases instantly (synchronous, no queue)
- Submit code for full judging — decoupled via AWS SQS, judged in the background
- Dockerized sandbox execution per submission (compile + run isolation)
- Real-time verdict delivery over native Spring WebSocket/STOMP
- Team-based room battles with automatic, de-duplicated score recalculation
- Submission history per user and per room
- Production deployment behind Nginx with free auto-renewing HTTPS

## Architecture

```mermaid
flowchart LR
    subgraph Client["Client"]
        FE["Next.js Frontend<br/>(Netlify)"]
    end

    subgraph EC2["AWS EC2 — clashcode-server"]
        NGINX["Nginx<br/>:443 HTTPS"]
        APP["Spring Boot App<br/>:5000"]
    end

    subgraph Cloud["AWS Cloud Services"]
        SQS[("SQS<br/>judge-queue")]
        RDS[("RDS PostgreSQL")]
        SM["Secrets Manager"]
        CW["CloudWatch Logs"]
    end

    DOCKER["Docker Sandbox<br/>(code execution)"]

    FE -- "HTTPS / WSS" --> NGINX
    NGINX -- "HTTP (internal)" --> APP
    APP --> RDS
    APP -- "enqueue JudgeMessage" --> SQS
    APP --> SM
    APP --> CW
    APP -- "run untrusted code" --> DOCKER
    SQS -- "polled by SubmissionJudgeWorker" --> APP
```

Nginx terminates HTTPS using a free Let's Encrypt certificate (via Certbot) and reverse-proxies plain HTTP to Spring Boot internally — Spring Boot itself never deals with SSL.

## Async Submission & Judging Flow

```mermaid
sequenceDiagram
    participant U as User (Next.js)
    participant API as SubmissionService
    participant DB as PostgreSQL
    participant Q as SQS judge-queue
    participant W as SubmissionJudgeWorker
    participant D as Docker Sandbox
    participant WS as WebSocketService

    U->>API: POST /submissions/submit
    API->>DB: save Submission(status = PENDING)
    API->>Q: send JudgeMessage(submissionId) as JSON
    API-->>U: 200 OK { submissionId, status: PENDING }
    U->>WS: subscribe /topic/submission/{id}

    Q->>W: deliver JudgeMessage
    W->>DB: fetch full Submission by id
    W->>D: run code against all test cases
    D-->>W: stdout / stderr / timing
    W->>DB: save verdict (status, result, execTime)
    alt ACCEPTED and inside a room/team
        W->>DB: recompute team score (de-duplicated by problem)
    end
    W->>WS: push("/topic/submission/{id}", verdictPayload)
    WS-->>U: verdict delivered live, no polling
```

**Why this shape:** `submit()` only does three things — save `PENDING`, enqueue, return. All judging logic lives in `SubmissionJudgeWorker`, which is the only place that calls the Docker sandbox for a full (non-sample) run. This keeps the HTTP path fast and makes judging horizontally scalable — more workers can consume the same queue without touching the API.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3, Java 21 |
| Database | PostgreSQL — AWS RDS (free tier) |
| Message Queue | AWS SQS (judge queue, async decoupling) |
| Real-time push | Spring WebSocket + STOMP (native, single generic service) |
| Sandboxing | Docker-based code execution sandbox |
| Frontend | Next.js (React), deployed on Netlify |
| API Client | Axios |
| Real-time client | `@stomp/stompjs` + `sockjs-client` |
| Reverse Proxy | Nginx |
| TLS / HTTPS | Let's Encrypt via Certbot (auto-renews every 90 days) |
| Domain | DuckDNS (free dynamic DNS) |
| Hosting | AWS EC2 (free tier) |
| CI/CD | GitHub Actions → build → SCP jar to EC2 → SSH restart |
| Secrets | AWS Secrets Manager |
| Observability | AWS CloudWatch Logs |
| Build Tool | Maven |

## Project Structure

```
clashcode/
├── backend/dsa-multiplayer/
│   ├── src/main/java/com/clashcode/dsa_multiplayer/
│   │   ├── auth/
│   │   │   └── entity/User.java
│   │   ├── common/
│   │   │   ├── exception/ApiException.java
│   │   │   └── service/WebSocketService.java        # single generic push(topic, payload)
│   │   ├── config/
│   │   │   └── WebSocketConfig.java                  # STOMP endpoint /ws, SockJS fallback
│   │   ├── problem/
│   │   │   └── service/ProblemService.java
│   │   ├── room/
│   │   │   ├── entity/Room.java
│   │   │   └── repository/RoomRepository.java
│   │   ├── submission/
│   │   │   ├── dto/                                  # RunRequest, RunResponse, SubmitRequest,
│   │   │   │                                          # SubmissionResponse, JudgeMessage
│   │   │   ├── entity/                                # Submission, SubmissionStatus, Problem
│   │   │   ├── repository/SubmissionRepository.java
│   │   │   ├── sandbox/                                # SandboxService, SandboxRequest
│   │   │   └── service/
│   │   │       ├── SubmissionJudgeEngine.java         # pure judging logic
│   │   │       ├── SubmissionService.java             # run() + submit()
│   │   │       └── SubmissionJudgeWorker.java         # @SqsListener consumer
│   │   └── team/
│   │       ├── entity/TeamMember.java
│   │       └── repository/                            # TeamRepository, TeamMemberRepository
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/                               # Flyway V1__..., V2__... etc.
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── axios.js                                # configured Axios instance, baseURL from env
│   │   │   └── hooks/
│   │   │       └── useWebSocket.js                     # single generic hook, used by every feature
│   │   ├── pages/ (or app/)                             # Next.js routes
│   │   └── components/
│   ├── public/
│   ├── .env.local                                       # NEXT_PUBLIC_API_URL (not committed)
│   ├── next.config.js
│   └── package.json
└── .github/workflows/
    └── deploy-backend.yml
```

> Two frontend files are the ones purpose-built for this project: `axios.js` (API client) and `useWebSocket.js` (the one hook every real-time feature reuses). The rest follows standard Next.js scaffolding.

## Getting Started

### Prerequisites

- Java 21 (Temurin recommended)
- Maven 3.9+
- Docker (for the code-execution sandbox)
- PostgreSQL 16 (local instance, or point at RDS)
- Node.js 18+ and npm (frontend)

### Clone & Run the Backend

```bash
git clone https://github.com/007Gowtham/clashcode.git
cd clashcode/backend/dsa-multiplayer

# build
mvn clean install -DskipTests

# run (local profile reads application.yml)
mvn spring-boot:run
```

The API starts on `http://localhost:5000`.

### Run the Frontend

```bash
cd clashcode/frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm install
npm run dev
```

The app starts on `http://localhost:3000`. See [Frontend](#frontend) for the full structure, WebSocket integration, and Netlify deployment steps.

## Environment Variables

Local development (`application.yml` / `.env`):

| Variable | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | JDBC URL for Postgres | `jdbc:postgresql://localhost:5432/clashcode` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `your_local_password` |
| `JWT_SECRET` | Signing secret for JWT auth | `your_jwt_secret` |
| `APP_SQS_JUDGE_QUEUE` | SQS queue name/URL for judging | `clashcode-judge-queue` |
| `CLIENT_URL` | Allowed CORS origin (frontend URL) | `https://clashcode-dsa-multiplayer.netlify.app` |

Production (EC2 `/home/ubuntu/.env`, consumed by `clashcode.service`):

```bash
CLIENT_URL=https://clashcode-dsa-multiplayer.netlify.app
```

Production secrets (DB credentials, JWT secret) are **not** stored in `.env` — they are pulled from **AWS Secrets Manager** at boot via the EC2 instance's IAM role. See [Cloud Infrastructure](#cloud-infrastructure-aws-free-tier).

GitHub Actions secrets (`Settings → Secrets and variables → Actions`):

| Secret | Value |
|---|---|
| `EC2_HOST` | EC2 instance public IPv4 address |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | RSA **PEM-format** private key (must start with `-----BEGIN RSA PRIVATE KEY-----`) |

Frontend (`frontend/.env.local`, and the equivalent in Netlify's environment variable settings):

| Variable | Description | Local | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL the frontend calls for REST + WebSocket | `http://localhost:5000` | `https://clashcode.duckdns.org` |

`NEXT_PUBLIC_` is required for Next.js to expose a variable to client-side (browser) code — anything without that prefix stays server-only and won't be visible to `axios.js`.

## API Reference

> Base URL (prod): `https://clashcode.duckdns.org`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate, returns JWT |
| `POST` | `/submissions/run` | Run code against **sample** test cases only — synchronous, no queue |
| `POST` | `/submissions/submit` | Queue code for **full** judging — returns `PENDING` immediately |
| `GET` | `/submissions/{id}` | Get a single submission (verdict once judged) |
| `GET` | `/submissions/my` | Current user's submission history |
| `GET` | `/submissions/room/{roomId}` | Current user's submissions within a room |
| `GET` | `/rooms/{roomId}/leaderboard` | Team leaderboard for a room |

`POST /submissions/submit` example:

```json
{
  "problemId": "5e2a1c3e-...",
  "language": "python",
  "code": "print(input())",
  "roomId": null
}
```

Response (immediate, before judging completes):

```json
{
  "submissionId": "a1b2c3d4-...",
  "status": "PENDING"
}
```

## WebSocket — Real-Time Events

Spring native STOMP was chosen over Socket.IO because it runs in the same Spring Boot process — no second Node.js server, no Redis bridge to push messages across processes.

| | Socket.IO | Spring STOMP *(chosen)* |
|---|---|---|
| Server | Separate Node.js process | Same Spring Boot server |
| Backend push | Needs Redis/HTTP bridge | `SimpMessagingTemplate`, direct |
| Frontend lib | `socket.io-client` | `@stomp/stompjs` + `sockjs-client` |
| Deployment | Two processes | One process |

**The whole WebSocket layer is one generic primitive on each side** — only the topic string and payload ever change:

```java
// backend — the ONLY push method in the entire app
webSocketService.push("/topic/submission/" + submissionId, verdictPayload);
```

```javascript
// frontend — the ONLY hook in the entire app
useWebSocket(`/topic/submission/${submissionId}`, (data) => setVerdict(data));
```

Topic naming convention: `/topic/{feature}/{id}/{sub-feature}`

| Topic | Fires when |
|---|---|
| `/topic/submission/{submissionId}` | Verdict is ready |
| `/topic/room/{roomId}/leaderboard` | Team score changes |
| `/topic/room/{roomId}/events` | User joined, game started, etc. |

## Frontend

The frontend is a **Next.js** app deployed on Netlify. It talks to the backend two ways: REST over Axios for everything request/response (submit code, fetch history, login), and STOMP-over-WebSocket for anything that arrives asynchronously (verdicts, leaderboard changes).

### Tech & Libraries

| Library | Purpose |
|---|---|
| Next.js | Routing, build, env var handling, Netlify-ready output |
| React | UI components |
| Axios | REST client for the Spring Boot API |
| `@stomp/stompjs` | STOMP protocol client over the WebSocket connection |
| `sockjs-client` | WebSocket transport with automatic fallback |

### API Client — `src/lib/axios.js`

A single configured Axios instance, so every request goes through one base URL set by environment:

```javascript
import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: apiBaseUrl,
});

export default api;
```

### WebSocket Integration — `src/lib/hooks/useWebSocket.js`

The frontend half of the single generic WebSocket primitive described above. One hook, reused for submission verdicts, leaderboard updates, and room events — only the topic string and callback ever change:

```javascript
// connects to `${NEXT_PUBLIC_API_URL}/ws` via SockJS + STOMP,
// subscribes to `topic`, calls onMessage(JSON.parse(message.body))
// on every message, and cleans up the subscription on unmount.
// If topic is null, the hook does nothing — handles the
// "not submitted yet" state without any extra conditionals at the call site.
function useWebSocket(topic, onMessage) {
  // ...connect / subscribe / cleanup
  return { isConnected };
}

export default useWebSocket;
```

Usage — submission verdict:

```javascript
const [verdict, setVerdict] = useState(null);
const [submissionId, setSubmissionId] = useState(null);

// only subscribes once a submissionId exists
useWebSocket(
  submissionId ? `/topic/submission/${submissionId}` : null,
  (data) => setVerdict(data)
);

const handleSubmit = async () => {
  const { data } = await api.post('/submissions/submit', payload);
  setSubmissionId(data.submissionId); // flips the hook from idle -> connected
};
```

Usage — same hook, different topic, for the live leaderboard:

```javascript
useWebSocket(
  `/topic/room/${roomId}/leaderboard`,
  (data) => setLeaderboard(data.entries)
);
```

### Run Locally

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm install
npm run dev      # http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

### Deploying to Netlify

1. Connect the GitHub repo to Netlify, with the **base directory** set to `frontend/`. Netlify then rebuilds automatically on every push to `main` — no custom GitHub Action needed on the frontend side, unlike the backend's manual EC2 pipeline.
2. Netlify → **Site configuration → Environment variables** → add:
   ```
   NEXT_PUBLIC_API_URL = https://clashcode.duckdns.org
   ```
3. Environment variable changes don't trigger a rebuild by themselves — go to **Deploys → Trigger deploy → Deploy site** after updating one.
4. Confirm the WebSocket connects over `wss://clashcode.duckdns.org/ws`, **not** `ws://` and **not** the raw EC2 IP. The page is served over HTTPS, and browsers block any insecure (`ws://`/`http://`) connection from a secure page — this is the Mixed Content rule that also applies to REST calls. See [Issues We Hit](#issues-we-hit--how-they-were-fixed).

## Cloud Infrastructure (AWS Free Tier)

| Service | Purpose | Status |
|---|---|---|
| **EC2** | Hosts Nginx + Spring Boot app | ✅ Live |
| **SQS** | Decouples submission intake from judging | ✅ Live |
| **RDS (PostgreSQL)** | Primary database, private VPC, not publicly accessible | ✅ Configured |
| **Secrets Manager** | DB credentials + JWT secret, injected at boot via IAM role | 🔧 In progress |
| **CloudWatch Logs** | Centralized logging, zero app-code changes | 🔧 In progress |
| **S3** | Store submission code outside Postgres | 📋 Planned |
| **SNS** | Fan out `ACCEPTED` verdicts to leaderboard/notification/stats queues | 📋 Planned |
| **Lambda** | Serverless problem-difficulty recalculation from acceptance rate | 📋 Planned |

### RDS — Free Tier Setup Summary

1. RDS → Create database → **Standard create** → Engine: PostgreSQL
2. Template: **Free Tier** (auto-selects `db.t3.micro`, disables Multi-AZ, caps storage at 20 GB)
3. DB identifier `clashcode-db`, initial database name `clashcode`
4. Public access: **No** — only the EC2 security group is allowed in on port 5432
5. Credentials stored in Secrets Manager under `/clashcode/prod/db`

### IAM Policy (least privilege, scoped to the project)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:/clashcode/*"
    },
    {
      "Effect": "Allow",
      "Action": ["rds:DescribeDBInstances", "rds:DescribeDBClusters"],
      "Resource": "*"
    }
  ]
}
```

### `application-prod.yml`

```yaml
spring:
  datasource:
    url: ${spring.datasource.url}
    username: ${spring.datasource.username}
    password: ${spring.datasource.password}
    hikari:
      maximum-pool-size: 5     # kept low for free-tier RDS
  jpa:
    hibernate:
      ddl-auto: validate       # never create/update in prod
  flyway:
    enabled: true
    locations: classpath:db/migration
  cloud:
    aws:
      secretsmanager:
        import-keys:
          - /clashcode/prod/db
          - /clashcode/prod/app
```

## Deployment

> This section covers the backend (EC2 + Nginx + HTTPS). Frontend deployment to Netlify is covered in [Frontend → Deploying to Netlify](#frontend).

### Why Nginx in Front of Spring Boot

```
Without Nginx:
  Browser → http://<EC2_IP>:5000   (Spring Boot directly, no SSL)

With Nginx + Certbot:
  Browser → https://clashcode.duckdns.org   (Nginx :443, holds the certificate)
                    │
                    └─ forwards internally → http://localhost:5000 (Spring Boot)
```

Nginx owns HTTPS termination and the certificate; Spring Boot only ever speaks plain HTTP, internally, to Nginx.

### HTTPS Setup (Certbot + Let's Encrypt — Free)

```bash
sudo systemctl status nginx                    # confirm Nginx is active
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
curl http://clashcode.duckdns.org               # sanity-check the domain reaches EC2
sudo certbot --nginx -d clashcode.duckdns.org    # prompts: email → Y (ToS) → N (EFF)
sudo nginx -t                                    # validate config
sudo systemctl restart nginx
curl https://clashcode.duckdns.org/auth/login    # confirm HTTPS end-to-end
```

Why not AWS-native HTTPS? ACM (AWS's free certificates) only attaches to a Load Balancer or CloudFront — neither works for free, and CloudFront doesn't play well with WebSocket. Nginx + Certbot is free, WebSocket-friendly, and auto-renews every 90 days.

### Service Management on EC2

```bash
sudo systemctl status clashcode      # is the app running?
sudo systemctl restart clashcode     # restart after deploy / config change
sudo journalctl -u clashcode -f      # live application logs (Ctrl+C to stop)
ls -la /home/ubuntu/*.jar            # confirm jar timestamp updated after deploy
```

## CI/CD Pipeline

```mermaid
flowchart TD
    A["git push origin main"] --> B["GitHub Actions triggered"]
    B --> C["Checkout code"]
    C --> D["Setup JDK 21 (Temurin)"]
    D --> E["mvn clean package -DskipTests"]
    E --> F["scp-action: copy jar to EC2"]
    F --> G["ssh-action: restart clashcode.service"]
    G --> H["systemctl status clashcode"]
```

`.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to EC2
on:
  push:
    branches: [ main ]
    paths: [ "backend/dsa-multiplayer/**" ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: "21", distribution: "temurin" }
      - name: Build with Maven
        working-directory: backend/dsa-multiplayer
        run: mvn clean package -DskipTests
      - name: Copy jar to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          source: "backend/dsa-multiplayer/target/dsa-multiplayer-0.0.1-SNAPSHOT.jar"
          target: "/home/ubuntu/"
          strip_components: 3
      - name: Restart service on EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            sudo systemctl restart clashcode
            sleep 5
            sudo systemctl status clashcode --no-pager
```

## Issues We Hit & How They Were Fixed

| Issue | Root Cause | Fix |
|---|---|---|
| SQS payload deserialization error (`Unrecognized token 'com'`) | `sqsTemplate.send(queue, object)` serialized the Java object's `toString()`, not JSON | Switch to the fluent builder: `sqsTemplate.send(to -> to.queue(q).payload(obj))` |
| CORS blocked: *"No Access-Control-Allow-Origin header"* | `CLIENT_URL` missing from EC2 `.env` | Added `CLIENT_URL=https://clashcode-dsa-multiplayer.netlify.app` to `.env`, restarted service |
| Mixed Content error in browser | Frontend (HTTPS) calling backend over plain HTTP | Finished Nginx + Certbot setup so backend is also served over HTTPS |
| GitHub Actions workflow never triggered | Workflow YAML existed only on `main`, but pushes went to a feature branch | Merged feature branch into `main` so code and trigger condition line up: `git merge <branch> -X theirs` |
| `ssh: no key found` in `scp-action` | Default `ssh-keygen` output is OpenSSH format; `appleboy/scp-action` (drone-scp) requires legacy RSA **PEM** format | Regenerate with `ssh-keygen -t rsa -b 4096 -m PEM -f key -N ""`, add public key to EC2 `authorized_keys`, paste private key into `EC2_SSH_KEY` secret |

## Project Status / Roadmap

**Done:**
- Async submission pipeline (SQS + `SubmissionJudgeWorker`) with Docker sandbox judging
- Team scoring, recomputed and de-duplicated per accepted submission
- Generic, single-method WebSocket push/subscribe pattern (backend + frontend)
- Nginx reverse proxy with free, auto-renewing HTTPS (Certbot/Let's Encrypt)
- CORS configured correctly for the Netlify frontend
- GitHub Actions CI/CD building and shipping the jar to EC2 on every push to `main`

**In progress:**
- Fixing the CI/CD SSH authentication step (RSA PEM key format for `scp-action`)
- AWS Secrets Manager rollout (remove all hardcoded credentials)
- AWS CloudWatch centralized logging

**Planned:**
- S3 for submission code storage (keep Postgres lean)
- SNS fan-out from `ACCEPTED` verdicts → separate leaderboard / notification / stats workers
- AWS Lambda for serverless problem-difficulty recalculation
- Rate limiting on `/submissions/submit` (bucket4j)
- `springdoc-openapi` for auto-generated API docs
- Docker Compose for one-command local dev (Postgres + LocalStack)

## License

MIT — see `LICENSE` for details.
