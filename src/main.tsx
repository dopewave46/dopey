import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { AuthProvider } from "@/services/auth";
import { PortalAuthProvider } from "@/services/portalAuth";
import "@/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <PortalAuthProvider>
        <ToastProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </ToastProvider>
      </PortalAuthProvider>
    </AuthProvider>
  </React.StrictMode>,
);
