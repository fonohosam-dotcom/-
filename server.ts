import { createServer as createViteServer } from "vite";
import express from "express";
import path from "path";
import app from "./src/server/app.js";
import { setupCronJobs } from "./src/server/cron.js";
import { setupDatabaseTriggers } from "./src/db/triggers.js";

const PORT = 3000;

async function startServer() {
  // Initialize automated background jobs and database triggers
  setupCronJobs();
  await setupDatabaseTriggers();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server V2 running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
