import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_API_URL

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
  padding: 40px;
}
.landing-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 80px;
}

.hero-section {
  flex: 1;
  max-width: 600px;
}

.hero-logo img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 20px;
}

.hero-section h1 {
  font-size: 52px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1a1a2e;
}

.hero-section p {
  font-size: 18px;
  line-height: 1.8;
  color: #4b5563;
}
.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  width: 420px;
  flex-shrink: 0;
  box-shadow: 0 4px 24px rgba(100,149,237,0.10);
}

  .auth-card input {
  color: #1f2937;
  caret-color: #1f2937;
}

  .auth-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  .auth-logo-icon {
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
.auth-logo-icon img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}
.auth-logo-icon {
  overflow: hidden;
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
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f6ff;
  position: relative;
  overflow: hidden;
}

.auth-wrapper::before {
  content: "";
  position: absolute;
  width: 500px;
  height: 500px;
  background: rgba(189, 215, 255, 0.4);
  border-radius: 50%;
  top: -150px;
  left: -150px;
  filter: blur(40px);
}

.auth-wrapper::after {
  content: "";
  position: absolute;
  width: 400px;
  height: 400px;
  background: rgba(147, 197, 253, 0.3);
  border-radius: 50%;
  bottom: -120px;
  right: -120px;
  filter: blur(40px);
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

  position: relative;
  overflow: hidden;
}

  /* ── Header ── */
.header {
  position: relative;

  background: white;
  padding: 24px 32px;
  border-radius: 0 0 40px 40px;
  overflow: hidden;
  z-index: 2;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header,
.main-content {
  position: relative;
  z-index: 1;
}
.header::after {
  content: "";
  position: absolute;

  width: 800px;
  height: 800px;

  border: 40px solid #bdd7ff;
  border-radius: 50%;

  top: -699px;
  right: -120px;

  pointer-events: none;
  z-index: 0;
}
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
  width: 48px;
  height: 48px;

  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  background: transparent;
}
.header-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
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
  background: #d9f99d;
  color: #365314;

  border: none;
  border-radius: 10px;

  padding: 10px 18px;
  font-weight: 600;

  cursor: pointer;
  position: relative;
  z-index: 10;

}
.hero-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.hero-logo img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.hero-header h1 {
  margin: 0;
  font-size: 42px;
  color: #1a1a2e;
}

.hero-header h3 {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 500;
  color: #64748b;
}
.hero-section h4 {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}


.theme-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: #f3f4f6;
}

