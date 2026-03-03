import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import "dotenv/config";

import { db } from "@/db";
import errorHandler, { type CustomError } from "@/middlewares/error-handler";
import { PORT } from "@/utils/constants";

import router from "@/routes";
import { dynamicCors } from "./middlewares/cors.middleware";

const app: Application = express();

app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
app.use(
  "/public",
  express.static("public", {
    setHeaders: (res) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(dynamicCors);

app.use(router);

// Test

app.get("/", (_, res: Response) => {
  res.status(200).json({
    success: true,
    message: "hello from the server-side!",
  });
});

app.get("/favicon.ico", (_, res: Response) => {
  res.status(204).end();
});

// Error Handlers

app.all("*", (req: Request, _, next: NextFunction) => {
  const error: CustomError = new Error(
    `Can't find ${req.originalUrl} on this server!`,
  );
  error.success = false;
  error.statusCode = 404;

  next(error);
});

app.use(errorHandler);

async function startServer() {
  try {
    await db.$connect();
    console.log("successfully connected to database");

    app.listen(PORT, () => {
      console.log(`server initiated @http://localhost:${PORT}`);
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Closing server and DB connection");
      await db.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

startServer();
