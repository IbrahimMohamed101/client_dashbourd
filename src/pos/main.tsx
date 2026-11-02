import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./pos.css";
import PosShell from "./PosShell";
createRoot(document.getElementById("root")!).render(
  <StrictMode><PosShell /></StrictMode>
);
