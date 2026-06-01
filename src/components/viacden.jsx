import { Trash2, Clock3, User } from "lucide-react";

export function Viacden({
  item,
  onDelete,
  onOpen,
  isSunday,
}) {
  return (
    <div
      className="
        rounded-[28px]
        border
        border-slate-200
       bg-slate-50
        px-6
        py-5
        transition-all
        hover:border-slate-300
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="
              h-12
              w-12
              rounded-2xl
              bg-slate-100
              flex
              items-center
              justify-center
            "
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Clock3 size={22} />
          </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {item.start_time.slice(0, 5)}
              <span className="mx-2 text-slate-300">—</span>
              {item.end_time.slice(0, 5)}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{item.date}</span>

              <span>•</span>

              <div className="flex items-center gap-1">
                <User size={13} />
                <span>
                  {item.barber || "Nepriradený"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isSunday(item.date)}
            onClick={() => onOpen(item)}
            className="
              rounded-2xl
              border
              border-slate-200
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-700
              hover:bg-slate-50
              disabled:opacity-50
            "
          >
            Otvoriť
          </button>
 <button
          type="button"
          onClick={() => onDelete(item)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
        >
          <Trash2 size={18} />
        </button>
        </div>
      </div>
    </div>
  );
}