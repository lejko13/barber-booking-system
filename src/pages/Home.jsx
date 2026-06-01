import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastProvider";
import { CustomDatePicker } from "../components/date";
import ServiceSelect from "../components/ServiceSelect";
import TimeSelect from '../components/TimeSelect'

const SERVICES = [
  {
    name: "Strih vlasov",
    label: "✂️ Strih vlasov",
    duration: 15,
  },
  {
    name: "Masáž",
    label: "💆 Masáž",
    duration: 30,
  },
  {
    name: "Konzultácia",
    label: "💬 Konzultácia",
    duration: 45,
  },
];

const BREAK_MINUTES = 5;
const TIME_STEP = 5;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getServiceDuration(serviceName) {
  const service = SERVICES.find((item) => item.name === serviceName);
  return service ? service.duration : 0;
}

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export default function App() {
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    service: "",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const selectedServiceDuration = getServiceDuration(form.service);

  const selectedService = SERVICES.find(
  (service) => service.name === form.service
);

  async function loadAvailability() {
    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .gte("date", getToday())
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      showToast(error.message);
      return;
    }

    setAvailability(data || []);
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .gte("booking_date", getToday());

    if (error) {
      showToast(error.message);
      return;
    }

    setBookings(data || []);
  }

  useEffect(() => {
    loadAvailability();
    loadBookings();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "service" || name === "date" ? { time: "" } : {}),
    }));

    setSuccess("");
  }

  function getAvailableTimes() {
    if (!form.service || !form.date) return [];

    const serviceDuration = getServiceDuration(form.service);

    if (!serviceDuration) return [];

    const dayAvailability = availability.filter(
      (item) => item.date === form.date
    );

    const dayBookings = bookings.filter(
      (booking) =>
        booking.booking_date === form.date &&
        booking.status !== "cancelled"
    );

    const times = [];

    dayAvailability.forEach((item) => {
      const start = timeToMinutes(item.start_time.slice(0, 5));
      const end = timeToMinutes(item.end_time.slice(0, 5));

      for (
        let current = start;
        current + serviceDuration <= end;
        current += TIME_STEP
      ) {
        const newStart = current;
        const newEnd = current + serviceDuration + BREAK_MINUTES;

        const hasConflict = dayBookings.some((booking) => {
          const bookingDuration = getServiceDuration(booking.service);
          const bookingStart = timeToMinutes(booking.booking_time.slice(0, 5));
          const bookingEnd =
            bookingStart + bookingDuration + BREAK_MINUTES;

          return timesOverlap(newStart, newEnd, bookingStart, bookingEnd);
        });

        if (!hasConflict) {
          const time = minutesToTime(current);

          if (!times.includes(time)) {
            times.push(time);
          }
        }
      }
    });

    return times.sort();
  }

  const availableTimes = getAvailableTimes();


  
