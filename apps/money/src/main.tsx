import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Could not find the place on the page to start Breathe Money.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
