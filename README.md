# CRiDiT Mock-Up

CRiDiT is a prototype for observing trust calibration dynamics in an LLM-based application. This repository contains:

- `backend/`: a Quarkus service for trust scoring, calibration logic, chat persistence, and interaction logging
- `participant/`: a Next.js participant-facing UI
- `operator/`: a Next.js operator-facing UI

The system combines:

- human-side trust signals from participant adoption, feedback, and preflight inputs
- machine-side trust signals from operator-recorded events and evidence
- calibration logic that turns those signals into trust cues and intervention records

## Repository Layout

```text
.
├── backend/      # Java 21 + Quarkus API
├── participant/  # Next.js app on port 3000
├── operator/     # Next.js app on port 3001
└── README.md
```

## Requirements

- Java 21
- Maven 3.9+
- Node.js 20+
- npm or pnpm
- `OPENAI_API_KEY` to use the OpenAI proxy endpoint

## Default Ports

- Participant UI: `3000`
- Operator UI: `3001`
- Backend API: `8001`

## Quick Start

Open three terminals from the repository root.

### 1. Start the backend

```bash
cd backend
mvn quarkus:dev
```

The backend listens on `http://localhost:8001`.

### 2. Start the participant UI

```bash
cd participant
npm install
npm run dev
```

The participant UI runs on `http://localhost:3000`.

### 3. Start the operator UI

```bash
cd operator
npm install
npm run dev
```

The operator UI runs on `http://localhost:3001`.

## Application Flow

### Participant flow

1. Select one of the three scenarios: financial, hiring, or legal.
2. Complete the preflight questionnaire. The backend stores the submitted answers.
3. Work through the scenario tasks in the participant UI.
4. Submit interaction feedback, including adoption and self-reported trust-related measures.
5. The backend computes trust-related outputs and records calibration history.
6. Complete the postflight questionnaire at the end of the session.

### Operator flow

1. Open the operator UI and choose a scenario.
2. Configure threshold inputs and backend/frontend base URLs if needed.
3. Monitor the participant conversation and scenario progress.
4. Send scripted responses or route participant requests through the OpenAI proxy with an operator prompt.
5. Record trust-relevant machine-side events so the backend can update machine-side trust and calibration history.

## Main Backend Endpoints

Primary trust and workflow routes are exposed under `http://localhost:8001/cridit`.

- `POST /cridit/preflight/params`
  Stores preflight answers and computes preflight-derived parameters.
- `POST /cridit/evaluation/score/human`
  Computes the human-side trust score from human input data.
- `POST /cridit/evaluation/score/human/preflight`
  Computes a human-side trust score directly from preflight inputs.
- `POST /cridit/evaluation/score/machine`
  Computes the machine-side trust score from evidence.
- `POST /cridit/machine/events`
  Records machine-side trust events and returns the updated machine trust result.
- `POST /cridit/calibration/trustCues`
  Produces trust cues and records calibration history.
- `POST /cridit/calibration/record`
  Stores a manual calibration record.
- `POST /cridit/postflight`
  Stores postflight questionnaire responses.
- `GET /cridit/session/next`
  Returns the next session identifier.
- `GET /cridit/calibration/latest/{scenario}`
  Returns the latest calibration record for a scenario.
- `GET /cridit/calibration/history/{scenario}`
  Returns calibration history for a scenario.

Additional communication routes are exposed at the backend root:

- `GET /inputs`
- `GET /inputs/{scenario}`
- `POST /inputs/{scenario}`
- `GET /chat/{scenario}`
- `POST /chat/{scenario}`
- `POST /openai/respond`

## Data Persistence

The prototype stores JSONL records in `backend/src/main/resources/`.

Important files:

- `cridit-preflight-answers.jsonl`
- `cridit-postflight-answers.jsonl`
- `cridit-chat-history.jsonl`
- `cridit-calibration-history.jsonl`

This is file-based persistence for a prototype, not a production deployment.

## Configuration Notes

- Backend defaults are defined in `backend/src/main/resources/application.properties`.
- The backend listens on `0.0.0.0:8001`.
- CORS is currently configured for the `cridit-mock-up` host on the frontend ports used by the project.
- `OPENAI_API_KEY` is read from configuration or the environment for `POST /openai/respond`.
