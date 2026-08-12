import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StoreCtx, loadAll } from "./api.js";
import App from "./App.jsx";
import "./index.css";

const root = createRoot(document.getElementById("root"));

loadAll()
  .then((store) => {
    root.render(
      <StrictMode>
        <StoreCtx.Provider value={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StoreCtx.Provider>
      </StrictMode>
    );
  })
  .catch(() => {
    root.render(
      <div style={{ fontFamily: "system-ui", textAlign: "center", padding: "80px 20px" }}>
        <p style={{ fontSize: 40 }}>🔌</p>
        <p>Sunucuya ulaşılamadı — lütfen sayfayı yenileyin.</p>
      </div>
    );
  });
