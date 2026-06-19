import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, Post, User } from "../api/client";

export default function ViewPost({ user }: { user: User | null }) {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  const loadPost = () => {
    api.posts
      .get(Number(id))
      .then(setPost)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPost(); }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.posts.delete(Number(id));
      navigate("/");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.posts.comment(Number(id), comment);
      setComment("");
      loadPost();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!post) return <div className="text-center py-8">Post not found</div>;

  return (
    <article>
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="text-sm text-gray-400 mb-6">
        By {post.username} &middot; {new Date(post.created_at).toLocaleDateString()}
        {post.updated_at !== post.created_at && " (edited)"}
      </div>

      <div className="prose max-w-none mb-8 whitespace-pre-wrap">
        {post.content}
      </div>

      {user && Number(user.id) === Number(post.user_id) && (
        <div className="flex gap-2 mb-8">
          <Link
            to={`/posts/${post.id}/edit`}
            className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      )}

      <section className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-3 mb-6">
            {post.comments.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded border">
                <p>{c.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {c.username} &middot; {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-6">No comments yet.</p>
        )}

        {user ? (
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Post
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to comment.
          </p>
        )}
      </section>

      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-400">
        Created by Mahreen Choudhry
      </div>
    </article>
  );
}
