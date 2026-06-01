import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function CancelBooking() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadBooking() {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("cancel_token", token)
        .single();

      if (error || !data) {
        setMessage("Rezervácia nebola nájdená.");
        setLoading(false);
        return;
      }

      setBooking(data);
      setLoading(false);
    }

    loadBooking();
  }, [token]);

  async function cancelBooking() {
    const cancelledAt = new Date().toISOString();

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
      })
      .eq("cancel_token", token);

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

    setBooking((prev) => ({
      ...prev,
      status: "cancelled",
      cancelled_at: cancelledAt,
    }));

    setMessage("Rezervácia bola úspešne zrušená.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] shadow-xl px-8 py-6 border border-slate-100">
          <p className="text-slate-900 font-bold text-lg">
            Načítavam rezerváciu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg w-full border border-slate-100">
        <div className="mb-7">
          <p className="text-blue-600 font-bold text-lg mb-1">
            Rezervácia
          </p>

          <h1 className="text-4xl font-black text-slate-900 leading-tight">
            Zrušenie rezervácie
          </h1>

          <p className="text-slate-500 font-medium mt-3">
            Skontroluj údaje rezervácie a potvrď jej zrušenie.
          </p>
        </div>

        {booking && (
          <div className="bg-slate-50 rounded-[1.5rem] p-5 mb-5 border border-slate-200 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <p className="text-sm text-slate-400 font-bold mb-1">
                Služba
              </p>
              <p className="text-lg font-black text-slate-900">
                {booking.service}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <p className="text-sm text-slate-400 font-bold mb-1">
                  Dátum
                </p>
                <p className="font-black text-slate-900">
                  {booking.booking_date}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <p className="text-sm text-slate-400 font-bold mb-1">
                  Čas
                </p>
                <p className="font-black text-slate-900">
                  {booking.booking_time}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <p className="text-sm text-slate-400 font-bold mb-1">
                Meno
              </p>
              <p className="text-lg font-black text-slate-900">
                {booking.customer_name}
              </p>
            </div>

            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200">
              <p className="text-slate-500 font-bold">Stav</p>

              <span
                className={`px-4 py-2 rounded-full text-sm font-black ${
                  booking.status === "cancelled"
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {booking.status === "cancelled"
                  ? "Zrušená"
                  : booking.status}
              </span>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-2xl bg-blue-50 text-blue-700 p-4 font-bold border border-blue-100">
            {message}
          </div>
        )}

        {booking && booking.status !== "cancelled" && (
          <button
            onClick={cancelBooking}
            className="w-full bg-red-600 hover:bg-red-700 transition text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200"
          >
            Zrušiť rezerváciu
          </button>
        )}

        <Link
          to="/"
          className="block text-center mt-5 text-slate-500 hover:text-blue-600 font-bold transition"
        >
          ← Späť na rezerváciu
        </Link>
      </div>
    </div>
  );
}