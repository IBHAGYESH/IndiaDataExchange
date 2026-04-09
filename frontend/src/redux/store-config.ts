import { combineReducers } from "@reduxjs/toolkit";
import { apiInstance } from "./api/apiInstance";

export const rootReducer = combineReducers({
  [apiInstance.reducerPath]: apiInstance.reducer,
});

export const middleware = [apiInstance.middleware];
