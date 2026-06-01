import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

export function TimePicker({
  label = "Čas",
  value,
  onChange,
  from = "08:00",
  to = "20:00",
  step = 30,
}) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
  function handleClickOutside(event) {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target)
    ) {
      setOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

  const times = useMemo(() => {
    const slots = [];
    const [fromH, fromM] = from.split(":").map(Number);
    const [toH, toM] = to.split(":").map(Number);

    let current = fromH * 60 + fromM;
    const end = toH * 60 + toM;

    while (current <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, "0");
      const m = String(current % 60).padStart(2, "0");
      slots.push(`${h}:${m}`);
      current += step;
    }

    return slots;
  }, [from, to, step]);

  return (
<div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-2xl border  border-slate-200 bg-white px-4 py-3 text-left  relative"
      >
      
        <p className="">{value || "Vyber čas"}</p>
<div className="absolute right-[15px] top-1/2 -translate-y-1/2">
  <Clock size={16} />
</div>
       
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-3xl border bg-white p-3 shadow-2xl  border-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <p className="">{label}</p>

          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-hide pr-1">
            {times.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
                className={`w-full rounded-2xl px-4 py-3 text-left  transition ${
                  value === time
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-50 text-slate-900 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}