import { useState, useEffect } from 'react';
import './App.css';
import { SessionManager } from './components/SessionManager';
import { MusicLibrary } from './components/MusicLibrary';
import { QueueDisplay } from './components/QueueDisplay';
import { wsService } from './websocket';
import { Session, QueueEntry, Song } from './types';

const API_URL = 'http://localhost:4000';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  // Check API connectivity
  useEffect(() => {
    fetch(API_URL)
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  // Setup WebSocket event handlers
  useEffect(() => {
    wsService.onQueueUpdate((queue: QueueEntry[]) => {
      console.log('Queue updated:', queue);
    });

    wsService.onSongAdded((song: Song) => {
      console.log('Song added:', song);
    });

    wsService.onSessionEnded(() => {
      console.log('Session ended');
      handleSessionEnded();
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleSessionCreated = async (sessionData: Session) => {
    setSession(sessionData);
    const connected = await wsService.connect(sessionData.code);
    setWsConnected(connected);
  };

  const handleSessionEnded = () => {
    wsService.disconnect();
    setSession(null);
    setWsConnected(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎤 Karaoke Desktop DJ</h1>
          <div className="connection-status">
            <div className={`status-badge ${apiConnected ? 'connected' : 'disconnected'}`}>
              API: {apiConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <div className="left-panel">
            <SessionManager
              session={session}
              onSessionCreated={handleSessionCreated}
              onSessionEnded={handleSessionEnded}
            />
            {session && (
              <MusicLibrary
                sessionId={session.id}
              />
            )}
          </div>

          <div className="right-panel">
            {session && (
              <QueueDisplay
                sessionId={session.id}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
