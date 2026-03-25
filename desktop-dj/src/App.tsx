import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:4000';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState('Checking...');

  useEffect(() => {
    // Check if backend is reachable
    fetch(API_URL)
      .then(() => {
        setIsConnected(true);
        setApiStatus('Connected to Elixir API');
      })
      .catch(() => {
        setIsConnected(false);
        setApiStatus('Unable to connect to API');
      });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>� Karaoke Desktop DJ</h1>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {apiStatus}
        </div>
      </header>

      <main className="app-main">
        <div className="card">
          <h2>Welcome to the Desktop DJ App</h2>
          <p>
            This Electron app connects to the same Elixir Phoenix backend
            at <code>{API_URL}</code>
          </p>
          
          <div className="info">
            <p><strong>Platform:</strong> {(window as any).electron?.platform || 'unknown'}</p>
            <p><strong>Status:</strong> {isConnected ? '✅ Ready' : '❌ Backend Offline'}</p>
          </div>

          {!isConnected && (
            <div className="warning">
              Make sure the backend is running:<br />
              <code>cd backend && mix phx.server</code>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
