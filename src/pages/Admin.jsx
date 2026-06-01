import { useEffect, useState } from "react";





import { useNavigate } from "react-router-dom";



import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppProvider";
import { useToast } from "../context/ToastProvider";
import { CustomDatePicker } from "../components/date";
import {TimePicker} from '../components/timepicker'
import {AvailabilityCard} from '../components/AvailabilityCard'
 import { Clock3, Trash2 } from "lucide-react";
 import {Viacden} from '../components/viacden'

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function isSunday(dateString) {
  return new Date(dateString).getDay() === 0;
}

function getNext7Days() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    const dateString = date.toISOString().split("T")[0];
    const sunday = date.getDay() === 0;

    return {
      date: dateString,
      label:
        index === 0
          ? "Dnes"
          : date.toLocaleDateString("sk-SK", { weekday: "short" }),
      day: date.getDate(),
      isSunday: sunday,
    };
  });
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function Admin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { bookings, loadBookings } = useApp();

  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [availability, setAvailability] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null);

  function formatShortDate(dateString) {
  const date = new Date(dateString);

  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

  const [availabilityForm, setAvailabilityForm] = useState({
    date: getToday(),
    startTime: "09:00",
    endTime: "17:00",
    barber: "",
  });

  const visibleDays = getNext7Days();
  const visibleDates = visibleDays.map((day) => day.date);

  const visibleBookings = bookings.filter((booking) =>
    visibleDates.includes(booking.booking_date)
  );

  const selectedDayBookings = visibleBookings
    .filter((booking) => booking.booking_date === selectedDate)
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  const futureBookings = bookings
    .filter(
      (booking) => booking.booking_date > visibleDates[visibleDates.length - 1]
    )
    .sort(
      (a, b) =>
        a.booking_date.localeCompare(b.booking_date) ||
        a.booking_time.localeCompare(b.booking_time)
    );

  const visibleAvailability = availability.filter((item) =>
    visibleDates.includes(item.date)
  );

  const selectedDayAvailability = visibleAvailability
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));


  const futureAvailability = availability
    .filter((item) => item.date > visibleDates[visibleDates.length - 1])
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.start_time.localeCompare(b.start_time)
    );


  function getBookingsForDate(date) {
    return bookings.filter(
      (booking) =>
        booking.booking_date === date && booking.status !== "cancelled"
    );
  }

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

async function createAvailability() {
  const { date, startTime, endTime, barber } = availabilityForm;

  if (!date || !startTime || !endTime) {
    showToast("Vyber dátum, čas od a čas do.");
    return;
  }

  if (date < getToday()) {
    showToast("Nemôžeš vytvoriť dostupnosť do minulosti.");
    return;
  }

  if (isSunday(date)) {
    showToast("V nedeľu nepracuješ. Dostupnosť sa nedá vytvoriť.");
    return;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    showToast("Čas DO musí byť neskôr ako čas OD.");
    return;
  }

  if (endMinutes - startMinutes < 15) {
    showToast("Dostupnosť musí trvať aspoň 15 minút.");
    return;
  }

  const overlaps = availability.some((item) => {
    if (item.date !== date) return false;

    const existingStart = timeToMinutes(item.start_time.slice(0, 5));
    const existingEnd = timeToMinutes(item.end_time.slice(0, 5));

    return startMinutes < existingEnd && endMinutes > existingStart;
  });

  if (overlaps) {
    showToast("Tento čas sa prekrýva s už existujúcou dostupnosťou.");
    return;
  }

  const { error } = await supabase.from("availability").insert({
    date,
    start_time: startTime,
    end_time: endTime,
    barber,
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Dostupnosť bola uložená.");
  setSelectedDate(date);
  await loadAvailability();
}

  function getBookingsForAvailability(item) {
  const start = timeToMinutes(item.start_time.slice(0, 5));
  const end = timeToMinutes(item.end_time.slice(0, 5));

  return bookings.filter((booking) => {
    if (booking.booking_date !== item.date) return false;
    if (booking.status === "cancelled") return false;

    const bookingTime = timeToMinutes(booking.booking_time.slice(0, 5));

    return bookingTime >= start && bookingTime < end;
  });
}

function openDeleteModal(item) {
  const slotBookings = getBookingsForAvailability(item);

  setDeleteModal({
    item,
    bookings: slotBookings,
  });
}

 async function confirmDeleteAvailability() {
  if (!deleteModal?.item) return;

  const item = deleteModal.item;
  const start = item.start_time.slice(0, 5);
  const end = item.end_time.slice(0, 5);

  const { error: bookingsError } = await supabase
    .from("bookings")
    .delete()
    .eq("booking_date", item.date)
    .gte("booking_time", start)
    .lt("booking_time", end);

  if (bookingsError) {
    showToast(bookingsError.message);
    return;
  }

  const { error: availabilityError } = await supabase
    .from("availability")
    .delete()
    .eq("id", item.id);

  if (availabilityError) {
    showToast(availabilityError.message);
    return;
  }

  showToast("Časový úsek bol vymazaný.");
  setDeleteModal(null);
  await loadAvailability();
  await loadBookings();
}

  useEffect(() => {
    loadBookings();
    loadAvailability();
  }, []);


  const [checkingAuth, setCheckingAuth] = useState(true);




useEffect(() => {
  async function checkAuth() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      navigate("/admin-login");
      return;
    }

    setCheckingAuth(false);
  }

  checkAuth();
}, [navigate]);

