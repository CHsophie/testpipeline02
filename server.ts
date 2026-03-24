import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    // 开发模式：使用 Vite 中间件
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // 生产模式：托管 dist 目录下的静态文件
    const distPath = path.resolve(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);

    // 静态文件服务：显式处理静态资源
    app.use(express.static(distPath, {
      index: false, // 禁用默认 index.html，由下方的 get("*") 统一处理
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }
      }
    }));
    
    // 所有路由都指向 index.html (SPA 支持)
    app.get("*", (req, res) => {
      const indexPath = path.resolve(distPath, "index.html");
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
