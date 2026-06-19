import { Link, Outlet } from "react-router-dom";
import type { User } from "../api/client";

export default function Layout({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Blog CMS
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/posts/new" className="text-sm text-blue-600 hover:underline">
                  New Post
                </Link>
                <span className="text-sm text-gray-500">{user.username}</span>
                <button
                  onClick={onLogout}
                  className="text-sm text-red-500 hover:underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-blue-600 hover:underline">
                  Login
                </Link>
                <Link to="/register" className="text-sm text-blue-600 hover:underline">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-400">
          &copy; 2026 Mahreen Choudhry. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
