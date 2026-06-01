export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 min-w-[420px]">
      <div className="w-9 h-9 bg-white text-red-500 rounded-full flex items-center justify-center font-bold">
        !
      </div>

      <p className="text-lg font-semibold flex-1">{message}</p>

      <button
        onClick={onClose}
        className="text-3xl leading-none"
      >
        ×
      </button>
    </div>
  );
}