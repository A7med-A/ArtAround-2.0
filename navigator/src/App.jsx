import { BrowserRouter } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import AppRoutes from "@/app/AppRoutes";

/**
 * ArtAround Navigator — app di visita museale.
 *
 * I dati arrivano tutti dalle API REST del server Express/MongoDB del
 * progetto; qui non esistono contenuti locali. Ordine dei provider:
 * tema (deve applicarsi prima del primo paint), sessione, notifiche.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppShell>
              <AppRoutes />
            </AppShell>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
