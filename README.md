# ai_fitTrack

A full-stack fitness and nutrition tracking app with an AI coach powered by Google Gemini. The app combines a React frontend, a FastAPI backend, PostgreSQL persistence, and a pgvector-backed retrieval layer so the AI coach can answer questions using the user’s real logged meals and workouts.

## Overview

ai_fitTrack helps users:

- log meals and workouts
- track calories, protein, carbs, and fat
- analyze meals with AI
- ask an AI coach for personalized insights based on past nutrition and training data
- store retrieval memory for contextual, user-specific guidance

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI (Python)
- Database: PostgreSQL
- Vector search: pgvector
- AI: Google Gemini
- Auth: JWT with bcrypt
- Containerization: Docker and Docker Compose

## Project Structure

```text
ai_fitTrack/
├── client/                 # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/                 # FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yaml     # Local services for database, backend, and frontend
├── .env                    # Local environment variables
├── README.md               # Project overview
└── package.json            # Optional root scripts if added later
```

## Features

- User authentication and guest login
- Meal logging and macro breakdown
- Workout logging
- AI-powered food analysis
- AI coach chat grounded in the user’s data history
- pgvector memory storage for retrieval-augmented generation (RAG)

## Local Development

### Prerequisites

- Docker Desktop or Docker Engine
- Node.js 18+
- Python 3.11+
- A Gemini API key from Google AI Studio

### 1. Create environment variables

Create a `.env` file in the project root with the following values:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_long_random_secret_here
```

### 2. Start the app

```bash
docker compose up --build
```

This starts:

- PostgreSQL with pgvector support
- FastAPI backend on port 8000
- Vite frontend on port 5173

### 3. Access the app

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

## Backend Notes

The FastAPI app lives in `server/app` and includes:

- auth routes
- meal routes
- workout routes
- chat router for the AI coach
- retrieval memory layer backed by pgvector

## RAG / Memory Layer

The AI coach is designed to retrieve relevant user history before answering a question. It stores summarized meal and workout records as vector embeddings in PostgreSQL, then performs similarity search to find the most relevant context.

This means the coach can answer questions like:

- What did I eat recently?
- How much protein have I had today?
- Did I have enough carbs after my workout?

## Production Notes

This project is meant to be deployed across separate services:

- Frontend: Vercel
- Backend: Render
- Database: Neon Postgres with pgvector enabled

Before production deployment, make sure the database has the `vector` extension and a `memory_item` table configured for the embedding dimension used by the app.

## Environment Variables for Production

For Render or another deployment environment, set:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_long_random_secret_here
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIMENSIONS=3072
PORT=8000
```

## Useful Commands

### Backend

```bash
cd server
python -m compileall app
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
docker compose down
```

## License

This project is currently for personal or educational use unless otherwise specified.

## Status

The project includes a working local development setup and a pgvector-backed AI coaching flow. It is ready for further hardening before production deployment, especially around schema migrations, environment protection, and deployment validation.

