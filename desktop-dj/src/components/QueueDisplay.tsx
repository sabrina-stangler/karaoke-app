import { useState, useEffect } from 'react';
import { QueueEntry } from '../types';
import { apiService } from '../api';
import { wsService, QueueUpdatePayload } from '../websocket';

interface QueueDisplayProps {
  sessionId: string;
  onQueueUpdated?: (queue: QueueEntry[]) => void;
}

export function QueueDisplay({ sessionId, onQueueUpdated }: QueueDisplayProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    loadQueue();
  }, [sessionId]);

  // Live updates via WebSocket
  useEffect(() => {
    wsService.onQueueUpdate((payload: QueueUpdatePayload) => {
      if (!payload.entry) {
        // Unknown action — fall back to full refetch
        loadQueue();
        return;
      }
      const entry = payload.entry;
      if (payload.action === 'added') {
        setQueue((prev) => {
          // Guard against duplicate (e.g. own broadcast echo)
          if (prev.find((e) => e.id === entry.id)) return prev;
          return [...prev, entry];
        });
      } else if (payload.action === 'completed' || payload.action === 'skipped') {
        setQueue((prev) =>
          prev.map((e) => (e.id === entry.id ? entry : e))
        );
      } else {
        loadQueue();
      }
    });
  }, [sessionId]);

  const loadQueue = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getQueue(sessionId);
      setQueue(data);
      onQueueUpdated?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (entryId: string) => {
    try {
      await apiService.completeQueueEntry(entryId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete entry');
    }
  };

  const handleSkip = async (entryId: string) => {
    try {
      await apiService.skipQueueEntry(entryId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip entry');
    }
  };

  const pendingQueue = queue.filter(entry => entry.status === 'pending');
  const nowPlaying = pendingQueue[0] ?? null;

  const filteredQueue = filter === 'pending'
    ? pendingQueue.slice(1)
    : queue;

  const pendingCount = pendingQueue.length;

  const btnBase = 'px-3 py-1.5 border-0 rounded text-sm font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 m-0">🎤 Request Queue</h2>
          <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-[#ede9fe] text-[#667eea]">{pendingCount}</span>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filter === 'pending'}
              onChange={(e) => setFilter(e.target.checked ? 'pending' : 'all')}
              className="w-4 h-4 accent-[#667eea] cursor-pointer"
            />
            Show only upcoming songs
          </label>
          <button onClick={loadQueue} className={`${btnBase} ml-auto bg-gray-100 text-gray-600 hover:bg-gray-200 text-lg px-2.5 py-1`} title="Refresh queue">
            ↻
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-3 py-3 rounded-lg mb-4 border-l-4 border-red-500">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500 text-base">Loading queue...</div>
      ) : (
        <>
          {/* Now Playing card */}
          {nowPlaying ? (
            <div className="rounded-xl p-5 mb-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                  🎵 Now Playing
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 text-2xl shrink-0">
                  🎤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                    {nowPlaying.song?.title || 'Unknown Song'}
                  </div>
                  <div className="text-white/80 text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {nowPlaying.song?.artist || 'Unknown Artist'}
                  </div>
                  <div className="text-white/70 text-sm">
                    Singer: <span className="font-semibold text-white">{nowPlaying.singer_name}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleComplete(nowPlaying.id)}
                    className="px-4 py-2 border-0 rounded-lg text-sm font-semibold cursor-pointer bg-white text-[#667eea] hover:bg-white/90 transition-all"
                  >
                    ✓ Complete
                  </button>
                  <button
                    onClick={() => handleSkip(nowPlaying.id)}
                    className="px-4 py-2 border-0 rounded-lg text-sm font-semibold cursor-pointer bg-white/20 text-white hover:bg-white/30 transition-all"
                  >
                    ⏭ Skip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            queue.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="my-2 text-base">No song requests yet.</p>
                <p className="my-2 text-base">Singers can request songs by joining with your session code!</p>
              </div>
            )
          )}

          {/* Queue list */}
          {filteredQueue.length > 0 && (
            <>
              {filter === 'pending' && (
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Up Next</h3>
              )}
              <div className="max-h-[500px] overflow-y-auto">
                {filteredQueue.map((entry, index) => {
                  const isCompleted = entry.status === 'completed';
                  const isSkipped = entry.status === 'skipped';
                  // In pending mode: now-playing is #1, so "up next" list starts at #2
                  const displayPosition = filter === 'pending' ? index + 2 : entry.position + 1;
                  return (
                    <div
                      key={entry.id}
                      className={[
                        'border-2 rounded-lg p-4 mb-3 flex items-center gap-4 transition-all',
                        isCompleted
                          ? 'opacity-70 bg-green-50 border-green-400'
                          : isSkipped
                          ? 'opacity-60 bg-amber-50 border-amber-400'
                          : 'bg-white border-gray-200 hover:border-[#667eea] hover:shadow-md',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-lg shrink-0',
                          isCompleted
                            ? 'bg-green-500'
                            : isSkipped
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-br from-[#667eea] to-[#764ba2]',
                        ].join(' ')}
                      >
                        {displayPosition}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="block font-semibold text-base text-gray-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {entry.song?.title || 'Unknown Song'}
                          </span>
                          <span className="block text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {entry.song?.artist || 'Unknown Artist'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Singer:</span>
                          <span className="font-semibold text-[#667eea]">{entry.singer_name}</span>
                        </div>
                      </div>

                      {(entry.status === 'completed' || entry.status === 'skipped') && (
                        <div className="shrink-0">
                          {entry.status === 'completed' ? (
                            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-green-50 text-green-800">✅ Completed</span>
                          ) : (
                            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-orange-50 text-orange-800">⏭️ Skipped</span>
                          )}
                        </div>
                      )}

                      {entry.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleComplete(entry.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border-0 cursor-pointer bg-green-100 text-green-700 hover:bg-green-500 hover:text-white transition-all text-base"
                            title="Complete"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleSkip(entry.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border-0 cursor-pointer bg-gray-100 text-gray-500 hover:bg-amber-400 hover:text-white transition-all text-base"
                            title="Skip"
                          >
                            ⏭
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Empty state for pending filter with no upcoming songs */}
          {filter === 'pending' && pendingCount === 0 && queue.length > 0 && (
            <div className="text-center py-10 text-gray-400 text-base">
              No more songs in the queue.
            </div>
          )}
        </>
      )}
    </div>
  );
}
