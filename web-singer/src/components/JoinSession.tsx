import { useState } from 'react';
import { Session } from '../types';
import { apiService } from '../api';

interface JoinSessionProps {
  onJoined: (session: Session) => void;
}

export function JoinSession({ onJoined }: JoinSessionProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setError('Please enter a valid 4-digit session code');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const session = await apiService.getSessionByCode(trimmed);
      if (session.status !== 'active') {
        setError('This session has ended');
        return;
      }
      onJoined(session);
    } catch {
      setError('Session not found. Check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl py-12 px-10 w-full max-w-md text-center">
        <div className="text-[56px] mb-4">🎤</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Karaoke Night</h1>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          Enter the 4-digit code shown by your DJ to join the session
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="1234"
            className="text-4xl font-bold text-center p-4 border-2 border-gray-200 rounded-lg text-violet-600 outline-none w-full focus:border-violet-600 transition-colors tracking-[12px]"
            autoFocus
          />
          {error && <p className="text-red-500 text-[13px] text-left">{error}</p>}
          <button
            type="submit"
            className="bg-violet-600 text-white py-3.5 px-6 rounded-lg text-base font-semibold cursor-pointer hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={isLoading || code.length !== 4}
          >
            {isLoading ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
