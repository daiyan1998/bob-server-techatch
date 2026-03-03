import { format } from "date-fns";
import path from "path";
import * as fs from "fs";
import { promises as fsPromises } from "fs";
import { v4 as uuidv4 } from "uuid";

interface LoggerOptions {
  logName: string;
  logsDir?: string;
  basePath?: string;
}

class Logger {
  private readonly logsDir: string;
  private readonly logName: string;

  constructor({
    logName,
    logsDir = "logs",
    basePath = process.cwd(),
  }: LoggerOptions) {
    this.logName = logName;
    this.logsDir = path.join(basePath, logsDir);
  }

  /**
   * Logs a message to a file with timestamp and UUID
   * @param message - The message to log
   * @returns Promise<void>
   */
  public async logEvent(message: string): Promise<void> {
    const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
    const logItem = `${dateTime}\t${uuidv4()}\t${message}\n`;

    try {
      if (!fs.existsSync(this.logsDir)) {
        await fsPromises.mkdir(this.logsDir, { recursive: true });
      }

      const logFilePath = path.join(this.logsDir, this.logName);

      const existingLogs = fs.existsSync(logFilePath)
        ? await fsPromises.readFile(logFilePath, "utf-8")
        : "";

      const updatedLogs = logItem + existingLogs;

      await fsPromises.writeFile(logFilePath, updatedLogs);
    } catch (err) {
      console.error("Error writing to log file:", err);
      throw err;
    }
  }
}

export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
};

export type { LoggerOptions };
