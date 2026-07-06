# NexusERP

NexusERP is a comprehensive enterprise resource planning system with modular architecture. 
It consists of a FastAPI Python backend (MySQL database) and a React/Vite frontend.

## Architecture Overview

- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, PyMySQL. Connects to a MySQL 8+ instance. Uses JWT-based stateless RBAC authentication.
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand (state management), and TanStack Query v5.
- **Security**: Strict CORS policies, rate limiting for sensitive endpoints (like CEO password resets), and hashed passwords via `bcrypt`.

## Local Setup

### 1. Prerequisites
- Python 3.11
- Node.js 18+
- MySQL 8.0+

### 2. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `.\venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:
```env
MYSQL_URL=mysql+pymysql://user:password@127.0.0.1:3306/nexuserp
JWT_SECRET=your_secure_random_string
JWT_REFRESH_SECRET=your_secure_random_string_2
RESET_SECRET=your_emergency_reset_secret
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
NODE_ENV=development
```

Run the backend:
```bash
uvicorn app.main:app --reload --port 5001
```

### 3. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5001
```

Run the frontend:
```bash
npm run dev
```

## Running Tests

### Backend Tests (Pytest)
The backend test suite uses an in-memory SQLite database, so you don't need a test MySQL instance running locally.
```bash
cd backend
pytest -v
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm run test
```

## Deployment Process

NexusERP supports deployment via Docker or managed PaaS platforms like Render and Vercel.

- **Backend (Render)**: Connect your repository to Render. It uses `render.yaml` automatically. Make sure to define the Environment Variables in the Render dashboard. The `preDeployCommand` automatically runs the RBAC seed script.
- **Frontend (Vercel)**: Connect the frontend folder to Vercel. Ensure `VITE_API_URL` is set to your Render backend URL.
