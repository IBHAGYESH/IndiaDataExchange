"use client";

import { PropsWithChildren } from "react";
import { ReduxProvider } from "./redux-provider";
import { ThemeProvider } from "./theme-provider";
import { I18nProvider } from "./i18n-provider";
import { ToastProvider } from "./toast-provider";
import { AuthProvider } from "./auth-provider";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <ReduxProvider>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
};