.hero-section p {
  font-size: 17px;
  line-height: 1.8;
  color: #4b5563;
}

  .btn-logout:hover {
  background: #fca5a5;
  border-color: #fca5a5;
  color: #7f1d1d;
}

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
  padding : 0 32px;
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
  .image-preview-card {
  position: relative;
  width: auto;
  max-width: 320px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

  .preview-image {
   max-width: 320px;
   max-height: 320px;
   width: auto;
   height: auto;
   object-fit: contain;
   border-radius: 16px;
   border: 2px solid #bdd7ff;
   background: #f0f6ff;
  }

  .remove-preview-btn {
   position: absolute;
   top: -8px;
   right: -8px;
   width: 28px;
   height: 28px;
   border: none;
   border-radius: 50%;
   background: white;
   box-shadow: 0 2px 8px rgba(0,0,0,.2);
   cursor: pointer;
   font-size: 16px;
   color: #1a1a2e;
   display: flex;
   align-items: center;
   justify-content: center;
   line-height: 1;
   padding: 0;
  }

  .remove-preview-btn:hover {
   background: #fff0f0;
   color: #dc2626;
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
    padding-top: 20vh;
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
    color: #1f2937;
    caret-color: #1f2937;
  }

  .input-bar textarea:focus { border-color: #bdd7ff; }
  .input-bar textarea:disabled { background: #f9fafb; color: #9ca3af; }

  .btn-send {
    width: 42px;
    height: 42px;
    background:#bef264 ;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .btn-send:hover { background: #d9f99d; }
  .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }


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
  scrollbar-color: #fff transparent;
}

.session-sidebar::-webkit-scrollbar {
  width: 10px;
}

.session-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.session-sidebar::-webkit-scrollbar-thumb {
  background: #fffs;
  border-radius: 10px;
}
.session-sidebar {
  background: #bdd7ff;
  border-right: none;
}

.session-header {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.new-chat-btn {
 width: 100%;
  padding: 10px 12px;

  border: none;
  border-radius: 10px;

  background: #bdd7ff;
  color: #000;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
  transition: all 0.2s ease;
}

.new-chat-btn:hover {

  background:#d9f99d;
}
.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e8f0fe;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  outline: none;
  background: white;
  color: #1f2937;
  caret-color: #1f2937;
}

.search-input::placeholder {
  color: #6b7280;
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

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

  /* ── Preview Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(26, 26, 46, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .modal-card {
    background: #fff;
    border-radius: 20px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.25);
    max-width: 320px;
    width: 100%;
  }

  .modal-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    text-align: center;
  }

  .modal-card .btn-primary {
    width: 100%;
  }


`;

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 8;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

function validateImageFile(file) {

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WebP images are supported.";
  }

  if (
    file.size >
    MAX_FILE_SIZE_MB * 1024 * 1024
  ) {
    return `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
  }

  return null;
}

function saveToken(t) { localStorage.setItem("eyecare_token", t); }
function getToken() { return localStorage.getItem("eyecare_token"); }
function clearToken() { localStorage.removeItem("eyecare_token"); }

async function apiFetch(path, options = {}) {
  const token = getToken();

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (networkErr) {
    console.error("Network error calling", path, networkErr);
    throw new Error(`Network error: could not reach ${API}${path}. Is the API running and is VITE_API_URL correct?`);
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    console.error("Non-JSON response from", path, "status:", res.status);
    throw new Error(`Server returned an unexpected response (status ${res.status}) for ${path}.`);
  }

  if (!res.ok) throw new Error(data.error || `Request failed (status ${res.status}).`);
  return data;
}

async function fetchProtectedImage(url) {
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function AuthScreen({ onAuth }) {
const [mode, setMode] = useState("login");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

async function handleSubmit() {
setError("");


if (!email || !password) {
  setError("Email and password are required.");
  return;
}

setLoading(true);

try {
  const data = await apiFetch(`/api/auth/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
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
if (e.key === "Enter") {
handleSubmit();
}
}

return ( <div className="auth-wrapper"> <div className="landing-container">
    <div className="hero-section">
  <div className="hero-header">
    <div className="hero-logo">
      <img src="/eyelogo.jpeg" alt="Eye Logo" />
    </div>

    <div>
      <h1>EyeScan Assistant</h1>
      <h3>Empowering Accessible Eye Care</h3>
    </div>
  </div>
<h4>About</h4>
  <p>
    EyeScan Assistant is dedicated to improving accessibility to eye
    health awareness and screening support for individuals across
    diverse communities. By promoting early awareness, preventive
    care, and informed decision-making, the platform aims to support
    better vision health outcomes and encourage timely professional
    consultation.
  </p>

</div>

    <div className="auth-card">

      <div className="auth-logo">
        <div className="auth-logo-icon">
          <img
            src="/eyelogo.jpeg"
            alt="Eye Logo"
          />
        </div>

        <span className="auth-logo-text">
          EyeScan Assistant
        </span>
      </div>

      <div className="auth-title">
        {mode === "login"
          ? "Welcome back"
          : "Create account"}
      </div>

      <div className="auth-sub">
        {mode === "login"
          ? "Sign in to continue your screening session."
          : "Get started with free AI-powered eye screening."}
      </div>
      <div className="arc-1"></div>
      <div className="arc-2"></div>

      {error && (
        <div className="error-msg">
          {error}
        </div>
      )}

      <div className="field">
        <label>Email</label>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          onKeyDown={handleKey}
        />
      </div>

      <div className="field">
        <label>Password</label>

        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          onKeyDown={handleKey}
        />
      </div>

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "Please wait…"
          : mode === "login"
          ? "Sign in"
          : "Create account"}
      </button>

      <div className="auth-switch">
        {mode === "login"
          ? "No account yet? "
          : "Already have an account? "}

        <button
          onClick={() => {
            setMode(
              mode === "login"
                ? "register"
                : "login"
            );
            setError("");
          }}
        >
          {mode === "login"
            ? "Register"
            : "Sign in"}
        </button>
      </div>

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
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (!msg.imageUrl) return;

    if (msg.imageUrl.startsWith("blob:")) {
      setImgSrc(msg.imageUrl);
      return;
    }

    let cancelled = false;
    let objectUrl = null;

    fetchProtectedImage(msg.imageUrl).then(src => {
      if (cancelled) {
        // Component unmounted before fetch resolved — clean up immediately
        if (src) URL.revokeObjectURL(src);
        return;
      }
      objectUrl = src;
      if (src) setImgSrc(src);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [msg.imageUrl]);

  return (
    <div className={`bubble-row ${msg.role}`}>
      <div className={`avatar ${msg.role}`}>{isBot ? "👁" : "U"}</div>
      <div className={`bubble ${msg.role}`}>
        {imgSrc && <img src={imgSrc} alt="uploaded eye" className="bubble-img" />}
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [analysisCtx, setAnalysisCtx] = useState(null); // { analysis_id, prediction, confidence }
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [flowStep, setFlowStep] = useState("upload");
  const [patientName, setPatientName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  async function loadSession(sessionId) {
  try {
    setMessages([]);        // clear immediately
    setAnalysisCtx(null);  // clear image context
    setFlowStep("upload"); // force upload state while loading

    const history = await apiFetch(`/api/chat-history/${sessionId}`);

    setActiveSession(sessionId);
    setAnalysisCtx({
      session_id: history.session_id,
      prediction: history.prediction,
      confidence: history.confidence,
    });

    // Simple 1:1 mapping — no manual prepend, no imageUrl injection
    const restoredMessages = history.messages.map((msg, index) => ({
      role: msg.role === "assistant" ? "bot" : "user",
      text: msg.content,
      // attach image only to first assistant message (the greeting stored in DB)
      ...(index === 0 && msg.role === "assistant" && history.image_url
        ? { imageUrl: history.image_url }
        : {}),
    }));

    setMessages(restoredMessages);

    if (!history.patient_name) {
      setFlowStep("name");
      return;
    }
    if (!history.language) {
      setFlowStep("language");
      return;
    }
    if (!history.assessment_completed) {
      setAssessmentMode(true);
      setFlowStep("assessment");
      return;
    }

    setAssessmentMode(false);
    setFlowStep("chat");

  } catch (err) {
    console.error(err);
  }
}
    async function deleteSession(sessionId) {
  try {
    await apiFetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    });

    setSessions(prev =>
      prev.filter(
        s => s.session_id !== sessionId
      )
    );

    if (activeSession === sessionId) {
  setActiveSession(null);
  setAnalysisCtx(null);
  setAssessmentMode(false);
  setFlowStep("upload");
  setPatientName("");
  setSelectedLanguage("");
}

  } catch (err) {
    alert(err.message);
  }
}
function createNewSession() {
  setActiveSession(null);
  setAnalysisCtx(null);
  setAssessmentMode(false);
  setFlowStep("upload");
  setPatientName("");
  setSelectedLanguage("");
  setInput("");
  setMessages([]);
  setSearchTerm("");
}
useEffect(() => {
  apiFetch("/api/sessions")
    .then(data => setSessions(data))
    .catch(err => console.error(err));
}, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function addMessage(msg) {
    setMessages(prev => [...prev, msg]);
  }
  async function handleAssessmentAnswer(answer) {

  addMessage({
    role: "user",
    text: answer
  });

  setLoading(true);

  try {

    const data = await apiFetch(
      "/api/assessment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: analysisCtx.session_id,
          answer
        })
      }
    );

    if (data.completed) {

      setAssessmentMode(false);
      setFlowStep("chat");

      addMessage({
        role: "bot",
        text: "Assessment completed."
      });

      addMessage({
        role: "bot",
        report: data.report,
        prediction: analysisCtx.prediction,
        confidence: analysisCtx.confidence
      });

      addMessage({
        role: "bot",
        text: "You may now ask questions about cataract, eye health, symptoms, or your report."
      });

    } else {

      addMessage({
        role: "bot",
        text: data.question
      });

    }

  } catch (err) {

    addMessage({
      role: "bot",
      text: `Error: ${err.message}`
    });

  } finally {

    setLoading(false);

  }
}

  function handleAnalyze() {
  if (!selectedFile) return;

  const fileToAnalyze = selectedFile;
  const imageToShow = previewImage;

  // Leave the modal and jump straight to the chat screen immediately.
  setShowPreviewModal(false);
  setAnalyzing(true);
  setLoading(true);

  addMessage({
    role: "user",
    imageUrl: imageToShow,
    text: "Here's my eye image."
  });

  addMessage({
    role: "bot",
    text: "Analyzing your eye image…"
  });

  setSelectedFile(null);
  setPreviewImage(null);

  // Run the actual API call in the background — UI is already on chat screen.
  (async () => {
    try {
      const form = new FormData();
      form.append("image", fileToAnalyze);

      const data = await apiFetch(
        "/api/analyze",
        {
          method: "POST",
          body: form,
        }
      );

      setAnalysisCtx({
        analysis_id: data.analysis_id,
        session_id: data.session_id,
        prediction: data.prediction,
        confidence: data.confidence,
      });

      addMessage({
        role: "bot",
        text: "Please enter patient name."
      });

      setFlowStep("name");

    } catch (err) {
      console.error("handleAnalyze failed:", err);
      addMessage({
        role: "bot",
        text: `Something went wrong analyzing your image: ${err.message}`
      });
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  })();
}
 function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const validationError =
    validateImageFile(file);

  if (validationError) {
    addMessage({
      role: "bot",
      text: validationError
    });
    return;
  }

  setSelectedFile(file);
  setPreviewImage(URL.createObjectURL(file)
  );
  setShowPreviewModal(true);


  e.target.value = "";
}
 function removeSelectedImage() {
  if (previewImage) {
    URL.revokeObjectURL(previewImage);
  }

  setSelectedFile(null);
  setPreviewImage(null);
  setShowPreviewModal(false);

  if (fileRef.current) {
    fileRef.current.value = "";
  }
}

  async function handleSend() {
    console.log("flowStep =", flowStep);
    const question = input.trim();
    if (!question || loading) return;
    if (!analysisCtx) {
      addMessage({ role: "bot", text: "Please upload an eye image first so I have context to answer your question." });
      return;
    }
    if (flowStep === "name") {

  setPatientName(question);

await apiFetch("/api/patient-name", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: analysisCtx.session_id,
    patient_name: question,
  }),
});

const updatedSessions = await apiFetch("/api/sessions");
setSessions(updatedSessions);

  addMessage({
    role: "user",
    text: question
  });

  addMessage({
    role: "bot",
    text: "Please enter your preferred language."
  });

  setInput("");
  setFlowStep("language");

  return;
}

    if (flowStep === "language") {

  setSelectedLanguage(question);

  addMessage({
    role: "user",
    text: question
  });

  setInput("");
  setLoading(true);

  await apiFetch("/api/language", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: analysisCtx.session_id,
    language: question,
  }),
});

  try {

    const assessment = await apiFetch(
      `/api/assessment/${analysisCtx.session_id}`
    );

    setAssessmentMode(true);
    setFlowStep("assessment");

    addMessage({
      role: "bot",
      text: assessment.question
    });

  } catch (err) {

    addMessage({
      role: "bot",
      text: `Error: ${err.message}`
    });

  } finally {

    setLoading(false);

  }

  return;
}
if (flowStep === "assessment") {

  addMessage({
    role: "user",
    text: question
  });

  setInput("");
  setLoading(true);

  try {

    const data = await apiFetch(
      "/api/assessment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: analysisCtx.session_id,
          answer: question
        })
      }
    );

    if (data.completed) {

      setAssessmentMode(false);
      setFlowStep("chat");

      addMessage({
        role: "bot",
        text: "Assessment completed."
      });

      addMessage({
        role: "bot",
        report: data.report,
        prediction: analysisCtx.prediction,
        confidence: analysisCtx.confidence
      });

      addMessage({
        role: "bot",
        text: "You may now ask questions about cataract, eye health, symptoms, or your report."
      });

    } else {

      addMessage({
        role: "bot",
        text: data.question
      });

    }

  } catch (err) {

    addMessage({
      role: "bot",
      text: `Error: ${err.message}`
    });

  } finally {

    setLoading(false);

  }

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
const filteredSessions = [...sessions]
  .sort(
    (a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
  )
  .filter(session =>
    (session.title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
  <div className="shell">

    {showPreviewModal && selectedFile && (
      <div className="modal-overlay">
        <div className="modal-card">
          <h3>Preview your eye image</h3>

          <div className="image-preview-card">
            <img
              src={previewImage}
              className="preview-image"
              alt="preview"
            />

            <button
              className="remove-preview-btn"
              onClick={removeSelectedImage}
            >
              ✕
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Analyze Image"}
          </button>
        </div>
      </div>
    )}

    {/* Header */}
    <div className="header">
      <div className="header-left">

        <div className="header-icon">
          <img
            src="/eyelogo.jpeg"
            alt="Eye Logo"
          />
        </div>

        <div>
          <div className="header-title">
            EyeScan Assistant
          </div>

          <div className="header-sub">
            Empowering Accessible Eye Care
          </div>
        </div>

      </div>
      <button
        className="btn-logout"
        onClick={handleLogout}
      >
        Sign out
      </button>
    </div>


      <div className="main-content">

          {/* Session Sidebar */}
          <div className="session-sidebar">

          <button
            className="new-chat-btn"
            onClick={createNewSession}
          >
            + New Assessment
          </button>
          <input
          type="text"
          placeholder="🔍 Search patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="session-header">
            Recents
          </div>

      {filteredSessions.map(session => (
      <div
  key={session.session_id}
  className={
    activeSession === session.session_id
      ? "session-item active"
      : "session-item"
  }
>

  <div
    onClick={() => loadSession(session.session_id)}
    style={{
      cursor: "pointer"
    }}
  >
    <div>
      {session.title || "New Assessment"}
    </div>

    <small>
      {session.prediction}
    </small>
  </div>

  <button
    onClick={(e) => {
    e.stopPropagation();

    if (window.confirm("Delete this session?")) {
      deleteSession(session.session_id);
    }
  }}
    style={{
  marginTop: "4px",
  padding: "2px 6px",
  border: "none",
  background: "#fff0f0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  color: "#dc2626",
  alignSelf: "flex-end"
}}
  >
    🗑 Delete
  </button>

</div>
        ))}
        </div>

        {/* Messages */}
        <div className="chat-area">
        <div className="messages">
          <div className="messages-inner">
          {flowStep === "upload" && !analysisCtx && messages.length === 0 ? (
            <div className="upload-prompt">
              <div className="upload-prompt-icon">👁️</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#1a1a2e" }}>
                Hi there! I'm your EyeScan Assistant.
              </div>
              <div style={{ color: "#6b7280", fontSize: "13px" }}>
                Upload an eye image to begin cataract screening.
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={fileRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <button
                className="btn-primary"
                onClick={() => fileRef.current?.click()}
              >
                Upload Eye Image
              </button>
            </div>
          ) : (
            <>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && <TypingBubble />}
            <div ref={bottomRef} />
          </>
          )}
          </div>

          </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        For screening and educational purposes only. Always consult an ophthalmologist.
      </div>

      {/* Input bar */}
{analysisCtx && (
  <div className="input-bar">
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      ref={fileRef}
      style={{ display: "none" }}
      onChange={handleFileSelect}
    />

    {flowStep === "assessment" ? (
      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        <button
          className="btn-primary"
          onClick={() => handleAssessmentAnswer("Yes")}
          disabled={loading}
        >
          Yes
        </button>
        <button
          className="btn-primary"
          onClick={() => handleAssessmentAnswer("No")}
          disabled={loading}
        >
          No
        </button>
      </div>
    ) : (
      <>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button

          className="btn-send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
      ➤
    </button>
      </>
    )}
  </div>
)}


</div>

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