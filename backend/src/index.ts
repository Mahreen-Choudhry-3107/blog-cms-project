import { initDb } from "./db";
import { createApp } from "./app";

async function main() {
  await initDb();

  const app = createApp();
  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
