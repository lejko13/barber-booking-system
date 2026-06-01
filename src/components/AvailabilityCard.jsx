// components/AvailabilityCard.jsx

import { Clock3, Trash2, User } from "lucide-react";

export function AvailabilityCard({ item, onDelete }) {

    console.log(item);
    
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 transition">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Clock3 size={22} />
          </div>

          <div>
            <p className="text-lg font-bold text-slate-900">
             {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
            </p>

            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <User size={15} />
              <span>{item.barber || "Nepriradený holič"}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(item)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}