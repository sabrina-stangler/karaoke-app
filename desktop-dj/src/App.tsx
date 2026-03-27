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

  // NEW: DJ Name state + gate
  const [djName, setDjName] = useState<string>("");
  const [tempDjName, setTempDjName] = useState<string>("");

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

  const handleSetDjName = () => {
    if (tempDjName.trim()) {
      setDjName(tempDjName.trim());
    }
  };

  const isLocked = !djName;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* DJ NAME GATE MODAL */}
      {isLocked && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-md text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Set Your DJ Name
            </h2>
            <input
              type="text"
              value={tempDjName}
              onChange={(e) => setTempDjName(e.target.value)}
              placeholder="Enter DJ name..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-[#7c3aed]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSetDjName();
              }}
            />
            <button
              onClick={handleSetDjName}
              className="w-full bg-[#7c3aed] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-800 m-0">
            🎤 Karaoke Desktop DJ
          </h1>
          <div className="flex gap-2">
            <button
              disabled={isLocked}
              className={`${tabBase} ${activeTab === "queue" ? tabActive : tabInactive} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => setActiveTab("queue")}
            >
              Queue
            </button>
            <button
              disabled={isLocked}
              className={`${tabBase} ${activeTab === "library" ? tabActive : tabInactive} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => setActiveTab("library")}
            >
              🎵 Library
            </button>
            <button
              disabled={isLocked}
              className={`${tabBase} ${activeTab === "settings" ? tabActive : tabInactive} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              ⚙ Settings
            </button>
          </div>

          {/* Right-side: DJ name + code (match SessionManager styling) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span className="font-semibold text-gray-700">DJ:</span>
                <span className="font-semibold text-gray-700">
                  {session?.dj_name || djName || ""}
                </span>
              </div>

              {/* Session code box — styled like SessionManager; show NONE when no session */}
              <div
                className={
                  session
                    ? "px-3 py-1.5 rounded bg-[#7c3aed] text-white font-mono font-bold text-base tracking-widest"
                    : "px-3 py-1.5 rounded bg-gray-200 text-gray-600 font-mono font-bold text-base tracking-widest"
                }
              >
                {session ? session.code : "INACTIVE"}
              </div>
            </div>
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
              djName={djName}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
