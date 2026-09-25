import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Today } from "./pages/Today";
import { Churned } from "./pages/Churned";
import { Portfolio } from "./pages/Portfolio";
import { Accounts } from "./pages/Accounts";
import { AccountPage } from "./pages/AccountPage";
import { Renewals } from "./pages/Renewals";
import { Adoption } from "./pages/Adoption";
import { Settings } from "./pages/Settings";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="today" element={<Today />} />
            <Route path="churned" element={<Churned />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:orgId" element={<AccountPage />} />
            <Route path="renewals" element={<Renewals />} />
            <Route path="adoption" element={<Adoption />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
);
