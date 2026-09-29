import { Outlet, useParams } from "react-router-dom";
import { ShellBody } from "@/components/layout/AppShell";
import MainNav from "@/components/layout/MainNav";
import { useMuseum } from "@/context/MuseumContext";
import styles from "./TabsLayout.module.css";

/**
 * Layout delle tre sezioni usate durante la visita
 * (visita, opere, mappa): contenuto + navigazione.
 */
export default function TabsLayout() {
  const { slug } = useParams();
  const { museum } = useMuseum();

  return (
    <div className={styles.layout}>
      <ShellBody>
        <Outlet />
      </ShellBody>
      <MainNav slug={slug} museumName={museum?.name} />
    </div>
  );
}
