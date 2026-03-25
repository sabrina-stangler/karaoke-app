# Karaoke App

A full-stack karaoke application with a React TypeScript frontend and an Elixir Phoenix backend.

## Project Structure

This is a monorepo containing:

- **web-singer/** - React TypeScript web application built with Vite
- **server/** - Elixir Phoenix API server
- **desktop-dj/** - Electron desktop application (also built with React TypeScript)

## Prerequisites

- Node.js 18+ and npm
- Elixir 1.19+
- Erlang/OTP 28+
- PostgreSQL 14+

## Getting Started

### Web Singer Setup

```bash
cd web-singer
npm install
npm run dev
```

The web app will be available at http://localhost:5173

### Server Setup

1. Configure your database in `server/config/dev.exs`

2. Create and migrate the database:
```bash
cd server
mix ecto.create
mix ecto.migrate
```

3. Start the Phoenix server:
```bash
mix phx.server
```

The backend API will be available at http://localhost:4000

### Desktop DJ Setup

```bash
cd desktop-dj
npm install
npm run dev
```

The desktop app will launch as a native application on port 5174 (for hot reload during development).

## Development

### Installing Dependencies

```bash
# Server
cd server && mix deps.get

# Web Singer
cd web-singer && npm install

# Desktop DJ
cd desktop-dj && npm install
```

### Running All Services

Run each service in a separate terminal:

**Terminal 1 (Server):**
```bash
cd server && mix phx.server
```

**Terminal 2 (Web Singer):**
```bash
cd web-singer && npm run dev
```

**Terminal 3 (Desktop DJ - optional):**
```bash
cd desktop-dj && npm run dev
```

## Project Commands

### Web Singer (Web)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Desktop DJ (Electron)
- `npm run dev` - Start Electron app in development mode
- `npm run build` - Build the renderer process
- `npm run package` - Package the app for your current platform
- `npm run package:mac` - Package for macOS
- `npm run package:win` - Package for Windows
- `npm run package:linux` - Package for Linux

### Server
- `mix phx.server` - Start Phoenix server
- `iex -S mix phx.server` - Start Phoenix with interactive shell
- `mix test` - Run tests
- `mix ecto.create` - Create database
- `mix ecto.migrate` - Run migrations
- `mix ecto.reset` - Drop, create, and migrate database

## Testing

```bash
# Server tests
cd server && mix test

# Web Singer tests
cd web-singer && npm test

# Desktop DJ tests
cd desktop-dj && npm test
```

## License

See LICENSE file for details.
