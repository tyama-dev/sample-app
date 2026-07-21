import { serve } from "@hono/node-server";
import { Hono } from "hono";
import path from "node:path";
import { config } from "dotenv";
import { requireAuth, requireRole } from "./presentation/middleware/auth";
import type { TokenPayload } from "./domain/entities/token-payload";

config({ path: path.resolve(__dirname, "../../../.env") });

const app = new Hono<{ Variables: { jwtPayload: TokenPayload } }>();

app.get("/", (c) => {
  return c.text("Hono API is running");
});

app.get("/admin/stats", requireAuth, requireRole("admin"), (c) => {
  const payload = c.get("jwtPayload");
  return c.json({
    message: "This is admin-only data",
    requestedBy: payload.sub,
    timestamp: new Date().toISOString(),
  });
});

const port = 3001;
serve({
  fetch: app.fetch,
  port,
});

console.log(`API server listening on http://localhost:${port}`);
