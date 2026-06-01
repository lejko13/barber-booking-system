import { createContext, useContext, useState } from "react";
import Toast from '../components/toast'

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <Toast
        message={toast}
        onClose={() => setToast("")}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}