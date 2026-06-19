import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { queryOne, runReturning } from "../db";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const hashed = bcrypt.hashSync(password, 10);
  const { id } = await runReturning<{ id: number }>(
    "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
    [username, hashed]
  );
  const token = generateToken(id, username);
  res.status(201).json({ token, user: { id, username } });
});

router.post("/login", async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = await queryOne<{ id: number; username: string; password: string }>(
    "SELECT id, username, password FROM users WHERE username = $1",
    [username]
  );
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.get("/me", authMiddleware, (req: AuthRequest, res: Response): void => {
  res.json({ user: { id: req.userId, username: req.username } });
});

export default router;
