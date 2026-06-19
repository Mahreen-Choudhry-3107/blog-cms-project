import { initDb } from "../backend/src/db";
import { createApp } from "../backend/src/app";

let app: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  if (!app) {
    await initDb();
    app = createApp();
  }
  return app(req, res);
}
