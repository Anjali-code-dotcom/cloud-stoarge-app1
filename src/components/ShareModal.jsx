import { useState } from "react";
import Modal from "./Modal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ShareModal({ file, token, onClose }) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateLink() {
    setLoading(true);
    const res = await fetch(`${API}/api/files/${file.id}/share`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in: 86400 }),
    });
    const { share_url } = await res.json();
    setLink(share_url);
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal title={`Share — ${file.name}`} onClose={onClose}>
      {!link ? (
        <button
          onClick={generateLink}
          disabled={loading}
          className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "Generate shareable link (24h)"}
        </button>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-1">
            Shareable link (expires in 24h)
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-blue-600 font-mono break-all mb-3">
            {link}
          </div>
          <button
            onClick={copyLink}
            className="w-full border border-gray-200 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy link"}
          </button>
        </>
      )}
    </Modal>
  );
}
