import { Coffee } from "lucide-react";
import { Logo } from "@/components/Logo";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Logo compact />
        <a className="coffee-link" href="https://saweria.co/hasbiashiddiqi" target="_blank" rel="noreferrer">
          <Coffee size={16} /> Traktir kopi
        </a>
      </div>
    </header>
  );
}
