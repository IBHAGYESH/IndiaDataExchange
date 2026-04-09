import { connect, connection, set } from "mongoose";
import { appConfig } from "@/config";
import { setDbConnected } from "@/state";

export const connectMongoDB = async () => {
  set("strictQuery", false);

  await connect(appConfig.db.uri);
  setDbConnected(true);
  console.log("MongoDB connected successfully");
};

export const closeMongoDB = async () => {
  if (connection.readyState !== 0) {
    await connection.close();
  }
  setDbConnected(false);
};
