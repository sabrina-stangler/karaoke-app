import { useState, useEffect } from 'react';
import './App.css';
import { JoinSession } from './components/JoinSession';
import { SongBrowser } from './components/SongBrowser';
import { QueueView } from './components/QueueView';
import { wsService } from './websocket';
import { Session, QueueEntry, Song } from './types';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [singerName, setSingerName] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'queue'>('browse');
  const [queueRefreshTrigger, setQueueRefreshTrigger] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (!session) return;

    wsService.connect(session.code).then(() => {
      wsService.onQueueUpdate((queue: QueueEntry[]) => {
        window.__singerSetQueue?.(queue);
      });

      wsService.onSongAdded((song: Song) => {
        window.__singerAddSong?.(song);
      });

      wsService.onSessionEnded(() => {
        setSessionEnded(true);
        wsService.disconnect();
      });
    });

    return () => wsService.disconnect();
  }, [session]);

  if (sessionEnded) {
    return (
      <div className="ended-screen">
        <div className="ended-card">
          <div className="ended-icon">🎤</div>
          <h2>Session Ended</h2>
          <p>The DJ has ended this karaoke session. Thanks for singing!</p>
          <button
            className="join-btn"
            onClick={() => { setSession(null); setSessionEnded(false); setSingerName(''); }}
          >
            Join Another Session
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <JoinSession onJoined={setSession} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="app-title">🎤 Karaoke Night</span>
          <span className="session-badge">Session {session.code}</span>
        </div>
        <div className="header-right">
          <button
            className={`tab-btn ${activeTab === 'browse' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Songs
          </button>
          <button
            className={`tab-btn ${activeTab === 'queue' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Queue
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'browse' ? (
          <SongBrowser
            sessionId={session.id}
            singerName={singerName}
            onSingerNameChange={setSingerName}
            onRequestSubmitted={() => {
              setQueueRefreshTrigger((n) => n + 1);
              setActiveTab('queue');
            }}
          />
        ) : (
          <QueueView
            sessionId={session.id}
            singerName={singerName}
            refreshTrigger={queueRefreshTrigger}
          />
        )}
      </main>
    </div>
  );
}

export default App;
