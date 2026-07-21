# MediCare AI

MediCare AI is a full-stack telemedicine and health assistant platform built for fast, guided care workflows. It combines patient onboarding, AI-assisted symptom review, report analysis, reminder management, SOS support, medicine tools, doctor discovery, and appointment booking inside one connected workspace.

## Highlights

- Modern React + Vite frontend with a tailored healthcare dashboard
- Node.js + Express backend with JWT-based authentication
- AI-assisted symptom checking and medical report analysis
- Emergency SOS workflow with live location capture and nearby responder lookup
- Appointment booking with online consultation room support
- Medicine reminders, doctor directory, and medicine price tooling
- SQLite-backed persistence for local development with lightweight setup

## Core Modules

- `Authentication`: signup, login, profile management, emergency contact setup
- `Dashboard`: operational care overview with charts, readiness scoring, and quick actions
- `Symptom Checker`: AI-guided symptom screening and history review
- `Report Analysis`: OCR-assisted document parsing with structured AI summaries
- `Appointments`: doctor selection, booking, payment demo flow, and consultation room
- `SOS`: live-location emergency workflow with nearby hospital and police lookup
- `Reminders`: medicine schedule creation and active adherence tracking
- `Medicine Tools`: medicine search / comparison support
- `Chat Assistant`: contextual in-app help for key workflows

## Tech Stack

### Frontend

- React 18
- React Router
- Vite
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express
- JWT authentication
- Sequelize
- SQLite
- Multer
- OCR + AI provider integrations

## Project Structure

```text
.
├── backend/                  # Express API, services, models, routes
├── src/                      # React application
├── public/                   # Static frontend assets if added later
├── render.yaml               # Render deployment config
├── package.json              # Root frontend / deployment scripts
└── README.md
```

## Local Development

### Prerequisites

- Node.js `18.18+`
- npm

### 1. Install dependencies

```bash
npm install
```

This installs the root frontend dependencies and the backend dependencies defined under `backend/`.

### 2. Configure backend environment

Create a backend env file:

```bash
cp backend/.env.example backend/.env
```

Then update the required values in `backend/.env`.

### 3. Point the frontend to your local API

Create a root development env file:

```bash
cp .env.example .env.development
```

If you change the backend `PORT`, make sure `VITE_API_BASE_URL` matches it.

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

### 4. Run the backend

```bash
npm run backend:dev
```

### 5. Run the frontend

In a second terminal:

```bash
npm run dev
```

### 6. Open the app

- Frontend: `http://localhost:5173`
- Backend health check: `http://127.0.0.1:5000/api/health`

## Available Scripts

### Root

- `npm run dev` - start the Vite frontend
- `npm run backend:dev` - start the backend in watch mode
- `npm run build` - create a production frontend build
- `npm run preview` - preview the production frontend build
- `npm start` - start the backend from the root package

### Backend

- `npm run dev --prefix backend` - start the Express API with nodemon
- `npm start --prefix backend` - start the Express API in production mode

## Environment Variables

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Recommended | Base URL for the backend API during local development |

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | Environment name, usually `development` or `production` |
| `PORT` | No | Backend server port, defaults to `5000` |
| `CLIENT_URL` | Recommended | Allowed frontend origin(s) for CORS |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No | JWT expiry duration |
| `AI_PROVIDER` | No | `local`, `openai`, or `gemini` |
| `OPENAI_API_KEY` | Optional | OpenAI API key |
| `OPENAI_MODEL` | Optional | OpenAI model override |
| `GEMINI_API_KEY` | Optional | Gemini API key |
| `GEMINI_MODEL` | Optional | Gemini model override |
| `GROQ_API_KEY` | Optional | Groq key for chatbot flows |
| `GROQ_MODEL` | Optional | Groq model override |
| `OCR_PROVIDER_URL` | Optional | External OCR provider endpoint |
| `OCR_API_KEY` | Optional | OCR provider API key |
| `SQLITE_STORAGE_PATH` | Optional | Custom SQLite file location |
| `DB_AUTO_ALTER` | Optional | Set to `false` to disable schema auto-alter on startup |
| `DB_STRICT_START` | Optional | Strict startup behavior for database boot |
| `MAX_FILE_SIZE_MB` | Optional | Upload size limit |
| `MEETING_BASE_URL` | Optional | Custom meeting base URL instead of the default Jitsi flow |

## Database Notes

- The current backend uses SQLite through Sequelize for local persistence.
- The SQLite database file is stored at `backend/database.sqlite` by default.
- `MONGODB_URI` may still appear in older env examples for compatibility history, but the current local setup does not require MongoDB to run.

## API Surface

Main route groups exposed by the backend:

- `/api/auth`
- `/api/chatbot`
- `/api/symptom`
- `/api/report`
- `/api/reminder`
- `/api/medicine`
- `/api/emergency`
- `/api/disease`
- `/api/appointment`

## Deployment

This repo includes a `render.yaml` configured for a Node web service:

- Build command: `npm install`
- Start command: `npm start`

Because the root package proxies startup to the backend, Render can deploy the API from the repository root.

## Notes

- Some AI and OCR workflows support graceful fallback behavior when external providers are unavailable.
- SOS currently supports live location capture, responder lookup, and action-ready emergency guidance. Direct official responder auto-dispatch requires external SMS / telephony / webhook integration.
- For the best local experience, keep frontend and backend running together in separate terminals.

## License

This project is currently unlicensed for public reuse unless you add a license file.
