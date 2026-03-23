import { useState } from "react";
import Modal from "./Modal";

export default function NewFolderModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      await onCreate(trimmed); // important: async support
      setName(""); // reset input
      onClose();   // close modal after success
    } catch (err) {
      console.error("Create folder error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  }

  return (
    <Modal title="New folder" onClose={onClose}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Folder name"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 mb-3"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </Modal>
  );
}