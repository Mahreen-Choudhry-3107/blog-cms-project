import { Router, Response } from "express";
import { queryAll, queryOne, run, runReturning } from "../db";
import { authMiddleware, optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;

  const posts = await queryAll(
    `SELECT p.id, p.title, p.excerpt, p.created_at, p.updated_at, p.user_id, u.username
     FROM posts p JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const totalRow = await queryOne<{ count: number }>("SELECT COUNT(*)::int as count FROM posts");
  const total = totalRow?.count ?? 0;

  res.json({ posts, total, page, limit, pages: Math.ceil(total / limit) });
});

router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await queryOne(
    `SELECT p.*, u.username
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [req.params.id]
  );

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const comments = await queryAll(
    `SELECT c.id, c.content, c.created_at, c.user_id, u.username
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
    [req.params.id]
  );

  res.json({ ...post, comments });
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, excerpt } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "Title and content are required" });
    return;
  }

  const post = await runReturning(
    "INSERT INTO posts (title, content, excerpt, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, content, excerpt || content.slice(0, 150) + "...", req.userId]
  );
  res.status(201).json(post);
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, excerpt } = req.body;

  const existing = await queryOne<{ user_id: number }>(
    "SELECT user_id FROM posts WHERE id = $1",
    [req.params.id]
  );
  if (!existing) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const post = await runReturning(
    `UPDATE posts
     SET title = COALESCE($1, title), content = COALESCE($2, content),
         excerpt = COALESCE($3, excerpt), updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [title || null, content || null, excerpt || null, req.params.id]
  );
  res.json(post);
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await queryOne<{ id: number }>(
    "SELECT id FROM posts WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (!existing) {
    res.status(404).json({ error: "Post not found or not authorized" });
    return;
  }

  await run("DELETE FROM posts WHERE id = $1", [req.params.id]);
  res.json({ message: "Post deleted" });
});

router.post("/:id/comments", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const post = await queryOne<{ id: number }>("SELECT id FROM posts WHERE id = $1", [req.params.id]);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const { id: commentId } = await runReturning<{ id: number }>(
    "INSERT INTO comments (content, post_id, user_id) VALUES ($1, $2, $3) RETURNING id",
    [content, req.params.id, req.userId]
  );

  const fullComment = await queryOne(
    `SELECT c.*, u.username
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.id = $1`,
    [commentId]
  );
  res.status(201).json(fullComment);
});

export default router;
