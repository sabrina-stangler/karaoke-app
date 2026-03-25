import { useState, useEffect } from 'react';
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-xl py-12 px-10 max-w-md w-full text-center">
          <div className="text-[56px] mb-4">🎤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Ended</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">The DJ has ended this karaoke session. Thanks for singing!</p>
          <button
            className="bg-violet-600 text-white w-full py-3.5 px-6 rounded-lg text-base font-semibold cursor-pointer hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/95 backdrop-blur px-6 py-3 flex justify-between items-center gap-4 shadow-md sticky top-0 z-10 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-violet-600">🎤 Karaoke Night</span>
          <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-[13px] font-semibold tracking-widest">
            Session {session.code}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className={activeTab === 'browse'
              ? 'px-4 py-2 rounded-lg border-2 border-violet-600 bg-violet-600 text-sm font-medium text-white cursor-pointer transition-all'
              : 'px-4 py-2 rounded-lg border-2 border-gray-200 bg-transparent text-sm font-medium text-gray-600 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-all'}
            onClick={() => setActiveTab('browse')}
          >
            Browse Songs
          </button>
          <button
            className={activeTab === 'queue'
              ? 'px-4 py-2 rounded-lg border-2 border-violet-600 bg-violet-600 text-sm font-medium text-white cursor-pointer transition-all'
              : 'px-4 py-2 rounded-lg border-2 border-gray-200 bg-transparent text-sm font-medium text-gray-600 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-all'}
            onClick={() => setActiveTab('queue')}
          >
            Queue
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-3xl w-full mx-auto">
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
