import { useTheme } from "@/context/ThemeContext";
import IconButton from "./IconButton";

/** Passa fra tema scuro e chiaro. La scelta resta salvata sul dispositivo. */
export default function ThemeToggle({ size = 40 }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <IconButton
      icon={isDark ? "sun" : "moon"}
      size={size}
      iconSize={18}
      onClick={toggleTheme}
      label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
    />
  );
}
