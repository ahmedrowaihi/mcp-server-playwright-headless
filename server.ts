import http from "http";
import { promises as fs } from "fs";
import path from "path";
import url from "url";
import os from "os";
import { consoleLogs } from "./shared.js";

export class ScreenshotServer {
  private httpServer: http.Server;
  private readonly SCREENSHOTS_DIR: string;
  private readonly SERVER_PORT: number;
  private static instance: ScreenshotServer;
  private constructor(port: number, screenshotsDir: string) {
    this.SERVER_PORT = port;
    this.SCREENSHOTS_DIR = screenshotsDir;
    this.httpServer = this.createServer();
  }

  private createServer(): http.Server {
    return http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || "", true);
      const pathname = parsedUrl.pathname;

      if (pathname?.startsWith("/screenshots/")) {
        const screenshotName = pathname.split("/screenshots/")[1].trim();
        const screenshotPath = path.join(this.SCREENSHOTS_DIR, screenshotName);

        try {
          const imageBuffer = await fs.readFile(screenshotPath);
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": imageBuffer.length,
          });
          res.end(imageBuffer);
        } catch (error) {
          res.writeHead(404);
          res.end("Screenshot not found");
        }
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });
  }

  async start(): Promise<void> {
    await this.ensureScreenshotsDir();
    return new Promise((resolve) => {
      this.httpServer.listen(this.SERVER_PORT, () => {
        consoleLogs.push(
          `Screenshot server running at http://localhost:${this.SERVER_PORT}`
        );
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async ensureScreenshotsDir(): Promise<void> {
    try {
      await fs.mkdir(this.SCREENSHOTS_DIR, { recursive: true });
    } catch (error) {
      consoleLogs.push(`Error creating screenshots directory: ${error}`);
    }
  }

  getScreenshotsDir(): string {
    return this.SCREENSHOTS_DIR;
  }

  getScreenshotUrl(screenshotName: string): string {
    return `http://localhost:${this.SERVER_PORT}/screenshots/${screenshotName}`;
  }

  /**
   * @param port
   * @param screenshotsDir
   * @returns
   */
  static getScreenshotServer(
    port: number = 3000,
    screenshotsDir: string = path.join(
      os.tmpdir(),
      "mcp-playwright-screenshots"
    )
  ): ScreenshotServer {
    if (!ScreenshotServer.instance) {
      ScreenshotServer.instance = new ScreenshotServer(port, screenshotsDir);
    }
    return ScreenshotServer.instance;
  }
}
