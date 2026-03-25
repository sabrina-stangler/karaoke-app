import { useState } from 'react';
import { Session } from '../types';
import { apiService } from '../api';

interface SessionManagerProps {
  session: Session | null;
  onSessionCreated: (session: Session) => void;
  onSessionEnded: () => void;
}

export function SessionManager({ session, onSessionCreated, onSessionEnded }: SessionManagerProps) {
  const [djName, setDjName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSession = async () => {
    if (!djName.trim()) {
      setError('Please enter your DJ name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const newSession = await apiService.createSession(djName);
      onSessionCreated(newSession);
      setDjName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;

    if (!confirm('Are you sure you want to end this session? This will notify all singers.')) {
      return;
    }

    setIsEnding(true);
    try {
      await apiService.endSession(session.id);
      onSessionEnded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setIsEnding(false);
    }
  };

  if (session) {
    return (
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-6 mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-2 opacity-90">Session Code:</label>
            <div className="text-5xl font-bold tracking-[8px] text-center bg-white/20 px-6 py-4 rounded-lg font-mono">
              {session.code}
            </div>
          </div>

          {session.dj_name && (
            <div className="flex items-center gap-2">
              <span className="font-semibold opacity-90">DJ:</span>
              <span>{session.dj_name}</span>
            </div>
          )}

          <div className="ml-auto">
            <span className="inline-block px-4 py-2 rounded-full font-semibold text-sm bg-white/20">
              {session.status === 'active' ? '🟢 Active' : '🔴 Ended'}
            </span>
          </div>
        </div>

        <button
          onClick={handleEndSession}
          disabled={isEnding || session.status === 'ended'}
          className="w-full py-3 px-6 border-0 rounded-lg text-base font-semibold cursor-pointer transition-all bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnding ? 'Ending...' : 'End Session'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Create New Session</h2>

      <div className="mb-4">
        <label htmlFor="djName" className="block mb-2 font-medium text-gray-700">DJ Name (optional):</label>
        <input
          id="djName"
          type="text"
          value={djName}
          onChange={(e) => setDjName(e.target.value)}
          placeholder="Enter your name"
          disabled={isCreating}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
          className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-3 py-3 rounded-lg mb-4 border-l-4 border-red-500">{error}</div>
      )}

      <button
        onClick={handleCreateSession}
        disabled={isCreating}
        className="w-full py-3 px-6 border-0 rounded-lg text-base font-semibold cursor-pointer transition-all bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? 'Creating...' : 'Create Session'}
      </button>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <p className="m-0 text-blue-800 text-sm leading-relaxed">
          Singers will join your karaoke session using a 4-digit code.
          Once created, you'll be able to upload your song catalog.
        </p>
      </div>
    </div>
  );
}
