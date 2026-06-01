import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function CustomDatePicker({ value, onChange, markedDates = [] }) {
  const pickerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(parseLocalDate(value));

  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      setCurrentDate(parseLocalDate(value));
    }
  }, [value]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? parseLocalDate(value) : null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Január",
    "Február",
    "Marec",
    "Apríl",
    "Máj",
    "Jún",
    "Júl",
    "August",
    "September",
    "Október",
    "November",
    "December",
  ];

  const days = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const dates = [];

  for (let i = 0; i < startDay; i++) {
    dates.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push(new Date(year, month, d));
  }

  function selectDate(date) {
    if (date < today) return;
    if (date.getDay() === 0) return;

    onChange(formatDateLocal(date));
    setOpen(false);
  }

  return (
    <div ref={pickerRef} className="relative w-full">
      <button
  type="button"
  onClick={() => setOpen(!open)}
  className="w-full border border-slate-200     cursor-pointer bg-slate-50 rounded-2xl px-4 py-3 text-left flex items-center justify-between"
>
  <span
    className={
      selectedDate
        ? "text-slate-900"
        : "text-slate-400"
    }
  >
    {selectedDate
      ? selectedDate.toLocaleDateString("sk-SK")
      : "Vyber dátum"}
  </span>

  <ChevronDown
    size={20}
    className={`text-slate-400 transition ${
      open ? "rotate-180" : ""
    }`}
  />
</button>


      {open && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="text-2xl"
            >
              ←
            </button>

            <div className="font-bold text-xl">
              {monthNames[month]} {year}
            </div>

            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="text-2xl"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {days.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-bold text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dates.map((date, index) => {
              if (!date) return <div key={index}></div>;

              const dateString = formatDateLocal(date);
              const isPast = date < today;
              const isSunday = date.getDay() === 0;
              const isDisabled = isPast || isSunday;
              const hasMarkedDate = markedDates.includes(dateString);

              const isSelected =
                selectedDate &&
                formatDateLocal(selectedDate) === dateString;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(date)}
                  className={`relative aspect-square rounded-xl font-semibold border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : isDisabled
                      ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                      : hasMarkedDate
                      ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                      : "border-transparent hover:bg-blue-100"
                  }`}
                >
                  {date.getDate()}

                  {hasMarkedDate && !isSelected && !isDisabled && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}