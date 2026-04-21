# MediCare AI Health Platform

Production-ready Node.js backend for a HealthTech hackathon project with:

- JWT authentication
- AI symptom checking
- disease risk prediction
- fake medicine verification
- OCR-powered report analysis
- medicine reminders
- SOS emergency logging
- telemedicine appointment booking with online meeting links and doctor directory

## Project Structure

The backend lives in the [`backend`](./backend) directory and follows MVC + service layer architecture.

## Run Locally

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Environment Setup

Update `backend/.env` with:

- JWT secret
- OpenAI or Gemini API keys if you want live AI provider responses
- OCR provider key if you want external OCR
- optional `SQLITE_STORAGE_PATH` if you want the SQLite file in a custom location
- optional `MEETING_BASE_URL` if you want custom meeting links instead of Jitsi

The code still runs with safe local fallbacks when AI or OCR providers are unavailable.