async function handleSubmit() {
  if (isSubmitting) return;

  if (!form.service) {
    showToast("Prosím vyber službu.");
    return;
  }

  if (!form.date) {
    showToast("Prosím vyber dátum rezervácie.");
    return;
  }

  if (form.date < getToday()) {
    showToast("Nemôžeš vybrať dátum v minulosti.");
    return;
  }

  if (!form.time) {
    showToast("Prosím vyber čas rezervácie.");
    return;
  }

  if (!form.name) {
    showToast("Prosím zadaj meno.");
    return;
  }

  if (!form.phone) {
    showToast("Prosím zadaj telefónne číslo.");
    return;
  }

  if (!form.email) {
    showToast("Prosím zadaj email.");
    return;
  }

  if (!availableTimes.includes(form.time)) {
    showToast("Tento čas už nie je dostupný.");
    await loadBookings();
    return;
  }

  setIsSubmitting(true);

  try {
    const cancelToken = crypto.randomUUID();

    const { error } = await supabase.from("bookings").insert({
      service: form.service,
      booking_date: form.date,
      booking_time: form.time,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      message: form.message,
      status: "pending",
      cancel_token: cancelToken,
    });

    if (error) {
      showToast("Nepodarilo sa odoslať rezerváciu.");
      console.error(error);
      return;
    }

    const cancelLink = `${window.location.origin}/zrusit/${cancelToken}`;

    console.log("Link na zrušenie rezervácie:", cancelLink);

    await supabase.functions.invoke("send-booking-email", {
      body: {
        email: form.email,
        name: form.name,
        service: form.service,
        date: form.date,
        time: form.time,
        cancelLink,
      },
    });

    setSuccess("Rezervácia bola úspešne odoslaná ✅");

    setForm({
      service: "",
      date: "",
      time: "",
      name: "",
      email: "",
      phone: "",
      message: "",
    });

    await loadBookings();
  } finally {
    setIsSubmitting(false);
  }
}

  return (
  <div className="min-h-dvh overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">
      {/* <header className="h-20 bg-white/80 backdrop-blur border-b">
        <div className="h-full max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl">
              ✂️
            </div>

            <div>
              <h1 className="text-2xl font-bold">Rezervačný systém</h1>
              <p className="text-sm text-slate-500">
                Online booking pre služby
              </p>
            </div>
          </div>

          <Link
            to="/admin"
            className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-slate-800 shadow"
          >
            Admin →
          </Link>
        </div>
      </header> */}

<main className="min-h-dvh max-w-7xl mx-auto px-4 py-6 md:px-6 grid lg:grid-cols-[1fr_500px] gap-8 lg:gap-12 items-center">
        <section className=" bg-amber-200 h-fit">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold mb-5">
            ⚡ Rýchla online rezervácia
          </div>
           <Link
            to="/admin"
            className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-slate-800 shadow"
          >
            Admin →
          </Link>

          <h2 className="text-5xl xl:text-6xl font-extrabold leading-tight mb-5">
            Rezervuj si termín jednoducho a rýchlo
          </h2>

          <p className="text-slate-600 text-xl mb-7 max-w-xl">
            Vyber službu, dátum, čas a potvrď rezerváciu za pár sekúnd.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-2xl">
            <div className="bg-white/90 p-5 rounded-3xl shadow">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-bold">Dátum</h3>
              <p className="text-sm text-slate-500">Vyber deň</p>
            </div>

            <div className="bg-white/90 p-5 rounded-3xl shadow">
              <div className="text-3xl mb-2">🕒</div>
              <h3 className="font-bold">Čas</h3>
              <p className="text-sm text-slate-500">Zvoľ termín</p>
            </div>

            <div className="bg-white/90 p-5 rounded-3xl shadow">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-bold">Hotovo</h3>
              <p className="text-sm text-slate-500">Potvrdené</p>
            </div>
          </div>
        </section>

        <section className="bg-white/95 backdrop-blur rounded-[2rem] shadow-2xl p-6 border border-white max-h-[calc(100vh-120px)] ">
          <div className="mb-5">
            <p className="text-blue-600 font-semibold">Nový termín</p>
            <h3 className="text-3xl font-bold">Nová rezervácia</h3>

            
          </div>

          <div className="space-y-3">
          <ServiceSelect
  value={form.service}
  onChange={handleChange}
  services={SERVICES}
/>

          <CustomDatePicker
  value={form.date}
  markedDates={availability.map((item) => item.date)}
  onChange={(date) => {
    

    setForm((prev) => ({
      ...prev,
      date,
      time: "",
    }));
  }}
/>

            {form.service && form.date && availableTimes.length === 0 ? (
  <div className="bg-red-100 text-red-700 p-3 rounded-2xl font-semibold">
    Na tento deň nie je voľný čas pre vybranú službu.
  </div>
) : (
<TimeSelect
  value={form.time}
  onChange={(time) =>
    setForm({
      ...form,
      time,
    })
  }
  selectedServiceDuration={selectedServiceDuration}
  availableTimes={availableTimes}
  bookings={bookings}
  selectedDate={form.date}
  disabled={!form.date || !form.service}
/>
)}

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="👤 Meno"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="📞 Telefónne číslo"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="✉️ Email"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="📝 Správa pre holiča (voliteľné)"
              rows="3"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 resize-none focus:outline-none focus:ring-4 focus:ring-blue-100"
            />

            {success && (
              <div className="bg-green-100 text-green-700 p-3 rounded-2xl font-semibold">
                {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Odosielam..."
                : "Potvrdiť rezerváciu →"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}