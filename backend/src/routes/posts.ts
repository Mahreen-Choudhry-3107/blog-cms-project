import { Router, Response } from "express";
import { queryAll, queryOne, run, getLastInsertId } from "../db";
import { authMiddleware, optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, (req: AuthRequest, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;

  const posts = queryAll(
    `SELECT p.id, p.title, p.excerpt, p.created_at, p.updated_at, p.user_id, u.username
     FROM posts p JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const totalRow = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM posts");
  const total = totalRow?.count ?? 0;

  res.json({ posts, total, page, limit, pages: Math.ceil(total / limit) });
});

router.get("/:id", optionalAuth, (req: AuthRequest, res: Response): void => {
  const post = queryOne(
    `SELECT p.*, u.username
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [req.params.id]
  );

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const comments = queryAll(
    `SELECT c.id, c.content, c.created_at, c.user_id, u.username
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ? ORDER BY c.created_at ASC`,
    [req.params.id]
  );

  res.json({ ...post, comments });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, content, excerpt } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "Title and content are required" });
    return;
  }

  run(
    "INSERT INTO posts (title, content, excerpt, user_id) VALUES (?, ?, ?, ?)",
    [title, content, excerpt || content.slice(0, 150) + "...", req.userId]
  );
  const id = getLastInsertId();
  const post = queryOne("SELECT * FROM posts WHERE id = ?", [id]);
  res.status(201).json(post);
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, content, excerpt } = req.body;

  const post = queryOne<{ user_id: number }>("SELECT * FROM posts WHERE id = ?", [req.params.id]);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (post.user_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  run(
    "UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content), excerpt = COALESCE(?, excerpt), updated_at = datetime('now') WHERE id = ?",
    [title || null, content || null, excerpt || null, req.params.id]
  );

  const updated = queryOne("SELECT * FROM posts WHERE id = ?", [req.params.id]);
  res.json(updated);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response): void => {
  const post = queryOne("SELECT id FROM posts WHERE id = ? AND user_id = ?", [req.params.id, req.userId]);
  if (!post) {
    res.status(404).json({ error: "Post not found or not authorized" });
    return;
  }

  run("DELETE FROM posts WHERE id = ?", [req.params.id]);
  res.json({ message: "Post deleted" });
});

router.post("/:id/comments", authMiddleware, (req: AuthRequest, res: Response): void => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const post = queryOne<{ id: number }>("SELECT id FROM posts WHERE id = ?", [req.params.id]);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  run("INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)", [content, req.params.id, req.userId]);
  const commentId = getLastInsertId();
  const comment = queryOne(
    "SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?",
    [commentId]
  );

  res.status(201).json(comment);
});

export default router;
