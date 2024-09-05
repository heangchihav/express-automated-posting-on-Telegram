import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import requestIp from "request-ip";
import UAParser from "ua-parser-js";
import Logger from "../config/logger";
import sanitizeSensitiveInfo from "../helpers/sanitizeSensitiveInfo";

// Device Information Middleware to capture user device, location data, request/response details, request body, and response body
export const deviceInfoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { latitude, longitude } = req.body;

    const clientIp = requestIp.getClientIp(req);
    const ipAddress =
      clientIp ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "";

    const userAgent = req.headers["user-agent"] || "Unknown";
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    const deviceName = `${device.vendor || "Unknown"} ${
      device.model || "Device"
    }`;

    const user = req.user as User;

    const requestedRoute = req.originalUrl || req.url || "Unknown";
    const method = req.method;

    const originalSend = res.send.bind(res);
    let statusCode: number;
    let responseBody: string = "No response body"; // Default value

    res.send = (body: any) => {
      statusCode = res.statusCode;

      try {
        if (typeof body === "string") {
          // Handle string responses
          const bodyObj = JSON.parse(body);
          responseBody = JSON.stringify(sanitizeSensitiveInfo(bodyObj));
        } else {
          // Handle object responses
          responseBody = JSON.stringify(sanitizeSensitiveInfo(body));
        }
      } catch (error) {
        responseBody = "Error sanitizing response body";
        Logger.error("Error sanitizing response body:", error);
      }

      // Call the original send method with the unmodified body
      return originalSend(body);
    };

    await new Promise<void>((resolve, reject) => {
      next();
      res.on("finish", async () => {
        try {
          // Log detailed information as an object
          Logger.info({
            ipAddress,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            userAgent,
            deviceName,
            os: `${os.name || "Unknown"} ${os.version || ""}`,
            browser: `${browser.name || "Unknown"} ${browser.version || ""}`,
            requestedRoute,
            method,
            statusCode: statusCode || 500,
            responseBody,
            requestBody:
              JSON.stringify(sanitizeSensitiveInfo(req.body)) ||
              "No request body",
            userId: user?.id || "Unauthenticated User",
          });
          resolve();
        } catch (error) {
          Logger.error("Error capturing user device information:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    Logger.error("Error in deviceInfoMiddleware:", error);
    next(error);
  }
};
