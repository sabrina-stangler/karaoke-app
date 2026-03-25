import { useState, useEffect } from 'react';
import { Song } from '../types';
import { apiService } from '../api';
import './MusicLibrary.css';

interface MusicLibraryProps {
  sessionId: string;
}

export function MusicLibrary({ sessionId }: MusicLibraryProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [uploadData, setUploadData] = useState({
    title: '',
    artist: '',
    duration: '',
  });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  useEffect(() => {
    loadSongs();
  }, [sessionId]);

  const loadSongs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getSongs(sessionId);
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadData.title.trim() || !uploadData.artist.trim()) {
      setError('Title and artist are required');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const song = {
        title: uploadData.title,
        artist: uploadData.artist,
        duration: uploadData.duration ? parseInt(uploadData.duration) : undefined,
      };

      await apiService.createSongsBulk(sessionId, [song]);
      setUploadData({ title: '', artist: '', duration: '' });
      await loadSongs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload song');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      setError('Please enter at least one song');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const songs = lines.map(line => {
        const [artist, title, duration] = line.split(' - ');
        return {
          artist: artist?.trim() || 'Unknown Artist',
          title: title?.trim() || 'Unknown Song',
          duration: duration ? parseInt(duration.trim()) : undefined,
        };
      });

      await apiService.createSongsBulk(sessionId, songs);
      setBulkInput('');
      setShowBulkAdd(false);
      await loadSongs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload songs');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSongs();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const results = await apiService.searchSongs(sessionId, searchQuery);
      setSongs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search songs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSongs = searchQuery
    ? songs.filter(
        song =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : songs;

  return (
    <div className="music-library">
      <div className="library-header">
        <h2>🎵 Music Library</h2>
        <div className="library-stats">
          <span className="song-count">{songs.length} songs</span>
          <button
            onClick={() => setShowBulkAdd(!showBulkAdd)}
            className="btn btn-secondary btn-sm"
          >
            {showBulkAdd ? 'Single Song' : 'Bulk Add'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!showBulkAdd ? (
        <form onSubmit={handleSingleUpload} className="upload-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Song Title"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              disabled={isUploading}
            />
            <input
              type="text"
              placeholder="Artist"
              value={uploadData.artist}
              onChange={(e) => setUploadData({ ...uploadData, artist: e.target.value })}
              disabled={isUploading}
            />
            <input
              type="number"
              placeholder="Duration (sec)"
              value={uploadData.duration}
              onChange={(e) => setUploadData({ ...uploadData, duration: e.target.value })}
              disabled={isUploading}
              style={{ width: '150px' }}
            />
            <button type="submit" disabled={isUploading} className="btn btn-primary btn-sm">
              {isUploading ? 'Adding...' : 'Add Song'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bulk-upload">
          <p className="bulk-help">
            Enter songs in format: <code>Artist - Title - Duration</code> (one per line)
          </p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="Queen - Bohemian Rhapsody - 354&#10;Journey - Don't Stop Believin' - 251"
            rows={10}
            disabled={isUploading}
          />
          <button
            onClick={handleBulkUpload}
            disabled={isUploading}
            className="btn btn-primary"
          >
            {isUploading ? 'Uploading...' : 'Upload Songs'}
          </button>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search songs..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value) loadSongs();
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="btn btn-secondary btn-sm">
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              loadSongs();
            }}
            className="btn btn-secondary btn-sm"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="loading">Loading songs...</div>
      ) : (
        <div className="songs-list">
          {filteredSongs.length === 0 ? (
            <div className="empty-state">
              <p>No songs in library yet.</p>
              <p>Add your first song above to get started!</p>
            </div>
          ) : (
            <table className="songs-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song) => (
                  <tr key={song.id}>
                    <td className="song-title">{song.title}</td>
                    <td className="song-artist">{song.artist}</td>
                    <td className="song-duration">
                      {song.duration
                        ? `${Math.floor(song.duration / 60)}:${(song.duration % 60)
                            .toString()
                            .padStart(2, '0')}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
