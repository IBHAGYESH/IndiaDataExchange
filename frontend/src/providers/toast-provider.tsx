"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from "@mui/material";

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);
export const useToast = () => useContext(ToastContext);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, severity: AlertColor = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, message, severity }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast, idx) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          TransitionComponent={SlideTransition}
          sx={{ mb: idx * 7 }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            sx={{
              width: "100%",
              borderRadius: 3,
              fontWeight: 500,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};