if (checkingAuth) {
  return <div className="p-10">Kontrolujem prístup...</div>;
}







  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-8">
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6">
            <div className="mb-5">
              <p className="text-red-600 font-bold mb-2">
                ⚠️ Potvrdenie mazania
              </p>
              <h2 className="text-2xl font-bold">
                Naozaj chceš zmazať túto dostupnosť?
              </h2>
            </div>

            <div className="bg-slate-100 rounded-2xl p-4 mb-4">
              <p className="font-bold">Mazaná dostupnosť:</p>
              <p>📅 {deleteModal.item.date}</p>
              <p>
                🕒 {deleteModal.item.start_time} - {deleteModal.item.end_time}
              </p>
              <p>Holič: {deleteModal.item.barber || "—"}</p>
            </div>

            <div className="bg-red-50 text-red-700 rounded-2xl p-4 mb-4">
              <p className="font-bold mb-2">Čo sa stane:</p>
              <ul className="list-disc pl-5 space-y-1">
              <li>Vymaže sa iba tento konkrétny časový úsek.</li>
<li>Vymažú sa iba rezervácie v tomto časovom úseku.</li>
<li>Ostatné časy v daný deň ostanú zachované.</li>
              </ul>
            </div>

            {deleteModal.bookings.length > 0 && (
              <div className="bg-yellow-50 text-yellow-800 rounded-2xl p-4 mb-5">
                <p className="font-bold mb-2">
                  Na tento deň už máš {deleteModal.bookings.length} rezervácií:
                </p>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {deleteModal.bookings.map((booking) => (
                    <div key={booking.id} className="text-sm border-b pb-2">
                      <p className="font-semibold">
                        🕒 {booking.booking_time} — {booking.customer_name}
                      </p>
                      <p>
                        {booking.service} | {booking.customer_phone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 bg-slate-100 py-3 rounded-2xl font-bold"
              >
                Nie, zrušiť
              </button>

              <button
                onClick={confirmDeleteAvailability}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold"
              >
     Áno, zmazať úsek
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-blue-600 font-semibold">Dashboard</p>
            <h1 className="text-4xl font-bold">Admin panel</h1>
          </div>

          <Link to="/" className="bg-blue-600 text-white px-5 py-3 rounded-xl">
            ← Späť
          </Link>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-5 py-3 rounded-xl font-semibold ${
              activeTab === "bookings"
                ? "bg-blue-600 text-white"
                : "bg-white"
            }`}
          >
            📅 Rezervácie
          </button>

          <button
            onClick={() => setActiveTab("availability")}
            className={`px-5 py-3 rounded-xl font-semibold ${
              activeTab === "availability"
                ? "bg-blue-600 text-white"
                : "bg-white"
            }`}
          >
            🕒 Dostupnosť
          </button>
        </div>

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold">Rezervácie podľa dní</h2>

                <button
                  onClick={loadBookings}
                  className="bg-slate-100 px-4 py-2 rounded-xl"
                >
                  🔄 Obnoviť
                </button>
              </div>

              <div className="grid grid-cols-7 gap-3">
                {visibleDays.map((day) => {
                  const count = visibleBookings.filter(
                    (booking) => booking.booking_date === day.date
                  ).length;

                  return (
                    <button
                      key={day.date}
                      disabled={day.isSunday}
                      onClick={() => {
                        if (day.isSunday) {
                          showToast("V nedeľu nepracuješ.");
                          return;
                        }

                        setSelectedDate(day.date);
                      }}
                      className={`p-4 rounded-2xl text-left border ${
                        day.isSunday
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                          : selectedDate === day.date
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <p className="font-bold uppercase text-sm">
                        {day.label}
                      </p>
                      <p className="text-2xl font-bold">{day.day}</p>
                      <p className="text-sm opacity-80">
                        {day.isSunday ? "zatvorené" : `${count} rezervácií`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">
                  Rezervácie na deň {selectedDate}
                </h2>
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm">
                  <tr>
                    <th className="p-4">Čas</th>
                    <th className="p-4">Klient</th>
                    <th className="p-4">Kontakt</th>
                    <th className="p-4">Služba</th>
                    <th className="p-4">Stav</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedDayBookings.map((booking) => (
                    <tr key={booking.id} className="border-t">
                      <td className="p-4 font-bold">
                        🕒 {booking.booking_time}
                      </td>
                      <td className="p-4 font-semibold">
                        {booking.customer_name}
                      </td>
                      <td className="p-4 text-sm">
                        {booking.customer_phone}
                        <br />
                        {booking.customer_email}
                      </td>
                      <td className="p-4">{booking.service}</td>
                      <td className="p-4">{booking.status}</td>
                    </tr>
                  ))}

                  {selectedDayBookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-500">
                        Na tento deň nemáš žiadne rezervácie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">
                  Ďalšie rezervácie mimo najbližších 7 dní
                </h2>
              </div>

              <div className="divide-y">
                {futureBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">
                        📅 {booking.booking_date} o {booking.booking_time}
                      </p>
                      <p className="text-slate-500">
                        {booking.customer_name} | {booking.service}
                      </p>
                    </div>

                    <button
                      disabled={isSunday(booking.booking_date)}
                      onClick={() => {
                        if (isSunday(booking.booking_date)) {
                          showToast("V nedeľu nepracuješ.");
                          return;
                        }

                        setSelectedDate(booking.booking_date);
                      }}
                      className="bg-slate-100 px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Otvoriť deň
                    </button>
                  </div>
                ))}

                {futureBookings.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    Žiadne ďalšie rezervácie mimo najbližších 7 dní.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "availability" && (
            <>
           <div className="gap-8 flex flex-col">
          <div className="grid lg:grid-cols-[420px_1fr] gap-8 ">
            <div className="bg-white rounded-3xl shadow p-6 h-fit ">
              <h2 className="text-2xl font-bold mb-5">Pridať dostupnosť</h2>

              <div className="space-y-4">
                <CustomDatePicker
  value={availabilityForm.date}
  markedDates={availability.map((item) => item.date)}
  onChange={(date) => {
    if (isSunday(date)) {
      showToast("V nedeľu nepracuješ. Vyber iný deň.");
      return;
    }

    setAvailabilityForm({
      ...availabilityForm,
      date,
    });

    setSelectedDate(date);
  }}
/>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500">Od</label>

                    <TimePicker
  value={availabilityForm.startTime}
  from="08:00"
  to="18:00"
  onChange={(time) =>
    setAvailabilityForm({
      ...availabilityForm,
      startTime: time,
    })
  }
/>
                    {/* <input
                      type="time"
                      value={availabilityForm.startTime}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full border rounded-2xl px-4 py-3"
                    /> */}
                  </div>

                  <div>
                    <label className="text-sm text-slate-500">Do</label>

                      <TimePicker
  value={availabilityForm.endTime}
  from="08:00"
  to="18:00"
  onChange={(time) =>
    setAvailabilityForm({
      ...availabilityForm,
      endTime: time,
    })
  }
/>
                  </div>
                </div>

                <input
                  placeholder="Holič / zamestnanec"
                  value={availabilityForm.barber}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      barber: e.target.value,
                    })
                  }
                  className="w-full  border border-slate-200 rounded-2xl px-4 py-3"
                />

                <button
                  onClick={createAvailability}
                  disabled={isSunday(availabilityForm.date)}
                  className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSunday(availabilityForm.date)
                    ? "V nedeľu zatvorené"
                    : "Uložiť dostupnosť"}
                </button>
              </div>
            </div>

            <div className="space-y-6 ">
            
                <div className="bg-white rounded-3xl shadow overflow-hidden h-full">
                <div className="p-6">
                  <h2 className="text-2xl font-bold ">
                    Dostupnosť na deň {new Date(selectedDate).toLocaleDateString("sk-SK")}
                  </h2>
                </div>

                <div className="divide-y ">
           
                        {selectedDayAvailability.length > 0 && (
                    <div className="h-[290px] w-full px-6 pb-6 space-y-3 overflow-y-auto hide-scrollbar">
                        {selectedDayAvailability.map((item) => (
                        <AvailabilityCard
                            key={item.id}
                            item={item}
                            onDelete={openDeleteModal}
                        />
                        ))}
                    </div>
                    )}
                           


                         

                  {selectedDayAvailability.length === 0 && (
                    <div className="px-6 text-start text-slate-500 pb-6">
                      Na tento deň nemáš nastavenú dostupnosť.
                    </div>
                  )}
                </div>
              </div> 

             
            </div>


          </div>
          <div className="w-full  gap-8 flex flex-col ">
            
            <div className=" bg-white  rounded-3xl shadow p-6">
                <h2 className="text-2xl font-bold mb-5">Najbližších 7 dní</h2>

                <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-7 gap-3">
                  {visibleDays.map((day) => {
                    const count = visibleAvailability.filter(
                      (item) => item.date === day.date
                    ).length;

                    return (
                      <button
                        key={day.date}
                        disabled={day.isSunday}
                        onClick={() => {
                          if (day.isSunday) {
                            showToast("V nedeľu nepracuješ.");
                            return;
                          }

                          setSelectedDate(day.date);
                          setAvailabilityForm({
                            ...availabilityForm,
                            date: day.date,
                          });
                        }}
                        className={`p-4 rounded-2xl text-left border border-slate-200 ${
                          day.isSunday
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            : selectedDate === day.date
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <p className="font-bold uppercase text-sm">
                          {day.label}
                        </p>
                        <p className="text-2xl font-bold">{day.day}</p>
                        <p className="text-sm opacity-80">
                          {day.isSunday ? "zatvorené" : `${count} dostupností`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow overflow-hidden h-[300px]">

                <div className="p-6 ">
                  <h2 className="text-2xl font-bold">
                    Ďalšie naplánované dni
                  </h2>
                </div>

                <div className="divide-y px-6 pb-6">
 
                  {futureAvailability.map((item) => (

                  <Viacden
                    key={item.id}
                    item={item}
                    isSunday={isSunday}
                    onDelete={openDeleteModal}
                    onOpen={(item) => {
                        if (isSunday(item.date)) {
                        showToast("V nedeľu nepracuješ.");
                        return;
                        }

                        setSelectedDate(item.date);

                        setAvailabilityForm({
                        ...availabilityForm,
                        date: item.date,
                        });
                    }}
                    />
                  ))}

                  {futureAvailability.length === 0 && (
                    <div className=" text-start text-slate-500">
                      Žiadne ďalšie dni mimo najbližších 7 dní.
                    </div>
                  )}
                </div>
              </div>


             


          </div>
             
</div>
 </>
        )}
      </div>
    </div>
  );
}