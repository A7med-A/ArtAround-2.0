import { Outlet, useNavigate, useParams } from "react-router-dom";
import { MuseumProvider, useMuseum } from "@/context/MuseumContext";
import { TourProvider } from "@/context/TourContext";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { ROUTES } from "@/constants/config";

/**
 * Mostra le schermate del museo solo quando i dati sono pronti.
 * Museo, opere e visite si caricano una volta sola qui: le quattro
 * sezioni della visita leggono tutte dallo stesso contesto.
 */
function MuseumGate({ children }) {
  const { loading, error, museum, reload } = useMuseum();
  const navigate = useNavigate();

  if (loading) return <LoadingState message="Preparo la visita…" />;

  if (error) {
    return (
      <ErrorState
        title="Museo non disponibile"
        message={error}
        onRetry={reload}
      />
    );
  }

  if (!museum) {
    return (
      <ErrorState
        title="Museo non trovato"
        message="Questo museo non esiste o non è più pubblicato."
        onRetry={() => navigate(ROUTES.MUSEUMS, { replace: true })}
      />
    );
  }

  return children;
}

/** Radice di tutte le rotte /musei/:slug/*. */
export default function MuseumLayout() {
  const { slug } = useParams();

  return (
    <MuseumProvider slug={slug}>
      <TourProvider>
        <MuseumGate>
          <Outlet />
        </MuseumGate>
      </TourProvider>
    </MuseumProvider>
  );
}
