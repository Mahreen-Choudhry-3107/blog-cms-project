import "dotenv/config";
import { initDb } from "./db";
import { createApp } from "./app";

const app = createApp();

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

let dbReady = false;
export default async function handler(req: any, res: any) {
  if (!dbReady) {
    await initDb();
    dbReady = true;
  }
  return app(req, res);
}
