import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #f0f6ff;
    color: #1a1a2e;
    min-height: 100vh;
  }

  /* ── Auth ── */
  .auth-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f6ff;
  }

  .auth-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 36px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 24px rgba(100,149,237,0.10);
  }

  .auth-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  .auth-logo-icon {
    width: 36px;
    height: 36px;
    background: #bdd7ff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .auth-logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .auth-title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .auth-sub {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 28px;
  }

  .field {
    margin-bottom: 16px;
  }

  .field label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }

  .field input {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    background: #fff;
  }

  .field input:focus {
    border-color: #bdd7ff;
  }

  .btn-primary {
    width: 100%;
    padding: 11px;
    background: #bdd7ff;
    color: #1a1a2e;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 4px;
  }

  .btn-primary:hover { background: #a3c8ff; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .auth-switch {
    text-align: center;
    margin-top: 20px;
    font-size: 13px;
    color: #6b7280;
  }

  .auth-switch button {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    font-weight: 500;
    padding: 0;
  }

  .error-msg {
    background: #fff0f0;
    color: #dc2626;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  /* ── App Shell ── */
  .shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: #fff;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1.5px solid #e8f0fe;
    background: #fff;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    width: 34px;
    height: 34px;
    background: #bdd7ff;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .header-title {
    font-size: 15px;
    font-weight: 600;
  }

  .header-sub {
    font-size: 11px;
    color: #6b7280;
  }

  .btn-logout {
    background: none;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-family: inherit;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-logout:hover { border-color: #bdd7ff; color: #1a1a2e; }

  /* ── Messages ── */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
    scrollbar-gutter: stable;
  }

  .messages-inner {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding : 0 36px;
  }

  .messages::-webkit-scrollbar { width: 10px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: #bdd7ff; border-radius: 10px; }

  /* ── Bubble ── */
  .bubble-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .bubble-row.user { flex-direction: row-reverse; }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
  }

  .avatar.bot { background: #bdd7ff; color: #1a1a2e; }
  .avatar.user { background: #1a1a2e; color: #fff; }

  .bubble {
    max-width: 72%;
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .bubble.bot {
    background: #f0f6ff;
    color: #1a1a2e;
    border-bottom-left-radius: 4px;
  }

  .bubble.user {
    background: #bdd7ff;
    color: #1a1a2e;
    border-bottom-right-radius: 4px;
  }

  /* ── Image preview inside bubble ── */
  .bubble-img {
    max-width: 220px;
    border-radius: 10px;
    margin-bottom: 8px;
    display: block;
  }

  /* ── Report card ── */
  .report-card {
    background: #fff;
    border: 1.5px solid #bdd7ff;
    border-radius: 12px;
    padding: 14px 16px;
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: #374151;
    white-space: pre-wrap;
    text-align: left;

  }

  .report-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .badge.cataract { background: #ffe4e4; color: #dc2626; }
  .badge.normal { background: #d1fae5; color: #059669; }

  /* ── Typing indicator ── */
  .typing {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 12px 16px;
  }

  .dot {
    width: 7px;
    height: 7px;
    background: #bdd7ff;
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }

  /* ── Upload prompt ── */
  .upload-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
    color: #9ca3af;
    font-size: 14px;
    padding: 40px 24px;
    text-align: center;
  }

  .upload-prompt-icon {
    font-size: 40px;
    opacity: 0.5;
  }

  /* ── Input bar ── */
  .input-bar {
    padding: 16px 24px;
    border-top: 1.5px solid #e8f0fe;
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: #fff;
    flex-shrink: 0;
  }

  .input-bar textarea {
    flex: 1;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    min-height: 42px;
    max-height: 120px;
    line-height: 1.5;
    transition: border-color 0.15s;
    background: #fff;
  }

  .input-bar textarea:focus { border-color: #bdd7ff; }
  .input-bar textarea:disabled { background: #f9fafb; color: #9ca3af; }

  .btn-send {
    width: 42px;
    height: 42px;
    background: #bdd7ff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .btn-send:hover { background: #a3c8ff; }
  .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-upload {
    width: 42px;
    height: 42px;
    background: #f0f6ff;
    border: 1.5px solid #bdd7ff;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
    color: #3b82f6;
    font-size: 18px;
  }

  .btn-upload:hover { background: #bdd7ff; }
  .btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }

  .disclaimer {
    text-align: center;
    font-size: 11px;
    color: #9ca3af;
    padding: 6px 24px 14px;
    flex-shrink: 0;
  }

  .main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.session-sidebar {
  width: 280px;
  min-width: 280px;

  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 12px;
  border-right: 1px solid #e8f0fe;

  overflow-y: auto;
  background: #fafcff;

  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #bdd7ff transparent;
}

.session-sidebar::-webkit-scrollbar {
  width: 10px;
}

.session-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.session-sidebar::-webkit-scrollbar-thumb {
  background: #bdd7ff;
  border-radius: 10px;
}

.session-header {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.session-item {
  color: #1a1a2e;
  width: 100%;

  padding: 10px 12px;

  border: 1px solid #e8f0fe;
  border-radius: 10px;

  background: white;
  cursor: pointer;

  text-align: left;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-item:hover {
  background: #f0f6ff;
}

.session-item.active {
  border-color: #bdd7ff;
  background: #f0f6ff;
}

.session-item small {
  color: #6b7280;
}
  
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function saveToken(t) { localStorage.setItem("eyecare_token", t); }
function getToken() { return localStorage.getItem("eyecare_token"); }
function clearToken() { localStorage.removeItem("eyecare_token"); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// ── Auth Screen ───────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const data = await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      saveToken(data.token);
      onAuth(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">👁️</div>
          <span className="auth-logo-text">EyeCare Assistant</span>
        </div>
        <div className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <div className="auth-sub">
          {mode === "login"
            ? "Sign in to continue your screening session."
            : "Get started with free AI-powered eye screening."}
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <div className="auth-switch">
          {mode === "login" ? "No account yet? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message components ────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <div className="bubble-row">
      <div className="avatar bot">👁</div>
      <div className="bubble bot">
        <div className="typing">
          <div className="dot" /><div className="dot" /><div className="dot" />
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`bubble-row ${msg.role}`}>
      <div className={`avatar ${msg.role}`}>{isBot ? "👁" : "U"}</div>
      <div className={`bubble ${msg.role}`}>
        {msg.imageUrl && <img src={msg.imageUrl} alt="uploaded eye" className="bubble-img" />}
        {msg.text}
        {msg.report && (
          <div className="report-card">
            <div className="report-label">Screening Report</div>
            <span className={`badge ${msg.prediction?.toLowerCase().includes("cataract") ? "cataract" : "normal"}`}>
              {msg.prediction} — {msg.confidence}% confidence
            </span>
            <div>{msg.report}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Chat ─────────────────────────────────────────────────────────────────

function ChatScreen({ user, onLogout }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Hi ${user.email.split("@")[0]}! I'm your EyeCare Assistant.\n\nUpload an eye image to begin screening. I'll analyse it and answer any questions you have.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [analysisCtx, setAnalysisCtx] = useState(null); // { analysis_id, prediction, confidence }
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const [activeSession, setActiveSession] = useState(null);

  async function loadLatestSession() {
    try {


        const sessions = await apiFetch("/api/sessions");

        setSessions(sessions);

        if (!sessions.length) return;

        await loadSession(
            sessions[0].session_id
        );

    } catch (err) {
        console.error(err);
    }
}

  async function loadSession(sessionId) {
    try {
        const history = await apiFetch(
            `/api/chat-history/${sessionId}`
        );

        setActiveSession(sessionId);

        setAnalysisCtx({
            session_id: history.session_id,
            prediction: history.prediction,
            confidence: history.confidence,
        });


        const restoredMessages = [
            {
                role: "bot",
                text: "I've analysed your image. Here's the screening report:",
                report: history.report,
                prediction: history.prediction,
                confidence: history.confidence,
                imageUrl: history.image_url,
            },
            ...history.messages.map(msg => ({
                role: msg.role === "assistant" ? "bot" : "user",
                text: msg.content,
            })),
        ];

        setMessages(restoredMessages);

    } catch (err) {
        console.error(err);
    }
  }

  useEffect(() => {
  loadLatestSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function addMessage(msg) {
    setMessages(prev => [...prev, msg]);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const imageUrl = URL.createObjectURL(file);
    addMessage({ role: "user", imageUrl, text: "Here's my eye image." });
    setLoading(true);

    try {
      const form = new FormData();
      form.append("image", file);
      const data = await apiFetch("/api/analyze", { method: "POST", body: form });

      setAnalysisCtx({
        analysis_id: data.analysis_id,
        session_id: data.session_id,
        prediction: data.prediction,
        confidence: data.confidence,
      });

      addMessage({
        role: "bot",
        text: "I've analysed your image. Here's the screening report:",
        report: data.report,
        prediction: data.prediction,
        confidence: data.confidence,
      });

      addMessage({
        role: "bot",
        text: "Feel free to ask me anything about these results — what they mean, what to do next, or anything about eye health.",
      });
    } catch (err) {
      addMessage({ role: "bot", text: `Something went wrong: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    if (!analysisCtx) {
      addMessage({ role: "bot", text: "Please upload an eye image first so I have context to answer your question." });
      return;
    }

    setInput("");
    addMessage({ role: "user", text: question });
    setLoading(true);

    try {
      const data = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, session_id: analysisCtx.session_id}),
      });
      addMessage({ role: "bot", text: data.answer });
    } catch (err) {
      addMessage({ role: "bot", text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleLogout() {
    clearToken();
    onLogout();
  }

  return (
    <div className="shell">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="header-icon">👁️</div>
          <div>
            <div className="header-title">EyeCare Assistant</div>
            <div className="header-sub">AI-powered cataract screening</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Sign out</button>
      </div>

      {/* Messages */}
      <div className="main-content">

          {/* Session Sidebar */}
          <div className="session-sidebar">
          <div className="session-header">
          Previous Sessions
      </div>

      {sessions.map(session => (
      <button
        key={session.session_id}
        className={
          activeSession === session.session_id
            ? "session-item active"
            : "session-item"
        }
        onClick={() => loadSession(session.session_id)}
      >
          <div>
            {session.title || "Untitled Session"}
          </div>
          <small>
          {session.prediction}
        </small>
        </button>
        ))}
        </div>

        {/* Messages */}
        <div className="messages">
          <div className="messages-inner">
          {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
          ))}
          {loading && <TypingBubble />}
          <div ref={bottomRef} />
          </div>

          </div>

        </div>
  
      {/* Disclaimer */}
      <div className="disclaimer">
        For screening and educational purposes only. Always consult an ophthalmologist.
      </div>

      {/* Input bar */}
      <div className="input-bar">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleUpload}
        />
        <button
          className="btn-upload"
          title="Upload eye image"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={analysisCtx ? "Ask about your results…" : "Upload an image to start…"}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading || !analysisCtx}
        />
        <button className="btn-send" onClick={handleSend} disabled={loading || !input.trim() || !analysisCtx}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);

  // Auto-login if token exists
  useEffect(() => {
    const token = getToken();
    if (token) {
      apiFetch("/api/auth/me")
        .then(data => setUser(data.user))
        .catch(() => clearToken());
    }
  }, []);

  return (
    <>
      <style>{styles}</style>
      {user
        ? <ChatScreen user={user} onLogout={() => setUser(null)} />
        : <AuthScreen onAuth={setUser} />
      }
    </>
  );
}