export default function Sidebar({ folders, usage, activeFolder, onFolderClick, onSignOut }) {
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
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1">
              My Folders
            </p>
            {folders.map((f) => (
              <NavItem
                key={f.id}
                label={f.name}
                active={activeFolder === f.id}
                onClick={() => onFolderClick(f.id)}
              />
            ))}
          </>
        )}
      </nav>

      <div className="px-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Storage</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {usage.used_gb} GB of {usage.limit_gb} GB
        </p>
        <button
          onClick={onSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 mt-3 block"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
