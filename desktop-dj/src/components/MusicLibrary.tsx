import { useState, useEffect } from 'react';
import { Song } from '../types';
import { apiService } from '../api';

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

  const inputCls = 'flex-1 px-2.5 py-2.5 border-2 border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-[#667eea] disabled:bg-gray-100 disabled:cursor-not-allowed';
  const btnBase = 'px-4 py-2 border-0 rounded text-sm font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const btnPrimary = `${btnBase} bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:-translate-y-0.5 hover:shadow-md`;
  const btnSecondary = `${btnBase} bg-gray-500 text-white hover:bg-gray-600`;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 m-0">🎵 Music Library</h2>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#667eea] text-base">{songs.length} songs</span>
          <button onClick={() => setShowBulkAdd(!showBulkAdd)} className={btnSecondary}>
            {showBulkAdd ? 'Single Song' : 'Bulk Add'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-3 py-3 rounded-lg mb-4 border-l-4 border-red-500">{error}</div>
      )}

      {!showBulkAdd ? (
        <form onSubmit={handleSingleUpload} className="mb-6">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Song Title"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              disabled={isUploading}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Artist"
              value={uploadData.artist}
              onChange={(e) => setUploadData({ ...uploadData, artist: e.target.value })}
              disabled={isUploading}
              className={inputCls}
            />
            <input
              type="number"
              placeholder="Duration (sec)"
              value={uploadData.duration}
              onChange={(e) => setUploadData({ ...uploadData, duration: e.target.value })}
              disabled={isUploading}
              className="w-36 px-2.5 py-2.5 border-2 border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-[#667eea] disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button type="submit" disabled={isUploading} className={btnPrimary}>
              {isUploading ? 'Adding...' : 'Add Song'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-300 px-3 py-3 rounded-lg mb-3 text-yellow-800 text-sm">
            Enter songs in format:{' '}
            <code className="bg-black/10 px-1.5 py-0.5 rounded font-mono">Artist - Title - Duration</code>{' '}
            (one per line)
          </div>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={"Queen - Bohemian Rhapsody - 354\nJourney - Don't Stop Believin' - 251"}
            rows={10}
            disabled={isUploading}
            className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-sm font-mono resize-y mb-3 focus:outline-none focus:border-[#667eea] disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button onClick={handleBulkUpload} disabled={isUploading} className={btnPrimary}>
            {isUploading ? 'Uploading...' : 'Upload Songs'}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search songs..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value) loadSongs();
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-2.5 py-2.5 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
        />
        <button onClick={handleSearch} className={btnSecondary}>Search</button>
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); loadSongs(); }} className={btnSecondary}>
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500 text-base">Loading songs...</div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="my-2 text-base">No songs in library yet.</p>
              <p className="my-2 text-base">Add your first song above to get started!</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200">Title</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200">Artist</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-600 border-b-2 border-gray-200 w-24">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song) => (
                  <tr key={song.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-800 font-medium">{song.title}</td>
                    <td className="px-3 py-3 text-gray-500">{song.artist}</td>
                    <td className="px-3 py-3 text-gray-400 text-right font-mono">
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
