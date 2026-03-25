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
    <div className="browser-container">
      {/* Singer name bar */}
      <div className="singer-bar">
        <label className="singer-label">Your name:</label>
        <input
          type="text"
          value={singerName}
          onChange={(e) => {
            onSingerNameChange(e.target.value);
            setNameError('');
          }}
          placeholder="Enter your name"
          className={`singer-name-input ${nameError ? 'input-error' : ''}`}
          maxLength={50}
        />
        {nameError && <span className="name-error">{nameError}</span>}
      </div>

      {/* Search */}
      <div className="search-row">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs or artists..."
          className="search-input"
        />
        <span className="song-count">{filteredSongs.length} songs</span>
      </div>

      {successMessage && (
        <div className="success-banner">{successMessage}</div>
      )}
      {error && <div className="error-banner">{error}</div>}

      {/* Song list */}
      {isLoading ? (
        <div className="loading">Loading songs...</div>
      ) : filteredSongs.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? 'No songs match your search' : 'No songs in the library yet'}
        </div>
      ) : (
        <div className="song-list">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`song-row ${selectedSong?.id === song.id ? 'song-row-selected' : ''}`}
              onClick={() => setSelectedSong(selectedSong?.id === song.id ? null : song)}
            >
              <div className="song-info">
                <span className="song-title">{song.title}</span>
                <span className="song-artist">{song.artist}</span>
              </div>
              {song.duration && (
                <span className="song-duration">{formatDuration(song.duration)}</span>
              )}
              {selectedSong?.id === song.id && (
                <button
                  className="request-btn"
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
