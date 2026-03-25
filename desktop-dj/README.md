# Karaoke Desktop DJ App

Electron-based desktop application for the Karaoke platform. Built with React, TypeScript, and Electron.

## Features

- Native desktop application for macOS, Windows, and Linux
- Connects to the same Elixir Phoenix API backend
- Built with modern web technologies (React + TypeScript + Vite)
- Hot reload during development

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

This will start:
1. Vite dev server on port 5174
2. Electron window that loads the app

**Note:** Make sure the backend API is running at `http://localhost:4000` before starting the desktop app.

## Building

```bash
# Build the renderer (React app)
npm run build

# Package for your current platform
npm run package

# Package for specific platforms
npm run package:mac    # macOS .dmg
npm run package:win    # Windows .exe
npm run package:linux  # Linux AppImage
```

Built applications will be in the `release/` directory.

## Project Structure

```
desktop/
├── src/                # React source code
│   ├── App.tsx        # Main React component
│   ├── main.tsx       # React entry point
│   └── *.css          # Styles
├── main.js            # Electron main process
├── preload.js         # Preload script for security
├── index.html         # HTML template
└── vite.config.ts     # Vite configuration
```

## API Connection

The app connects to the backend API at `http://localhost:4000` by default. Update the `API_URL` constant in `src/App.tsx` to change this.
