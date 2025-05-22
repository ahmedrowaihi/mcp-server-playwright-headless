#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { promises as fs } from "fs";
import path from "path";
import playwright, { Browser, Page } from "playwright";
import { z } from "zod";
import { ScreenshotServer } from "./server.js";
import { consoleLogs } from "./shared.js";

// Global state
let browser: Browser | undefined;
let page: Page | undefined;

const screenshotServer = ScreenshotServer.getScreenshotServer();

// Create FastMCP server
const server = new FastMCP({
  name: "playwright-headless",
  version: "1.0.0",
  instructions:
    "A server that provides browser automation capabilities using Playwright in headless mode",
});

async function ensureBrowser() {
  if (!browser) {
    browser = await playwright.chromium.launch({ headless: true });
  }

  if (!page && browser) {
    page = await browser.newPage();
  }

  if (page) {
    page.on("console", (msg) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
    });
  }
  return page;
}

// Add tools
server.addTool({
  name: "browser_navigate",
  description: "Navigate to a URL",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    await page.goto(args.url);
    return `Navigated to ${args.url}`;
  },
});

server.addTool({
  name: "browser_screenshot",
  description: "Take a screenshot of the current page or a specific element",
  parameters: z.object({
    name: z.string(),
    selector: z.string().optional(),
    fullPage: z.boolean().default(false),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    const screenshot = await (args.selector
      ? page.locator(args.selector).screenshot()
      : page.screenshot({ fullPage: args.fullPage, type: "png" }));

    if (!screenshot) {
      throw new Error(
        args.selector
          ? `Element not found: ${args.selector}`
          : "Screenshot failed"
      );
    }

    // Save screenshot to disk
    const screenshotName = `${new Date().getTime()}.png`.trim();
    const screenshotPath = path.join(
      screenshotServer.getScreenshotsDir(),
      screenshotName
    );
    await fs.writeFile(screenshotPath, screenshot);

    // Return URL to the screenshot
    const screenshotUrl = screenshotServer.getScreenshotUrl(screenshotName);
    return {
      content: [
        {
          type: "text",
          text: `Screenshot taken and available at: ${screenshotUrl}`,
        },
        {
          type: "text",
          text: `markdown syntax for image: ![screenshot](${screenshotUrl})`,
        },
        {
          type: "text",
          text: `use markdown syntax for image when responding to user`,
        },
      ],
    };
  },
});

server.addTool({
  name: "browser_click",
  description: "Click an element on the page using CSS selector",
  parameters: z.object({
    selector: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page.locator(args.selector).click();
      return `Clicked: ${args.selector}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page.locator(args.selector).first().click();
          return `Clicked: ${args.selector}`;
        } catch (error) {
          throw new Error(
            `Failed (twice) to click ${args.selector}: ${
              (error as Error).message
            }`
          );
        }
      }
      throw new Error(
        `Failed to click ${args.selector}: ${(error as Error).message}`
      );
    }
  },
});

server.addTool({
  name: "browser_click_text",
  description: "Click an element on the page by its text content",
  parameters: z.object({
    text: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page.getByText(args.text).click();
      return `Clicked element with text: ${args.text}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page.getByText(args.text).first().click();
          return `Clicked element with text: ${args.text}`;
        } catch (error) {
          throw new Error(
            `Failed (twice) to click element with text ${args.text}: ${
              (error as Error).message
            }`
          );
        }
      }
      throw new Error(
        `Failed to click element with text ${args.text}: ${
          (error as Error).message
        }`
      );
    }
  },
});

server.addTool({
  name: "browser_fill",
  description: "Fill out an input field",
  parameters: z.object({
    selector: z.string(),
    value: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page
        .locator(args.selector)
        .pressSequentially(args.value, { delay: 100 });
      return `Filled ${args.selector} with: ${args.value}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page
            .locator(args.selector)
            .first()
            .pressSequentially(args.value, { delay: 100 });
          return `Filled ${args.selector} with: ${args.value}`;
        } catch (error) {
          throw new Error(
            `Failed (twice) to fill ${args.selector}: ${
              (error as Error).message
            }`
          );
        }
      }
      throw new Error(
        `Failed to fill ${args.selector}: ${(error as Error).message}`
      );
    }
  },
});

server.addTool({
  name: "browser_select",
  description:
    "Select an element on the page with Select tag using CSS selector",
  parameters: z.object({
    selector: z.string(),
    value: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page.locator(args.selector).selectOption(args.value);
      return `Selected ${args.selector} with: ${args.value}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page.locator(args.selector).first().selectOption(args.value);
          return `Selected ${args.selector} with: ${args.value}`;
        } catch (error) {
          throw new Error(
            `Failed (twice) to select ${args.selector}: ${
              (error as Error).message
            }`
          );
        }
      }
      throw new Error(
        `Failed to select ${args.selector}: ${(error as Error).message}`
      );
    }
  },
});

