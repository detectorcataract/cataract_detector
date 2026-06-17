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
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    box-shadow: 0 0 40px rgba(100,149,237,0.08);
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

  /* ── Step indicator ── */
  .step-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 24px 0 0;
  }

  .step-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: background 0.2s;
  }

  .step-dot.active { background: #3b82f6; }
  .step-dot.done { background: #bdd7ff; }

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
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: #bdd7ff; border-radius: 4px; }

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

  /* ── Assessment progress bar ── */
  .assessment-bar-wrap {
    padding: 10px 24px 0;
    flex-shrink: 0;
  }

  .assessment-bar-label {
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 5px;
  }

  .assessment-bar-track {
    height: 4px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .assessment-bar-fill {
    height: 100%;
    background: #3b82f6;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  /* ── Y/N quick reply buttons ── */
  .quick-replies {
    display: flex;
    gap: 8px;
    padding: 10px 24px 0;
    flex-shrink: 0;
  }

  .quick-reply-btn {
    padding: 7px 22px;
    border-radius: 20px;
    border: 1.5px solid #bdd7ff;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    color: #1a1a2e;
    transition: background 0.15s, border-color 0.15s;
  }

  .quick-reply-btn:hover { background: #bdd7ff; }
  .quick-reply-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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
  const [mode, setMode] = useState("login");
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

// ── Step dots ─────────────────────────────────────────────────────────────────

const STEPS = ["upload", "ask_name", "ask_language", "assessment", "chat"];

function StepDots({ flowStep }) {
  const current = STEPS.indexOf(flowStep);
  return (
    <div className="step-indicator">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`step-dot ${i < current ? "done" : i === current ? "active" : ""}`}
        />
      ))}
    </div>
  );
}

// ── Main Chat ─────────────────────────────────────────────────────────────────

function ChatScreen({ user, onLogout }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Upload an eye image to begin your cataract screening.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Workflow state
  const [flowStep, setFlowStep] = useState("upload"); // upload | ask_name | ask_language | assessment | chat
  const [sessionCtx, setSessionCtx] = useState(null); // { session_id, prediction, confidence }
  const [assessmentProgress, setAssessmentProgress] = useState({ current: 0, total: 5 });

  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function addMessage(msg) {
    setMessages(prev => [...prev, msg]);
  }

  // ── Upload handler ──────────────────────────────────────────────────────────
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

      setSessionCtx({
        session_id: data.session_id,
        prediction: data.prediction,
        confidence: data.confidence,
      });

      addMessage({ role: "bot", text: "Image analysed! What is your name?" });
      setFlowStep("ask_name");
    } catch (err) {
      addMessage({ role: "bot", text: `Something went wrong: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch first assessment question ────────────────────────────────────────
  async function startAssessment(session_id) {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/assessment/${session_id}`);
      if (data.completed) {
        addMessage({ role: "bot", text: "No questions needed. Generating your report…" });
      } else {
        setAssessmentProgress({ current: data.question_number, total: data.total_questions });
        addMessage({
          role: "bot",
          text: `Question ${data.question_number}/${data.total_questions}: ${data.question}`,
        });
        setFlowStep("assessment");
      }
    } catch (err) {
      addMessage({ role: "bot", text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  // ── Submit assessment answer (Y/N) ─────────────────────────────────────────
  async function submitAssessmentAnswer(answer) {
    if (loading) return;
    addMessage({ role: "user", text: answer });
    setLoading(true);
    try {
      const data = await apiFetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionCtx.session_id, answer }),
      });

      if (data.completed) {
        addMessage({
          role: "bot",
          text: "Assessment complete! Here's your screening report:",
          report: data.report,
          prediction: sessionCtx.prediction,
          confidence: sessionCtx.confidence,
        });
        addMessage({
          role: "bot",
          text: "You can now ask me anything about your results — what they mean, what to do next, or anything about eye health.",
        });
        setFlowStep("chat");
      } else {
        setAssessmentProgress({ current: data.question_number, total: data.total_questions });
        addMessage({
          role: "bot",
          text: `Question ${data.question_number}/${data.total_questions}: ${data.question}`,
        });
      }
    } catch (err) {
      addMessage({ role: "bot", text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  // ── Main text submit — routes by flowStep ──────────────────────────────────
  async function handleTextSubmit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // ── Name step ──
    if (flowStep === "ask_name") {
      addMessage({ role: "user", text });
      addMessage({
        role: "bot",
        text: "Which language would you prefer for the report?\n(e.g. English, Hindi, Marathi, Tamil, Telugu)",
      });
      setFlowStep("ask_language");
      return;
    }

    // ── Language step ──
    if (flowStep === "ask_language") {
      addMessage({ role: "user", text });
      setLoading(true);
      try {
        // Update language on backend
        await apiFetch("/api/session/language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionCtx.session_id, language: text }),
        });
        addMessage({ role: "bot", text: `Got it! I'll use ${text}. Starting your symptom assessment now…` });
        setFlowStep("assessment"); // temp, startAssessment will confirm
        await startAssessment(sessionCtx.session_id);
      } catch (err) {
        addMessage({ role: "bot", text: `Error: ${err.message}` });
        setLoading(false);
      }
      return;
    }

    // ── Assessment step — only Y/N via buttons, but allow typing too ──
    if (flowStep === "assessment") {
      const upper = text.toUpperCase();
      if (upper !== "Y" && upper !== "N") {
        addMessage({ role: "user", text });
        addMessage({ role: "bot", text: "Please reply with Y (Yes) or N (No), or use the buttons below." });
        return;
      }
      await submitAssessmentAnswer(upper);
      return;
    }

    // ── Chat step ──
    if (flowStep === "chat") {
      addMessage({ role: "user", text });
      setLoading(true);
      try {
        const data = await apiFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, session_id: sessionCtx.session_id }),
        });
        addMessage({ role: "bot", text: data.answer });
      } catch (err) {
        addMessage({ role: "bot", text: `Error: ${err.message}` });
      } finally {
        setLoading(false);
      }
      return;
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }

  function handleLogout() {
    clearToken();
    onLogout();
  }

  const isInputDisabled = loading || flowStep === "upload";
  const isSendDisabled = loading || !input.trim() || flowStep === "upload";
  const isUploadDisabled = loading || flowStep !== "upload";
  const showQuickReplies = flowStep === "assessment" && !loading;
  const showProgressBar = flowStep === "assessment";

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StepDots flowStep={flowStep} />
          <button className="btn-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {/* Assessment progress bar */}
      {showProgressBar && (
        <div className="assessment-bar-wrap">
          <div className="assessment-bar-label">
            Symptom assessment — question {assessmentProgress.current} of {assessmentProgress.total}
          </div>
          <div className="assessment-bar-track">
            <div
              className="assessment-bar-fill"
              style={{ width: `${(assessmentProgress.current / assessmentProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Y / N quick reply buttons during assessment */}
      {showQuickReplies && (
        <div className="quick-replies">
          <button
            className="quick-reply-btn"
            onClick={() => submitAssessmentAnswer("Y")}
            disabled={loading}
          >
            Yes
          </button>
          <button
            className="quick-reply-btn"
            onClick={() => submitAssessmentAnswer("N")}
            disabled={loading}
          >
            No
          </button>
        </div>
      )}

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
          disabled={isUploadDisabled}
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={
            flowStep === "upload" ? "Upload an image to start…"
            : flowStep === "ask_name" ? "Enter your name…"
            : flowStep === "ask_language" ? "Enter preferred language…"
            : flowStep === "assessment" ? "Type Y or N, or use the buttons above…"
            : "Ask about your results…"
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={isInputDisabled}
        />
        <button
          className="btn-send"
          onClick={handleTextSubmit}
          disabled={isSendDisabled}
        >
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