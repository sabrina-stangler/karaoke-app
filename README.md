# Karaoke App

A full-stack karaoke application with a React TypeScript frontend and an Elixir Phoenix backend.

## Project Structure

This is a monorepo containing:

- **frontend/** - React TypeScript application built with Vite
- **backend/** - Elixir Phoenix API server

## Prerequisites

- Node.js 18+ and npm
- Elixir 1.19+
- Erlang/OTP 28+
- PostgreSQL 14+

## Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

### Backend Setup

1. Configure your database in `backend/config/dev.exs`

2. Create and migrate the database:
```bash
cd backend
mix ecto.create
mix ecto.migrate
```

3. Start the Phoenix server:
```bash
mix phx.server
```

The backend API will be available at http://localhost:4000

## Development

### Running Both Services

You can use the provided Makefile commands:

```bash
make install    # Install all dependencies
make dev        # Run both frontend and backend
make test       # Run all tests
```

Or run them separately in different terminals:

**Terminal 1 (Frontend):**
```bash
cd frontend && npm run dev
```

**Terminal 2 (Backend):**
```bash
cd backend && mix phx.server
```

## Project Commands

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `mix phx.server` - Start Phoenix server
- `iex -S mix phx.server` - Start Phoenix with interactive shell
- `mix test` - Run tests
- `mix ecto.create` - Create database
- `mix ecto.migrate` - Run migrations
- `mix ecto.reset` - Drop, create, and migrate database

## License

See LICENSE file for details.