server.addTool({
  name: "browser_select_text",
  description:
    "Select an element on the page with Select tag by its text content",
  parameters: z.object({
    text: z.string(),
    value: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page.getByText(args.text).selectOption(args.value);
      return `Selected element with text ${args.text} with value: ${args.value}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page.getByText(args.text).first().selectOption(args.value);
          return `Selected element with text ${args.text} with value: ${args.value}`;
        } catch (error) {
          throw new Error(
            `Failed (twice) to select element with text ${args.text}: ${
              (error as Error).message
            }`
          );
        }
      }
      throw new Error(
        `Failed to select element with text ${args.text}: ${
          (error as Error).message
        }`
      );
    }
  },
});

server.addTool({
  name: "browser_hover",
  description: "Hover an element on the page using CSS selector",
  parameters: z.object({
    selector: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page.locator(args.selector).hover();
      return `Hovered ${args.selector}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page.locator(args.selector).first().hover();
          return `Hovered ${args.selector}`;
        } catch (error) {
          throw new Error(
            `Failed to hover ${args.selector}: ${(error as Error).message}`
          );
        }
      }
      throw new Error(
        `Failed to hover ${args.selector}: ${(error as Error).message}`
      );
    }
  },
});

server.addTool({
  name: "browser_hover_text",
  description: "Hover an element on the page by its text content",
  parameters: z.object({
    text: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      await page.getByText(args.text).hover();
      return `Hovered element with text: ${args.text}`;
    } catch (error) {
      if ((error as Error).message.includes("strict mode violation")) {
        try {
          await page.getByText(args.text).first().hover();
          return `Hovered element with text: ${args.text}`;
        } catch (error) {
          throw new Error(
            `Failed (twice) to hover element with text ${args.text}: ${
              (error as Error).message
            }`
          );
        }
      }
      throw new Error(
        `Failed to hover element with text ${args.text}: ${
          (error as Error).message
        }`
      );
    }
  },
});

server.addTool({
  name: "browser_evaluate",
  description: "Execute JavaScript in the browser console",
  parameters: z.object({
    script: z.string(),
  }),
  execute: async (args) => {
    const page = await ensureBrowser();
    if (!page) throw new Error("Failed to initialize browser page");
    try {
      const result = await page.evaluate((script) => {
        const logs: string[] = [];
        const originalConsole = { ...console };

        ["log", "info", "warn", "error"].forEach((method) => {
          (console as any)[method] = (...args: any[]) => {
            logs.push(`[${method}] ${args.join(" ")}`);
            (originalConsole as any)[method](...args);
          };
        });

        try {
          const result = eval(script);
          Object.assign(console, originalConsole);
          return { result, logs };
        } catch (error) {
          Object.assign(console, originalConsole);
          throw error;
        }
      }, args.script);

      return `Execution result:\n${JSON.stringify(
        result.result,
        null,
        2
      )}\n\nConsole output:\n${result.logs.join("\n")}`;
    } catch (error) {
      throw new Error(`Script execution failed: ${(error as Error).message}`);
    }
  },
});

// Add resources
server.addResource({
  uri: "console://logs",
  name: "Browser console logs",
  mimeType: "text/plain",
  async load() {
    return {
      text: consoleLogs.join("\n"),
    };
  },
});

// Start the server
async function startServer() {
  // Start screenshot server
  await screenshotServer.start();

  // Start MCP server
  await server.start({
    transportType: "stdio",
  });
}

// Handle cleanup on exit
process.on("SIGINT", async () => {
  if (browser) {
    await browser.close();
  }
  await screenshotServer.stop();
  process.exit(0);
});

// Start the server
startServer().catch(console.error);
