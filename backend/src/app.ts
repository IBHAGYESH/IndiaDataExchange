import { dbConnection } from "@database/index";
import { errorHandlerMiddleware } from "@middlewares/error.middleware";
import { globalRateLimiter } from "@middlewares/rateLimit.middleware";
import { systemRouter } from "@routes/system.routes";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";
import hpp from "hpp";
import { appConfig } from "@/config";

export interface Routes {
  path?: string;
  router: Router;
}

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = appConfig.nodeEnv || "development";
    this.port = appConfig.port || 5000;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public async init() {
    await dbConnection();
    console.log("Database connected");
  }

  public listen() {
    const server = this.app.listen(this.port, () => {
      console.log(`=================================`);
      console.log(`ENV: ${this.env}`);
      console.log(`App listening on port ${this.port}`);
      console.log(`=================================`);
    });
    return server;
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(
      cors({
        origin: "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Payment", "X-PAYMENT"],
      })
    );
    this.app.use(globalRateLimiter);
    this.app.use(hpp());
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
      })
    );
    this.app.use(compression());
    this.app.use(express.json({ limit: appConfig.http.bodySizeLimit }));
    this.app.use(
      express.urlencoded({ extended: true, limit: appConfig.http.bodySizeLimit })
    );
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    this.app.use(systemRouter);
    routes.forEach((route) => {
      this.app.use("/", route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorHandlerMiddleware);
  }
}
