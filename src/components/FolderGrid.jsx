export default function FolderGrid({ folders = [], onFolderClick }) {
  if (!folders.length) return null;

  const colors = ["#B5D4F4", "#9FE1CB", "#C0DD97", "#FAC775", "#F4C0D1"];
  const darks  = ["#185FA5", "#0F6E56", "#3B6D11", "#854F0B", "#993556"];

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        Folders
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {folders.map((f, i) => (
          <button
            key={f.id}
            onClick={() => onFolderClick?.(f.id)}
            className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div
              className="w-8 h-6 rounded mb-2"
              style={{ background: colors[i % colors.length] }}
            />

            <p className="text-sm font-medium text-gray-800 truncate">
              {f.name}
            </p>

            <p className="text-xs mt-0.5 text-gray-400">
              {f.files?.[0]?.count || 0} files
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}