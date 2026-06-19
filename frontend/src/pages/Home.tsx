import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Post, User } from "../api/client";

export default function Home({ user }: { user: User | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.posts
      .list(page)
      .then((data) => {
        setPosts(data.posts);
        setPages(data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Posts</h1>
      {posts.length === 0 && <p className="text-gray-500">No posts yet.</p>}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <Link to={`/posts/${post.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
              {post.title}
            </Link>
            <p className="text-gray-600 mt-1">{post.excerpt}</p>
            <div className="text-sm text-gray-400 mt-2">
              By {post.username} &middot; {new Date(post.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex gap-2 mt-6 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
