import { useState, useEffect } from "react";
import { SessionManager } from "./components/SessionManager";
import { MusicLibrary } from "./components/MusicLibrary";
import { QueueDisplay } from "./components/QueueDisplay";
import { wsService } from "./websocket";
import { Session } from "./types";

const tabBase =
  "px-4 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer transition-all";
const tabActive = "bg-[#7c3aed] border-[#7c3aed] text-white";
const tabInactive =
  "border-gray-300 bg-transparent text-gray-600 hover:border-[#7c3aed] hover:text-[#7c3aed]";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "settings" | "library">(
    "queue",
  );

  // Setup WebSocket event handlers
  useEffect(() => {
    wsService.onSessionEnded(() => {
      handleSessionEnded();
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleSessionCreated = async (sessionData: Session) => {
    setSession(sessionData);
    wsService.connect(sessionData.id);
  };

  const handleSessionEnded = () => {
    wsService.disconnect();
    setSession(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-800 m-0">
            🎤 Karaoke Desktop DJ
          </h1>
          <div className="flex gap-2">
            <button
              className={`${tabBase} ${activeTab === "queue" ? tabActive : tabInactive}`}
              onClick={() => setActiveTab("queue")}
            >
              Queue
            </button>
            <button
              className={`${tabBase} ${activeTab === "library" ? tabActive : tabInactive}`}
              onClick={() => setActiveTab("library")}
            >
              🎵 Library
            </button>
            <button
              className={`${tabBase} ${activeTab === "settings" ? tabActive : tabInactive}`}
              onClick={() => setActiveTab("settings")}
            >
              ⚙ Settings
            </button>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {session.dj_name && (
                  <span className="text-sm text-gray-500">
                    DJ:{" "}
                    <span className="font-semibold text-gray-700">
                      {session.dj_name}
                    </span>
                  </span>
                )}
                <span className="px-3 py-1.5 rounded bg-[#7c3aed] text-white font-mono font-bold text-base tracking-widest">
                  {session.code}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">
                No active session
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "queue" ? (
          <div className="max-w-7xl mx-auto">
            {session ? (
              <QueueDisplay sessionId={session.id} />
            ) : (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 text-sm shadow-lg">
                No active session. Go to{" "}
                <button
                  className="bg-transparent border-0 text-[#7c3aed] font-semibold cursor-pointer underline p-0 text-sm"
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>{" "}
                to create one.
              </div>
            )}
          </div>
        ) : activeTab === "library" ? (
          <div className="max-w-7xl mx-auto">
            {session ? (
              <MusicLibrary sessionId={session.id} />
            ) : (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 text-sm shadow-lg">
                No active session. Go to{" "}
                <button
                  className="bg-transparent border-0 text-[#7c3aed] font-semibold cursor-pointer underline p-0 text-sm"
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>{" "}
                to create one.
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <SessionManager
              session={session}
              onSessionCreated={handleSessionCreated}
              onSessionEnded={handleSessionEnded}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
