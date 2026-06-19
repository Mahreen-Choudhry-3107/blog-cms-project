import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { queryOne, run, getLastInsertId } from "../db";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = queryOne<{ id: number }>("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const hashed = bcrypt.hashSync(password, 10);
  run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed]);
  const id = getLastInsertId();
  const token = generateToken(id, username);
  res.status(201).json({ token, user: { id, username } });
});

router.post("/login", (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = queryOne<{ id: number; username: string; password: string }>(
    "SELECT id, username, password FROM users WHERE username = ?",
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
