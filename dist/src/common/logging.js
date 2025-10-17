"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.appLoggerOptions = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
const LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR))
    fs.mkdirSync(LOG_DIR, { recursive: true });
const jsonFmt = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
exports.appLoggerOptions = {
    level: process.env.APP_LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
    format: jsonFmt,
    transports: [
        // Консоль - для dev
        new winston.transports.Console({
            level: process.env.CONSOLE_LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "debug"),
            format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? " " + info.stack : ""}`)),
        }),
        // Файловая ротация - app
        new winston.transports.DailyRotateFile({
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
exports.auditLogger = winston.createLogger({
    level: "info",
    format: jsonFmt,
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(LOG_DIR, "audit-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "10m",
            maxFiles: "30d",
            level: "info",
        }),
    ],
});
