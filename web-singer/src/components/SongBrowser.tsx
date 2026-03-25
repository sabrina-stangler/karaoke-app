import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { apiService } from '../api';

declare global {
  interface Window {
    __singerAddSong?: (song: Song) => void;
  }
}

interface SongBrowserProps {
  sessionId: string;
  singerName: string;
  onSingerNameChange: (name: string) => void;
  onRequestSubmitted: () => void;
}

export function SongBrowser({
  sessionId,
  singerName,
  onSingerNameChange,
  onRequestSubmitted,
}: SongBrowserProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [nameError, setNameError] = useState('');

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getSongs(sessionId);
      setSongs(data);
      setFilteredSongs(data);
    } catch {
      setError('Failed to load song library');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Re-filter whenever songs or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(songs);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredSongs(
      songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, songs]);

  // Called when the list gets a new song via WebSocket
  const addSong = useCallback((song: Song) => {
    setSongs((prev) => {
      if (prev.find((s) => s.id === song.id)) return prev;
      return [...prev, song];
    });
  }, []);

  // Expose addSong so parent can call it on WebSocket events
  useEffect(() => {
    window.__singerAddSong = addSong;
    return () => { delete window.__singerAddSong; };
  }, [addSong]);

  const handleRequest = async () => {
    if (!singerName.trim()) {
      setNameError('Please enter your name before requesting a song');
      return;
    }
    if (!selectedSong) return;

    setNameError('');
    setIsRequesting(true);
    try {
      await apiService.createQueueEntry(sessionId, selectedSong.id, singerName.trim());
      setSuccessMessage(`"${selectedSong.title}" added to the queue!`);
      setSelectedSong(null);
      onRequestSubmitted();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Singer name bar */}
      <div className="bg-white rounded-lg p-4 flex items-center gap-3 flex-wrap shadow-lg">
        <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Your name:</label>
        <input
          type="text"
          value={singerName}
          onChange={(e) => {
            onSingerNameChange(e.target.value);
            setNameError('');
          }}
          placeholder="Enter your name"
          className={`flex-1 min-w-40 px-3 py-2 border-2 ${nameError ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm outline-none focus:border-violet-600 transition-colors`}
          maxLength={50}
        />
        {nameError && <span className="text-xs text-red-500 w-full">{nameError}</span>}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs or artists..."
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-violet-600 shadow-lg transition-colors"
        />
        <span className="text-[13px] text-gray-400 whitespace-nowrap">{filteredSongs.length} songs</span>
      </div>

      {successMessage && (
        <div className="bg-emerald-100 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium text-center">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm text-center">{error}</div>
      )}

      {/* Song list */}
      {isLoading ? (
        <div className="text-center py-12 px-6 text-gray-400 text-sm bg-white rounded-lg shadow-lg">
          Loading songs...
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-12 px-6 text-gray-400 text-sm bg-white rounded-lg shadow-lg">
          {searchQuery ? 'No songs match your search' : 'No songs in the library yet'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[calc(100vh-280px)] overflow-y-auto">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors last:border-b-0 ${
                selectedSong?.id === song.id ? 'bg-violet-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedSong(selectedSong?.id === song.id ? null : song)}
            >
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-gray-800 truncate">{song.title}</span>
                <span className="text-xs text-gray-400 truncate">{song.artist}</span>
              </div>
              {song.duration && (
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDuration(song.duration)}</span>
              )}
              {selectedSong?.id === song.id && (
                <button
                  className="bg-violet-600 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer whitespace-nowrap hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequest();
                  }}
                  disabled={isRequesting}
                >
                  {isRequesting ? 'Requesting...' : 'Request'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
