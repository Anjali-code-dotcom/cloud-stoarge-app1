export default function FileList({ files, loading, onDelete, onDownload, onShare }) {
  const extColor = (mime) => {
    if (mime?.startsWith("image") || mime?.startsWith("video"))
      return "bg-blue-50 text-blue-700";
    if (mime === "application/pdf") return "bg-orange-50 text-orange-700";
    if (mime?.includes("word") || mime?.includes("presentation"))
      return "bg-teal-50 text-teal-700";
    return "bg-green-50 text-green-700";
  };

  const extLabel = (mime) => {
    if (mime?.startsWith("image")) return "IMG";
    if (mime?.startsWith("video")) return "VID";
    if (mime === "application/pdf") return "PDF";
    if (
      mime?.includes("javascript") ||
      mime?.includes("python") ||
      mime?.includes("sql")
    )
      return "CODE";
    return "DOC";
  };

  const fmtSize = (bytes) => {
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${Math.round(bytes / 1e3)} KB`;
  };

  if (loading)
    return (
      <div className="text-sm text-gray-400 py-8 text-center">
        Loading files...
      </div>
    );

  if (!files.length)
    return (
      <div className="text-sm text-gray-400 py-8 text-center">
        No files found. Upload something to get started!
      </div>
    );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_90px_100px_110px] px-4 py-2 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
        <span>Name</span>
        <span>Size</span>
        <span>Modified</span>
        <span>Actions</span>
      </div>

      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-[1fr_90px_100px_110px] px-4 py-2.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 items-center transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${extColor(file.mime_type)}`}
            >
              {extLabel(file.mime_type)}
            </span>
            <span className="text-sm text-gray-800 truncate">{file.name}</span>
          </div>
          <span className="text-xs text-gray-400">{fmtSize(file.size)}</span>
          <span className="text-xs text-gray-400">
            {new Date(file.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="flex gap-1">
            <ActionBtn label="↓" title="Download" onClick={() => onDownload(file)} />
            <ActionBtn label="Share" onClick={() => onShare(file)} />
            <ActionBtn label="✕" title="Delete" onClick={() => onDelete(file.id)} danger />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ label, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
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
