// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// const AppContext = createContext();

// export function AppProvider({ children }) {
//   const [bookings, setBookings] = useState([]);
//   const [availableSlots, setAvailableSlots] = useState([]);
//   const [loading, setLoading] = useState(true);

//   async function loadBookings() {
//     const { data, error } = await supabase
//       .from("bookings")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error(error);
//       return;
//     }

//     setBookings(data || []);
//   }

//   async function loadSlots() {
//     const { data, error } = await supabase
//       .from("available_slots")
//       .select("*")
//       .order("date", { ascending: true });

//     if (error) {
//       console.error(error);
//       return;
//     }

//     setAvailableSlots(data || []);
//   }

//   async function refreshData() {
//     setLoading(true);

//     await Promise.all([
//       loadBookings(),
//       loadSlots(),
//     ]);

//     setLoading(false);
//   }

//   useEffect(() => {
//     refreshData();
//   }, []);

//   return (
//     <AppContext.Provider
//       value={{
//         loading,

//         bookings,
//         setBookings,
//         loadBookings,

//         availableSlots,
//         setAvailableSlots,
//         loadSlots,

//         refreshData,
//       }}
//     >
//       {children}
//     </AppContext.Provider>
//   );
// }

// export function useApp() {
//   return useContext(AppContext);
// }


import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setBookings(data || []);
  }

  async function refreshData() {
    setLoading(true);
    await loadBookings();
    setLoading(false);
  }

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        loading,
        bookings,
        setBookings,
        loadBookings,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}