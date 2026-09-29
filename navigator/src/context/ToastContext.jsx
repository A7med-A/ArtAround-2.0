// ═══════════════════════════════════════════════════════════════
// TOAST — notifiche effimere in fondo allo schermo.
// Usato per confermare a voce alta le azioni (cambio livello, ecc.)
// mentre il visitatore cammina e non guarda il telefono.
// ═══════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Toast from "@/components/ui/Toast";
import Overlay from "@/components/ui/Overlay";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((message, variant = "default") => {
    if (!message) return;
    clearTimeout(timer.current);
    setToast({ message, variant, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Overlay>
          <Toast key={toast.id} message={toast.message} variant={toast.variant} />
        </Overlay>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve essere usato dentro <ToastProvider>");
  return ctx;
}
