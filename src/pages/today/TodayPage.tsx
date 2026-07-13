// src/pages/today/TodayPage.tsx
// Mini-widget view — just shows the location-aware currency mini-widget.

import { CurrencyWidget } from "../../components/widgets/CurrencyWidget";
import "./TodayPage.css";

export function TodayPage() {
  return (
    <div className="tdp-today-mini">
      <CurrencyWidget />
    </div>
  );
}
