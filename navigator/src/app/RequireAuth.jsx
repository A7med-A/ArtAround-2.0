import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/ui/StateView";
import { ROUTES } from "@/constants/config";

/**
 * Protegge le rotte che richiedono un token.
 *
 * Anche la modalità ospite passa da qui: il server protegge tutte le
 * rotte dei musei con JWT, quindi senza token non c'è nulla da mostrare.
 */
export default function RequireAuth({ children }) {
  const { isReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isReady) return <LoadingState message="Verifico la sessione…" />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  return children;
}
