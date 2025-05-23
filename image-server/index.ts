import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import multer from "multer";
import path from "path";

dotenv.config();

const app = express();
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3001;
const token = process.env.IMAGE_SERVER_TOKEN;
const uploadsDir = path.join(process.cwd(), "uploads");

if (!token) {
  console.warn(
    "Warning: IMAGE_SERVER_TOKEN not set. Server will run without authentication."
  );
}

// Authentication middleware
const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!token) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const providedToken = authHeader.split(" ")[1];
  if (providedToken !== token) {
    return res.status(403).json({ error: "Invalid token" });
  }

  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_, __, cb) => {
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Upload endpoint
app.post("/upload", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${host}:${port}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Delete specific image endpoint
app.delete("/uploads/:filename", authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "File not found" });
    }

    await fs.unlink(filePath);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Clear all uploads endpoint
app.delete("/uploads", authenticate, async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(
      files.map((file) => fs.unlink(path.join(uploadsDir, file)))
    );
    res.json({ message: "All files deleted successfully" });
  } catch (error) {
    console.error("Clear error:", error);
    res.status(500).json({ error: "Failed to clear uploads" });
  }
});

// Health check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

// Start server
app.listen(port, () => {
  console.log(`Image server running at http://localhost:${port}`);
});
