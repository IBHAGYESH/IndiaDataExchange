"use client";

import { PropsWithChildren } from "react";
import { ReduxProvider } from "./redux-provider";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <ReduxProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ReduxProvider>
  );
};
