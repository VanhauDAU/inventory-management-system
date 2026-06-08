# Frontend React App

This folder contains a Vite + React frontend for the project.

## Setup

1. Open `frontend`
2. Run `npm install`
3. Run `npm run dev`

## Environment variables

Create a `.env` file in `frontend/` and add backend connection variables, for example:

```env
VITE_API_URL=http://localhost:8000/api
```

Then use it in React with `import.meta.env.VITE_API_URL`.
