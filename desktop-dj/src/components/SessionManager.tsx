import { useState } from 'react';
import { Session } from '../types';
import { apiService } from '../api';
import './SessionManager.css';

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
      <div className="session-manager active">
        <div className="session-info">
          <div className="session-code">
            <label>Session Code:</label>
            <div className="code-display">{session.code}</div>
          </div>
          
          {session.dj_name && (
            <div className="dj-name">
              <label>DJ:</label>
              <span>{session.dj_name}</span>
            </div>
          )}

          <div className="session-status">
            <span className={`status-badge ${session.status}`}>
              {session.status === 'active' ? '🟢 Active' : '🔴 Ended'}
            </span>
          </div>
        </div>

        <button
          onClick={handleEndSession}
          disabled={isEnding || session.status === 'ended'}
          className="btn btn-danger"
        >
          {isEnding ? 'Ending...' : 'End Session'}
        </button>
      </div>
    );
  }

  return (
    <div className="session-manager create">
      <h2>Create New Session</h2>
      
      <div className="form-group">
        <label htmlFor="djName">DJ Name (optional):</label>
        <input
          id="djName"
          type="text"
          value={djName}
          onChange={(e) => setDjName(e.target.value)}
          placeholder="Enter your name"
          disabled={isCreating}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleCreateSession}
        disabled={isCreating}
        className="btn btn-primary"
      >
        {isCreating ? 'Creating...' : 'Create Session'}
      </button>

      <div className="info-box">
        <p>
          Singers will join your karaoke session using a 4-digit code.
          Once created, you'll be able to upload your song catalog.
        </p>
      </div>
    </div>
  );
}
