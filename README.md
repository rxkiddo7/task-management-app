# Taskflow — Task Management Application

Full-stack task manager with React, Express, MongoDB, JWT authentication and responsive UI.

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas

## Run the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env`, then set your MongoDB connection string and a strong JWT secret.
```bash
npm run dev
```
Backend: http://localhost:5000

## Run the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Features
- Register/login with hashed passwords and JWT
- User-specific, protected task API
- Create, edit, delete and complete tasks
- Pending / In Progress / Completed status
- Low / Medium / High priority and due dates
- Search and filter tasks
- Responsive layout for desktop and mobile
- Periodic refresh for updates

Never upload `.env` or real credentials to GitHub.
