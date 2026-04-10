# Calculator App

A full-stack calculator application with Next.js frontend and FastAPI backend.

## Project Structure

- `frontend/` - Next.js frontend application
- `backend/` - FastAPI backend application

## Deployment

- Frontend: Deploy to Vercel (runs tests before build)
- Backend: Deploy to Render (runs pytest)

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
uv pip install -e .
uvicorn app.main:app --reload
```