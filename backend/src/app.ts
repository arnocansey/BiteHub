import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: [env.adminDashboardUrl] }));
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buffer) => {
        (req as express.Request & { rawBody?: string }).rawBody = buffer.toString("utf8");
      }
    })
  );
  app.use(morgan("dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "bitehub-backend" });
  });

  app.use("/api/v1", routes);
  app.use(errorMiddleware);

  return app;
};
