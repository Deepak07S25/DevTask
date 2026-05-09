<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" width="80" alt="DevTask Logo" />
  <h1>DevTask</h1>
  <p><strong>A production-ready, highly scalable, and real-time project management application inspired by Jira.</strong></p>
  
  [![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?style=for-the-badge&logo=prisma)](https://prisma.io/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-black.svg?style=for-the-badge&logo=socketdotio)](https://socket.io/)
</div>

<br />

## 📋 Overview

**DevTask** is a comprehensive, full-stack task management application designed for modern software development teams. Built with performance, security, and developer experience in mind, it goes beyond a standard Kanban board to offer enterprise-grade features including real-time collaboration, dynamic workflows, role-based access control (RBAC), and rich reporting analytics.

## ✨ Core Features

- **Dynamic Kanban Boards:** Fluid, drag-and-drop task management with fully customizable workflow columns per project.
- **Real-Time Collaboration:** Powered by Socket.io, instantly receive notifications for task assignments, mentions, and updates without refreshing.
- **Advanced Reporting Analytics:** Generate and export professional data metrics to both Excel (XLSX) and CSV formats.
- **Role-Based Access Control (RBAC):** Granular security model ensuring strict access limits between Project Admins and Members.
- **Responsive UI:** A beautifully crafted, dark-themed, mobile-first interface featuring a fluid navigation drawer and polished micro-animations.
- **BYOK AI Observability:** "Bring Your Own Key" architecture allowing secure integration with AI tools using a zero-trust model.
- **Enterprise-Grade Security:** Hardened Express backend featuring JWT authentication, Helmet security headers, rate-limiting, and graceful process shutdowns.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Custom Vanilla CSS Design System (CSS Variables + utility classes)
- **Icons:** Lucide React
- **HTTP Client:** Axios (with interceptors)

### Backend
- **Server:** Node.js + Express
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma
- **Real-Time:** Socket.io
- **Security:** bcryptjs, jsonwebtoken, express-rate-limit, helmet

---

## 🚀 Quick Start

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database (local or cloud-hosted like Neon, Supabase)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/your-username/DevTask.git
cd DevTask
```

### 2. Setup the Backend
Navigate to the backend directory, install dependencies, and configure your environment:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on the following template:
```env
# backend/.env
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
PORT=5000
```

Run database migrations and start the server:
```bash
npx prisma db push
npm run seed      # Optional: Populates the DB with dummy data
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window, navigate to the frontend directory, and start the Vite development server:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
# frontend/.env
VITE_API_URL="http://localhost:5000/api"
```

Start the application:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 📂 Project Structure

```text
DevTask/
├── backend/                  # Node.js + Express API
│   ├── prisma/               # Database schema (schema.prisma)
│   ├── src/
│   │   ├── config/           # Environment and Socket.io setup
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/      # Auth, RBAC, Rate Limiting, Validation
│   │   ├── queues/           # Async task queues
│   │   ├── routes/           # Express API endpoints
│   │   └── services/         # Core business logic layer
│   └── server.js             # Application entry point
│
└── frontend/                 # React + Vite Client
    ├── src/
    │   ├── api/              # Axios instance configuration
    │   ├── components/       # Shared UI components
    │   ├── context/          # React Context (Auth, Notifications)
    │   ├── design-system/    # Custom UI components (Buttons, Modals, Toasts)
    │   ├── features/         # Feature-specific modules (Board, Dashboard)
    │   ├── layouts/          # Page layouts (DashboardLayout)
    │   └── pages/            # Top-level view components
    └── index.css             # Core design system tokens and variables
```

## 🛡️ Security & Architecture

- **Separation of Concerns:** The backend strictly isolates routing (`routes/`), request handling (`controllers/`), and business logic/database calls (`services/`).
- **Resource Protection:** Endpoints are protected by standard JWT Bearer tokens and dynamic role resolution (`resolveProjectRole`) that blocks unauthorized modifications.
- **Robust Error Handling:** A global error handler ensures consistent API responses without leaking internal stack traces in production.
- **Optimized Queries:** Deeply nested Prisma queries are explicitly optimized with select statements to reduce payload weight, alongside compound database indices for blazing-fast lookups.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
