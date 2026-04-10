import { dbConnection } from "@database/index";
import { errorHandlerMiddleware } from "@middlewares/error.middleware";
import { globalRateLimiter } from "@middlewares/rateLimit.middleware";
import { systemRouter } from "@routes/system.routes";
import compression from "compression";
import cookieParser from "cookie-parser";
import express, { Request, Response, NextFunction, Router } from "express";
import helmet from "helmet";
import hpp from "hpp";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
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

    this.initializeCors();
    this.initializeSwagger();
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
      console.log(`Swagger docs: http://localhost:${this.port}/api-docs`);
      console.log(`=================================`);
    });
    return server;
  }

  public getServer() {
    return this.app;
  }

  /**
   * CORS must be the very first middleware so every response
   * (including errors, rate-limit rejections, etc.) carries the headers.
   */
  private initializeCors() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin || "*";
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Payment, X-PAYMENT, X-Payment-Wallet, x-payment, x-payment-wallet"
      );
      res.setHeader("Access-Control-Max-Age", "86400");

      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

  /**
   * Swagger UI must be mounted BEFORE helmet so its inline
   * scripts and CDN resources are not blocked.
   */
  private initializeSwagger() {
    const options: swaggerJSDoc.Options = {
      swaggerDefinition: {
        info: {
          title: "India Data Exchange API",
          version: "1.0.0",
          description:
            "Decentralized data marketplace API on Algorand. Supports x402 payments, wallet-based auth, and smart contract escrow bounties.",
        },
        host: `localhost:${this.port}`,
        basePath: "/",
        schemes: ["http", "https"],
        securityDefinitions: {
          Bearer: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "JWT Bearer token — format: Bearer <token>",
          },
        },
      },
      apis: ["./src/swagger/*.yaml"],
    };

    const specs = swaggerJSDoc(options);
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeMiddlewares() {
    this.app.use(globalRateLimiter);
    this.app.use(hpp());
    this.app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
      })
    );
    this.app.use(compression());
    this.app.use(express.json({ limit: appConfig.http.bodySizeLimit }));
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: appConfig.http.bodySizeLimit,
      })
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
