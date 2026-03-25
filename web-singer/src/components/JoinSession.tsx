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
    <div className="join-container">
      <div className="join-card">
        <div className="join-icon">🎤</div>
        <h1>Karaoke Night</h1>
        <p className="join-subtitle">Enter the 4-digit code shown by your DJ to join the session</p>

        <form onSubmit={handleSubmit} className="join-form">
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
            className="code-input"
            autoFocus
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="join-btn" disabled={isLoading || code.length !== 4}>
            {isLoading ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
