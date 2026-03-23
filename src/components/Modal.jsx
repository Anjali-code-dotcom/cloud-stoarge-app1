import { useEffect } from "react";

export default function Modal({ title, onClose, children }) {
  // ESC key close
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleEsc);

    // prevent background scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose} // click outside close
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm shadow-lg animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()} // prevent inside click close
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}