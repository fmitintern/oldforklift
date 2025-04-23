import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Register Service Workers ONLY in Production
if ("serviceWorker" in navigator) {
  if (process.env.NODE_ENV === "production") {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("✅ PWA Service Worker Registered"))
      .catch((err) => console.error("❌ Service Worker Registration Failed:", err));
  } else {
    console.log("⚠️ Service Worker Disabled in Development Mode");
  }
}

reportWebVitals();
