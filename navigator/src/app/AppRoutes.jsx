import { Navigate, Route, Routes } from "react-router-dom";
import SplashScreen from "@/features/onboarding/SplashScreen";
import LoginScreen from "@/features/onboarding/LoginScreen";
import MuseumsScreen from "@/features/museums/MuseumsScreen";
import MuseumLayout from "@/features/museums/MuseumLayout";
import MuseumDetailScreen from "@/features/museums/MuseumDetailScreen";
import TabsLayout from "@/features/museums/TabsLayout";
import VisitsScreen from "@/features/visits/VisitsScreen";
import TourScreen from "@/features/tour/TourScreen";
import ArtworksScreen from "@/features/artworks/ArtworksScreen";
import ArtworkDetailScreen from "@/features/artworks/ArtworkDetailScreen";
import MapScreen from "@/features/map/MapScreen";
import JoinScreen from "@/features/live/JoinScreen";
import LiveScreen from "@/features/live/LiveScreen";
import SessionsScreen from "@/features/teach/SessionsScreen";
import ConsoleScreen from "@/features/teach/ConsoleScreen";
import RequireAuth from "./RequireAuth";

/**
 * Mappa delle rotte.
 *
 * /musei/:slug/*  monta MuseumLayout, che carica museo, opere e visite una
 * volta sola. Le tre sezioni usate durante la visita stanno sotto
 * TabsLayout, che aggiunge la barra di navigazione in basso; le schermate
 * di preparazione (scheda museo, scelta della visita, dettaglio opera) la
 * omettono per lasciare tutto lo spazio al contenuto.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/accedi" element={<LoginScreen />} />

      <Route
        path="/musei"
        element={
          <RequireAuth>
            <MuseumsScreen />
          </RequireAuth>
        }
      />

      {/* Visita guidata dal docente — lato studente.
          Non passa dal museo: lo studente conosce solo il codice della visita,
          il museo lo ricava la sessione. */}
      <Route
        path="/partecipa"
        element={
          <RequireAuth>
            <JoinScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/sessione/:code"
        element={
          <RequireAuth>
            <LiveScreen />
          </RequireAuth>
        }
      />

      <Route
        path="/musei/:slug"
        element={
          <RequireAuth>
            <MuseumLayout />
          </RequireAuth>
        }
      >
        <Route index element={<MuseumDetailScreen />} />
        <Route path="visite" element={<VisitsScreen />} />
        <Route path="opere/:itemId" element={<ArtworkDetailScreen />} />

        {/* Visita guidata — lato docente */}
        <Route path="sessioni" element={<SessionsScreen />} />
        <Route path="sessioni/:code" element={<ConsoleScreen />} />

        <Route element={<TabsLayout />}>
          <Route path="visita" element={<TourScreen />} />
          <Route path="opere" element={<ArtworksScreen />} />
          <Route path="mappa" element={<MapScreen />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
