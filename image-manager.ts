export interface ImageServerResponse {
  url: string;
}

export class ImageManager {
  private imageServer: string;
  private imageServerToken?: string;

  constructor() {
    this.imageServer = process.env.IMAGE_SERVER || "";
    this.imageServerToken = process.env.IMAGE_SERVER_TOKEN;

    if (!this.imageServer) {
      console.warn("Warning: IMAGE_SERVER environment variable not set");
    }
  }

  async uploadImage(imageBuffer: Buffer): Promise<string> {
    if (!this.imageServer) {
      throw new Error("IMAGE_SERVER environment variable not set");
    }

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    formData.append("image", blob, "screenshot.jpg");

    const response = await fetch(`${this.imageServer}/upload`, {
      method: "POST",
      headers: {
        ...(this.imageServerToken
          ? { Authorization: `Bearer ${this.imageServerToken}` }
          : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const data = (await response.json()) as ImageServerResponse;
    return data.url;
  }

  async deleteImage(filename: string): Promise<void> {
    if (!this.imageServer) {
      throw new Error("IMAGE_SERVER environment variable not set");
    }

    const response = await fetch(`${this.imageServer}/uploads/${filename}`, {
      method: "DELETE",
      headers: {
        ...(this.imageServerToken
          ? { Authorization: `Bearer ${this.imageServerToken}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }
  }

  async clearImages(): Promise<void> {
    if (!this.imageServer) {
      throw new Error("IMAGE_SERVER environment variable not set");
    }

    const response = await fetch(`${this.imageServer}/uploads`, {
      method: "DELETE",
      headers: {
        ...(this.imageServerToken
          ? { Authorization: `Bearer ${this.imageServerToken}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to clear images: ${response.statusText}`);
    }
  }

  async getBase64(imageBuffer: Buffer): Promise<string> {
    return imageBuffer.toString("base64");
  }
}
