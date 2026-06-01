import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  Scissors,
} from "lucide-react";

export default function ServiceSelect({ value, onChange, services }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedService = services.find((s) => s.name === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectService(service) {
    onChange({
      target: {
        name: "service",
        value: service.name,
      },
    });

    setOpen(false);
  }

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-2xl     cursor-pointer border bg-slate-50 border-slate-200 px-3 py-3 text-left flex items-center justify-between"
      >
        <div className="    cursor-pointer">
  {!selectedService ? (
    <p className="text-slate-400">
      Vyber službu
    </p>
  ) : (
    <>
      <p className="font-bold text-slate-900 cursor-pointer">
        {selectedService.label}
      </p>
{/* 
      <p className="text-sm text-slate-500">
        {selectedService.duration} minút
      </p> */}
    </>
  )}
</div>

        <ChevronDown
          size={20}
          className={`text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full  rounded-3xl border border-slate-200 bg-white p-2 shadow-xl">
          {services.map((service) => {
            const active = value === service.name;

            return (
              <button
                key={service.name}
                type="button"
                onClick={() => selectService(service)}
                className={`w-full rounded-2xl px-4 py-3 text-left cursor-pointer flex items-center justify-between transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-50 text-slate-900"
                }`}
              >
                <div>
                  <p className="font-bold">{service.label}</p>
                  <p
                    className={`text-sm ${
                      active ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {service.duration} minút
                  </p>
                </div>

                {active && <Check size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}