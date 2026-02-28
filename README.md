# DevTask — Jira-like Task Management App

A full-stack task management application with a Kanban board, user authentication, and real-time task updates.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma ORM |
| Containerization | Docker / Docker Compose |

## Project Structure

```
Devtask/
├── backend/      # Express API server
│   ├── prisma/   # Database schema & migrations
│   └── src/      # Routes, controllers, services
├── frontend/     # React (Vite) SPA
│   └── src/      # Pages, components, hooks
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for the database)
- A `.env` file in `backend/` (see `.env.example`)

### 1. Start the database
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:3000`.

## Environment Variables

Create `backend/.env` with the following keys:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_here
PORT=3000
```
