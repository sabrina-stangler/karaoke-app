import { useState, useEffect, useCallback } from 'react';
import { QueueEntry } from '../types';
import { apiService } from '../api';
import { QueueRow } from './QueueRow';

declare global {
  interface Window {
    __singerSetQueue?: React.Dispatch<React.SetStateAction<QueueEntry[]>>;
  }
}

interface QueueViewProps {
  sessionId: string;
  singerName: string;
  refreshTrigger: number;
}

export function QueueView({ sessionId, singerName, refreshTrigger }: QueueViewProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getQueue(sessionId);
      setQueue(data);
    } catch {
      setError('Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, refreshTrigger]);

  // Expose setQueue so parent can push WebSocket updates
  useEffect(() => {
    window.__singerSetQueue = setQueue;
    return () => { delete window.__singerSetQueue; };
  }, []);

  const upcoming = queue.filter((e) => e.status === 'pending');
  const history = queue.filter((e) => e.status === 'completed' || e.status === 'skipped');
  const isMine = (e: QueueEntry) =>
    !!singerName && e.singer_name.toLowerCase() === singerName.toLowerCase();
  const nowPlaying = upcoming[0] ?? null;
  const rest = upcoming.slice(1);
  const displayedRest = showMineOnly ? rest.filter(isMine) : rest;
  const displayedHistory = showMineOnly ? history.filter(isMine) : history;
  const hasMySongs = upcoming.some(isMine);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Queue</h2>
        <div className="flex items-center gap-2">
          {hasMySongs && (
            <button
              className={showMineOnly
                ? 'px-3 py-1.5 rounded-full border-2 border-white bg-white text-violet-600 text-[13px] font-semibold cursor-pointer hover:bg-white/85 transition-all'
                : 'px-3 py-1.5 rounded-full border-2 border-white/50 bg-transparent text-white text-[13px] font-semibold cursor-pointer hover:bg-white/20 transition-all'}
              onClick={() => setShowMineOnly((v) => !v)}
            >
              {showMineOnly ? '★ My songs' : '☆ My songs'}
            </button>
          )}
          <button
            className="bg-white/20 text-white px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer hover:bg-white/30 transition-colors disabled:opacity-50"
            onClick={loadQueue}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '↻'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm text-center">{error}</div>
      )}

      {isLoading && queue.length === 0 ? (
        <div className="text-center py-12 px-6 text-gray-400 text-sm bg-white rounded-lg shadow-lg">
          Loading queue...
        </div>
      ) : (
        <>
          {nowPlaying && (
            <div className={`bg-white rounded-xl p-4 flex flex-col gap-1 shadow-lg border-l-4 ${isMine(nowPlaying) ? 'border-violet-600 bg-violet-50' : 'border-violet-600'}`}>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-violet-600 mb-1">
                🎤 Now Performing
              </span>
              <span className="text-base font-bold text-gray-800">{nowPlaying.song?.title ?? 'Unknown'}</span>
              {nowPlaying.song?.artist && (
                <span className="text-[13px] text-gray-400">{nowPlaying.song.artist}</span>
              )}
              <span className="text-[13px] font-semibold text-violet-600 mt-1">{nowPlaying.singer_name}</span>
            </div>
          )}

          {displayedRest.length === 0 && !nowPlaying ? (
            <div className="text-center py-12 px-6 text-gray-400 text-sm bg-white rounded-lg shadow-lg">
              {showMineOnly ? 'No upcoming songs from you' : 'No upcoming songs'}
            </div>
          ) : displayedRest.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {displayedRest.map((entry) => (
                <QueueRow
                  key={entry.id}
                  entry={entry}
                  isMine={isMine(entry)}
                  displayPosition={rest.indexOf(entry) + 2}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      {displayedHistory.length > 0 && (
        <div className="mt-4 border-t border-dashed border-white/30 pt-2">
          <button
            className="bg-transparent border-none text-white text-[13px] cursor-pointer py-1 w-full text-left hover:text-white/70 transition-colors"
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? '▲ Hide history' : `▼ Show history (${displayedHistory.length})`}
          </button>
          {showHistory && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-2">
              {displayedHistory.map((entry) => (
                <div key={entry.id} className="opacity-60">
                  <QueueRow entry={entry} showStatus />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
