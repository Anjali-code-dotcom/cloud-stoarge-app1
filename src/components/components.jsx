// ─── src/pages/AuthPage.jsx ───────────────────────────────────────
import { useState } from "react";

export default function AuthPage({ supabase }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const fn = isSignUp ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { error } = await fn.call(supabase.auth, { email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">CloudVault</h1>
        <p className="text-sm text-gray-500 mb-6">{isSignUp ? "Create your account" : "Sign in to your vault"}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" required placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="password" required placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-4">
          {isSignUp ? "Already have an account?" : "No account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 hover:underline">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}


// ─── src/components/Sidebar.jsx ──────────────────────────────────
export function Sidebar({ folders, usage, activeFolder, onFolderClick, onSignOut }) {
  const pct = Math.round((usage.used_gb / usage.limit_gb) * 100);

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-4">
      <div className="px-4 pb-4 border-b border-gray-100">
        <p className="font-semibold text-gray-900">CloudVault</p>
        <p className="text-xs text-gray-400">Personal storage</p>
      </div>

      <nav className="flex-1 px-2 pt-3 space-y-0.5">
        <NavItem label="All Files" active={!activeFolder} onClick={() => onFolderClick(null)} />
        <NavItem label="Recent" onClick={() => onFolderClick(null)} />
        <NavItem label="Shared with me" onClick={() => {}} />

        {folders.length > 0 && (
          <>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1">My Folders</p>
            {folders.map(f => (
              <NavItem key={f.id} label={f.name} active={activeFolder === f.id} onClick={() => onFolderClick(f.id)} />
            ))}
          </>
        )}
      </nav>

      <div className="px-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Storage</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{usage.used_gb} GB of {usage.limit_gb} GB</p>
        <button onClick={onSignOut} className="text-xs text-gray-400 hover:text-gray-600 mt-3 block">Sign out</button>
      </div>
    </aside>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}


// ─── src/components/FileList.jsx ─────────────────────────────────
export function FileList({ files, loading, onDelete, onDownload, onShare }) {
  const extColor = mime => {
    if (mime?.startsWith("image") || mime?.startsWith("video")) return "bg-blue-50 text-blue-700";
    if (mime === "application/pdf") return "bg-orange-50 text-orange-700";
    if (mime?.includes("word") || mime?.includes("presentation")) return "bg-teal-50 text-teal-700";
    return "bg-green-50 text-green-700";
  };
  const extLabel = mime => {
    if (mime?.startsWith("image")) return "IMG";
    if (mime?.startsWith("video")) return "VID";
    if (mime === "application/pdf") return "PDF";
    if (mime?.includes("javascript") || mime?.includes("python") || mime?.includes("sql")) return "CODE";
    return "DOC";
  };
  const fmtSize = bytes => {
    if (bytes > 1e9) return `${(bytes/1e9).toFixed(1)} GB`;
    if (bytes > 1e6) return `${(bytes/1e6).toFixed(1)} MB`;
    return `${Math.round(bytes/1e3)} KB`;
  };

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Loading files...</div>;
  if (!files.length) return <div className="text-sm text-gray-400 py-8 text-center">No files found</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_90px_100px_100px] px-4 py-2 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
        <span>Name</span><span>Size</span><span>Modified</span><span>Actions</span>
      </div>
      {files.map(file => (
        <div key={file.id} className="grid grid-cols-[1fr_90px_100px_100px] px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 items-center transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${extColor(file.mime_type)}`}>
              {extLabel(file.mime_type)}
            </span>
            <span className="text-sm text-gray-800 truncate">{file.name}</span>
          </div>
          <span className="text-xs text-gray-400">{fmtSize(file.size)}</span>
          <span className="text-xs text-gray-400">
            {new Date(file.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <div className="flex gap-1">
            <ActionBtn label="↓" onClick={() => onDownload(file)} />
            <ActionBtn label="Share" onClick={() => onShare(file)} />
            <ActionBtn label="✕" onClick={() => onDelete(file.id)} danger />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
        danger
          ? "border-red-100 text-red-400 hover:bg-red-50"
          : "border-gray-200 text-gray-500 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}


// ─── src/components/FolderGrid.jsx ───────────────────────────────
export function FolderGrid({ folders, onFolderClick }) {
  if (!folders.length) return null;
  const colors = ["#B5D4F4", "#9FE1CB", "#C0DD97", "#FAC775", "#F4C0D1"];
  const darks  = ["#185FA5", "#0F6E56", "#3B6D11", "#854F0B", "#993556"];

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Folders</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {folders.map((f, i) => (
          <button
            key={f.id}
            onClick={() => onFolderClick(f.id)}
            className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-gray-300 transition-colors"
          >
            <div className="w-8 h-6 rounded mb-2" style={{ background: colors[i % colors.length] }} />
            <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
            <p className="text-xs mt-0.5" style={{ color: darks[i % darks.length] }}>
              {f.files?.[0]?.count || 0} files
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}


// ─── src/components/UploadModal.jsx ──────────────────────────────
export function UploadModal({ onUpload, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList) {
    setUploading(true);
    for (const file of fileList) await onUpload(file);
    setUploading(false);
  }

  return (
    <Modal title="Upload files" onClose={onClose}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => document.getElementById("file-input").click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-4 ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <p className="text-sm text-gray-600">Drag & drop files here</p>
        <p className="text-xs text-gray-400 mt-1">or click to browse — max 500 MB per file</p>
        <input id="file-input" type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>
      <div className="flex justify-end">
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          {uploading ? "Uploading..." : "Close"}
        </button>
      </div>
    </Modal>
  );
}


// ─── src/components/ShareModal.jsx ───────────────────────────────
export function ShareModal({ file, token, onClose }) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  async function generateLink() {
    setLoading(true);
    const res = await fetch(`${API}/api/files/${file.id}/share`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expires_in: 86400 }),
    });
    const { share_url } = await res.json();
    setLink(share_url);
    setLoading(false);
  }

  return (
    <Modal title={`Share — ${file.name}`} onClose={onClose}>
      {!link
        ? <button onClick={generateLink} disabled={loading}
            className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Generating..." : "Generate shareable link (24h)"}
          </button>
        : <>
            <p className="text-xs text-gray-400 mb-1">Shareable link (expires in 24h)</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-blue-600 font-mono break-all mb-3">{link}</div>
            <button onClick={() => navigator.clipboard.writeText(link)}
              className="w-full border border-gray-200 text-sm py-2 rounded-lg hover:bg-gray-50">
              Copy link
            </button>
          </>
      }
    </Modal>
  );
}


// ─── src/components/NewFolderModal.jsx ───────────────────────────
export function NewFolderModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  return (
    <Modal title="New folder" onClose={onClose}>
      <input
        autoFocus value={name} onChange={e => setName(e.target.value)}
        placeholder="Folder name"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 mb-3"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={() => name && onCreate(name)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
          Create
        </button>
      </div>
    </Modal>
  );
}


// ─── src/components/Modal.jsx (shared) ───────────────────────────
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
