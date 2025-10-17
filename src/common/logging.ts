import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import "winston-daily-rotate-file";

const LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const jsonFmt = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const appLoggerOptions: winston.LoggerOptions = {
  level: process.env.APP_LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: jsonFmt,
  transports: [
    // Консоль - для dev
    new winston.transports.Console({
      level: process.env.CONSOLE_LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "debug"),
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? " " + info.stack : ""}`),
      ),
    }),
    // Файловая ротация - app
    new (winston.transports as any).DailyRotateFile({
      filename: path.join(LOG_DIR, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "10m",
      maxFiles: "14d",
      level: process.env.APP_FILE_LOG_LEVEL || "info",
    }),
  ],
};

// Отдельный аудит-лог - только файл с ротацией
export const auditLogger = winston.createLogger({
  level: "info",
  format: jsonFmt,
  transports: [
    new (winston.transports as any).DailyRotateFile({
      filename: path.join(LOG_DIR, "audit-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "10m",
      maxFiles: "30d",
      level: "info",
    }),
  ],
});