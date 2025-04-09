import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ShareProvider } from "./contexts/ShareContext";

createRoot(document.getElementById("root")!).render(
  <ShareProvider>
    <App />
  </ShareProvider>
);
