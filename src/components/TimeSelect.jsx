import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock3, Check } from "lucide-react";

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export default function TimeSelect({
  value,
  onChange,
  selectedServiceDuration = 30,
  availableTimes = [],
  bookings = [],
  selectedDate,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const bookedTimes = bookings
    .filter(
      (booking) =>
        booking.booking_date === selectedDate &&
        booking.status !== "cancelled"
    )
    .map((booking) => booking.booking_time.slice(0, 5));

  const allTimes = Array.from(new Set([...availableTimes, ...bookedTimes])).sort();

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedLabel = value
    ? `${value} - ${minutesToTime(
        timeToMinutes(value) + selectedServiceDuration
      )}`
    : null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled || !selectedDate}
        onClick={() => setOpen(!open)}
        className="cursor-pointer w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <Clock3 size={18} className="text-slate-400" />

          <span className={selectedLabel ? "text-slate-900" : "text-slate-400"}>
            {selectedLabel || "Vyber čas"}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-xl max-h-72 overflow-y-auto">
          {allTimes.length === 0 && (
            <div className="p-4 text-slate-400">
              Žiadne časy pre tento deň.
            </div>
          )}

          {allTimes.map((time) => {
            const active = value === time;
            const isBooked = bookedTimes.includes(time);
            const isAvailable = availableTimes.includes(time);

            return (
              <button
                key={time}
                type="button"
                disabled={isBooked || !isAvailable}
                onClick={() => {
                  if (isBooked || !isAvailable) return;

                  onChange(time);
                  setOpen(false);
                }}
                className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between transition ${
                  isBooked
                    ? "bg-red-50 text-red-400 cursor-not-allowed opacity-70"
                    : !isAvailable
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-70"
                    : active
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold">{time}</p>

                  <p
                    className={`text-sm ${
                      isBooked
                        ? "text-red-400"
                        : active
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {isBooked
                      ? "už rezervované"
                      : `do ${minutesToTime(
                          timeToMinutes(time) + selectedServiceDuration
                        )}`}
                  </p>
                </div>

                {active && !isBooked && <Check size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}