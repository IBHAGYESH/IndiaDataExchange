import { connect, connection, set } from "mongoose";
import { appConfig } from "@/config";
import { setDbConnected } from "@/state";

type MongooseCache = {
  conn: typeof connection | null;
  promise: Promise<typeof connection> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __ideMongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.__ideMongooseCache ?? {
  conn: null,
  promise: null,
};
global.__ideMongooseCache = cache;

export const connectMongoDB = async () => {
  set("strictQuery", false);

  if (cache.conn?.readyState === 1) {
    setDbConnected(true);
    return;
  }

  if (!cache.promise) {
    cache.promise = connect(appConfig.db.uri).then((mongooseInstance) => {
      cache.conn = mongooseInstance.connection;
      setDbConnected(true);
      console.log("MongoDB connected successfully");
      return mongooseInstance.connection;
    });
  }

  await cache.promise;
};

export const closeMongoDB = async () => {
  if (connection.readyState !== 0) {
    await connection.close();
  }
  setDbConnected(false);
};
