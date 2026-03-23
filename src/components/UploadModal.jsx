import { useState, useRef } from "react";
import Modal from "./Modal";

export default function UploadModal({ onUpload, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState([]);
  const inputRef = useRef(null);

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    try {
      setUploading(true);
      setProgress(files.map((f) => ({ name: f.name, done: false })));

      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i]); // upload one by one

        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, done: true } : p
          )
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  return (
    <Modal title="Upload files" onClose={!uploading ? onClose : undefined}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-4 ${
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <p className="text-sm text-gray-600">Drag & drop files here</p>
        <p className="text-xs text-gray-400 mt-1">
          or click to browse — max 500 MB per file
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supports: images, videos, PDFs, Word docs, code files
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Progress List */}
      {progress.length > 0 && (
        <div className="space-y-1 mb-4 max-h-32 overflow-y-auto">
          {progress.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={p.done ? "text-green-500" : "text-gray-400"}>
                {p.done ? "✓" : "○"}
              </span>
              <span className="text-gray-600 truncate">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onClose}
          disabled={uploading}
          className="text-sm text-gray-500 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Close"}
        </button>
      </div>
    </Modal>
  );
}