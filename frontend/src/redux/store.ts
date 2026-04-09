import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { middleware, rootReducer } from "./store-config";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "api/executeQuery/fulfilled",
          "api/executeQuery/pending",
          "api/executeQuery/rejected",
        ],
        ignoredPaths: ["api.queries", "api.mutations"],
      },
    }).concat(middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
