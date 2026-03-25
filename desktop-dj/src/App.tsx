import { useState, useEffect } from 'react';
import { SessionManager } from './components/SessionManager';
import { MusicLibrary } from './components/MusicLibrary';
import { QueueDisplay } from './components/QueueDisplay';
import { wsService } from './websocket';
import { Session, QueueEntry, Song } from './types';

const API_URL = 'http://localhost:4000';

const tabBase = 'px-4 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer transition-all';
const tabActive = 'bg-[#7c3aed] border-[#7c3aed] text-white';
const tabInactive = 'border-gray-300 bg-transparent text-gray-600 hover:border-[#7c3aed] hover:text-[#7c3aed]';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'settings'>('queue');

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-800 m-0">🎤 Karaoke Desktop DJ</h1>
          <div className="flex gap-2">
            <button
              className={`${tabBase} ${activeTab === 'queue' ? tabActive : tabInactive}`}
              onClick={() => setActiveTab('queue')}
            >
              Queue
            </button>
            <button
              className={`${tabBase} ${activeTab === 'settings' ? tabActive : tabInactive}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙ Settings
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded font-medium text-xs text-white ${apiConnected ? 'bg-emerald-500' : 'bg-red-500'}`}>
              API: {apiConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className={`px-3 py-1.5 rounded font-medium text-xs text-white ${wsConnected ? 'bg-emerald-500' : 'bg-red-500'}`}>
              WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'queue' ? (
          <div className="max-w-7xl mx-auto">
            {session ? (
              <QueueDisplay sessionId={session.id} />
            ) : (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 text-sm shadow-lg">
                No active session. Go to{' '}
                <button
                  className="bg-transparent border-0 text-[#7c3aed] font-semibold cursor-pointer underline p-0 text-sm"
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>{' '}
                to create one.
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <SessionManager
              session={session}
              onSessionCreated={handleSessionCreated}
              onSessionEnded={handleSessionEnded}
            />
            {session && <MusicLibrary sessionId={session.id} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
