import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StratosphericApplication } from "@/components/stratum/app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StratosphericApplication />
  </StrictMode>,
);
