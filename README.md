# DevPulse

**Am I hireable right now?**

DevPulse is a personal developer intelligence agent that connects to your GitHub and gives you a brutally honest hireability score out of 100 — backed by real data, not vibes.

Built for the **Pirates of the Coral-bean Hackathon** by WeMakeDevs.

🔗 **Live demo:** https://dev-pulse-blush-three.vercel.app

---

## What it does

Connect your GitHub. DevPulse runs live federated SQL queries through Coral's engine across your repos, commit history, pull requests, language distribution, and activity — then an AI model cross-references everything to tell you exactly where you stand and what to fix.

No ETL. No data pipelines. No stale dashboards. Live API queries via SQL.

**Six views on your dashboard:**
- **Hireability Score** — overall score out of 100 with breakdown across 5 dimensions
- **Focus Today** — the single most important thing to work on right now
- **Growth Trajectory** — how your activity and language choices have evolved over time
- **Portfolio Audit** — honest assessment of what you've built and what's missing
- **Weekly Retrospective** — what you did this week, what you missed, streak status
- **Cross-Source Insight** — a single insight only possible by joining GitHub + Linear + Sentry simultaneously

---

## Coral features implemented

All five Coral features are actively used in this project:

| Feature | How it's used |
|---|---|
| **SQL interface** | All data fetched via Coral SQL against live GitHub, Linear, and Sentry APIs |
| **Cross-source joins** | GitHub + Linear + Sentry queried simultaneously in the mcp-insight endpoint |
| **Schema learning** | `coral.tables` and `coral.columns` queried at runtime — 382 tables discovered across 3 sources |
| **Caching** | 300 second TTL configured in `config.toml` to avoid redundant API hits |
| **MCP stdio transport** | Coral runs as an MCP server via `coral mcp-stdio`, spawned as a child process at startup, tools discovered dynamically |

---

## Tech stack

- **Backend** — Node.js, Express, Passport.js (GitHub OAuth), Coral federated SQL engine
- **Frontend** — React, Vite, Recharts
- **AI** — NVIDIA API (meta/llama-3.1-8b-instruct)
- **Data sources** — GitHub, Linear, Sentry via Coral
- **Deployed** — Render (backend) + Vercel (frontend)

---

## Running locally

### Prerequisites
- Node.js 20+
- WSL Ubuntu with Coral installed (`curl -fsSL https://withcoral.com/install.sh | sh`)
- GitHub OAuth app
- Google OAuth app (for Gmail)
- NVIDIA API key

### Backend setup

```bash
cd backend
cp .env.example .env
# fill in your keys
node index.js
```

Required `.env` variables:

```
PORT=3001
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/gmail/callback
NVIDIA_API_KEY=
SESSION_SECRET=
CORAL_BIN=wsl -d Ubuntu -e env CORAL_CONFIG_DIR=/home/user/cassandra-hackathon /home/user/.local/bin/coral
```

### Coral config

Create `~/cassandra-hackathon/config.toml`:

```toml
version = 1

[workspaces.default.cache]
enabled = true
ttl_seconds = 300

[workspaces.default.sources.github]
variables = { GITHUB_API_BASE = "https://api.github.com" }
secrets = ["GITHUB_TOKEN"]
origin = "bundled"

[workspaces.default.sources.linear]
variables = {}
secrets = ["LINEAR_API_KEY"]
origin = "bundled"

[workspaces.default.sources.sentry]
variables = { SENTRY_ORG = "your-org" }
secrets = ["SENTRY_TOKEN"]
origin = "bundled"
```

### Frontend setup

```bash
cd frontend
cp .env.example .env
# set VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

Open http://localhost:5173

---

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/me` | Auth status |
| `GET /auth/github` | GitHub OAuth |
| `GET /auth/gmail/auth` | Gmail OAuth |
| `GET /api/analyze/run` | Hireability score + AI analysis |
| `GET /api/analyze/focus` | Today's focus task |
| `GET /api/analyze/growth` | Growth trajectory |
| `GET /api/analyze/portfolio` | Portfolio audit |
| `GET /api/analyze/week` | Weekly retrospective |
| `GET /api/analyze/mcp-insight` | Cross-source MCP insight |
| `GET /api/analyze/schema` | Schema discovery |

---

## Project structure

```
devpulse/
├── backend/
│   ├── index.js          # Express server, OAuth, session
│   ├── coral.js          # Coral CLI wrapper
│   ├── coral-mcp.js      # Coral MCP client (stdio transport)
│   ├── scoring.js        # Hireability scoring algorithm
│   ├── coral-config/
│   │   └── config.toml   # Coral sources + caching config
│   └── routes/
│       ├── analyze.js    # All analysis endpoints
│       ├── github.js     # GitHub data routes
│       └── gmail.js      # Gmail OAuth routes
└── frontend/
    └── src/
        ├── App.jsx
        ├── context.jsx
        ├── components/
        │   ├── Landing.jsx
        │   ├── Scanning.jsx
        │   ├── Dashboard.jsx
        │   └── tabs/
        │       ├── Overview.jsx
        │       ├── FocusToday.jsx
        │       ├── Growth.jsx
        │       ├── Portfolio.jsx
        │       ├── ThisWeek.jsx
        │       ├── CrossSource.jsx
        │       └── Schema.jsx
```

---

## Hackathon

**Pirates of the Coral-bean** · WeMakeDevs · Track 2: Personal Agent

Five Coral features. Three live sources. One honest answer.
