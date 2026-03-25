.PHONY: help install dev test clean frontend backend

help:
	@echo "Karaoke App - Monorepo Commands"
	@echo "================================"
	@echo "make install    - Install all dependencies (frontend & backend)"
	@echo "make dev        - Run both frontend and backend (requires 2 terminals)"
	@echo "make test       - Run all tests"
	@echo "make clean      - Clean build artifacts"
	@echo "make frontend   - Run only frontend dev server"
	@echo "make backend    - Run only backend server"

install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing backend dependencies..."
	cd backend && mix deps.get
	@echo "All dependencies installed!"

frontend:
	cd frontend && npm run dev

backend:
	cd backend && mix phx.server

test:
	@echo "Running frontend tests..."
	cd frontend && npm test
	@echo "Running backend tests..."
	cd backend && mix test

clean:
	@echo "Cleaning frontend..."
	cd frontend && rm -rf dist node_modules/.vite
	@echo "Cleaning backend..."
	cd backend && mix clean
	@echo "Clean complete!"

dev:
	@echo "To run both services, open two terminals:"
	@echo "Terminal 1: make frontend"
	@echo "Terminal 2: make backend"
