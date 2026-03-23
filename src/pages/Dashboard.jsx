import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import FileList from "../components/FileList";
import FolderGrid from "../components/FolderGrid";
import UploadModal from "../components/UploadModal";
import ShareModal from "../components/ShareModal";
import NewFolderModal from "../components/NewFolderModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard({ session, supabase }) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [usage, setUsage] = useState({ used_gb: 0, limit_gb: 10 });
  const [activeFolder, setActiveFolder] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = session?.access_token;

  // ✅ Safe headers
  const headers = useMemo(() => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // ✅ Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ✅ Fetch all data
const fetchAll = useCallback(async () => {
  if (!token) return;

  try {
    setLoading(true);

    const params = new URLSearchParams();
    if (activeFolder) params.set("folder_id", activeFolder);
    if (debouncedSearch) params.set("search", debouncedSearch);

    const [filesRes, foldersRes, usageRes] = await Promise.all([
      fetch(`${API}/api/files?${params}`, { headers }),
      fetch(`${API}/api/folders`, { headers }),
      fetch(`${API}/api/usage`, { headers }),
    ]);

    if (!filesRes.ok) throw new Error("Files fetch failed");
    if (!foldersRes.ok) throw new Error("Folders fetch failed");
    if (!usageRes.ok) throw new Error("Usage fetch failed");

    const filesData = await filesRes.json();
    const foldersData = await foldersRes.json();
    const usageData = await usageRes.json();

    setFiles(filesData.files || []);
    setFolders(foldersData.folders || []);
    setUsage(usageData);

  } catch (err) {
    console.error("❌ Fetch error:", err);
  } finally {
    setLoading(false);
  }
}, [activeFolder, debouncedSearch, headers, token]);

useEffect(() => {
  fetchAll();
}, [fetchAll]);

  // ✅ Upload file
  async function uploadFile(file) {
    if (!file || !token) return;

    try {
      const form = new FormData();
      form.append("file", file);

      if (activeFolder) {
        form.append("folder_id", activeFolder);
      }

      const res = await fetch(`${API}/api/files/upload`, {
        method: "POST",
        headers,
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Upload error:", data.error);
        alert(data.error || "Upload failed");
        return;
      }

      fetchAll();

    } catch (err) {
      console.error("❌ Upload crash:", err);
    }
  }

  // ✅ Delete file
  async function deleteFile(id) {
    if (!confirm("Delete this file?")) return;

    try {
      const res = await fetch(`${API}/api/files/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ Delete error:", err);
        return;
      }

      fetchAll();

    } catch (err) {
      console.error("❌ Delete crash:", err);
    }
  }

  // ✅ Download file
  async function downloadFile(file) {
    try {
      const res = await fetch(`${API}/api/files/${file.id}/download`, { headers });

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ Download error:", err);
        return;
      }

      const { url } = await res.json();
      window.open(url, "_blank");

    } catch (err) {
      console.error("❌ Download crash:", err);
    }
  }

  // ✅ Create folder
  async function createFolder(name) {
    try {
      const res = await fetch(`${API}/api/folders`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: activeFolder }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ Folder error:", err);
        return;
      }

      setShowNewFolder(false);
      fetchAll();

    } catch (err) {
      console.error("❌ Folder crash:", err);
    }
  }

  const activeFolderName = folders.find((f) => f.id === activeFolder)?.name;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        folders={folders}
        usage={usage}
        activeFolder={activeFolder}
        onFolderClick={setActiveFolder}
        onSignOut={() => supabase.auth.signOut()}
      />

      <main className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-3 flex items-center gap-3">
          <div className="flex-1">
            <span className="text-gray-400 text-sm">My Files</span>
            {activeFolderName && <> / {activeFolderName}</>}
          </div>

          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 rounded"
          />

          <button onClick={() => setShowNewFolder(true)}>+ Folder</button>
          <button onClick={() => setShowUpload(true)}>Upload</button>
        </div>

        <div className="p-6">
          <FolderGrid folders={folders} onFolderClick={setActiveFolder} />

          <FileList
            files={files}
            loading={loading}
            onDelete={deleteFile}
            onDownload={downloadFile}
            onShare={setShareFile}
          />
        </div>
      </main>

      {showUpload && (
        <UploadModal
          onUpload={uploadFile}
          onClose={() => setShowUpload(false)}
        />
      )}

      {shareFile && (
        <ShareModal
          file={shareFile}
          token={token}
          onClose={() => setShareFile(null)}
        />
      )}

      {showNewFolder && (
        <NewFolderModal
          onCreate={createFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}
    </div>
  );
}