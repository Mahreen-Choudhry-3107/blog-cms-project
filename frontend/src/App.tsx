import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import ViewPost from "./pages/ViewPost";
import { api, type User } from "./api/client";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth.me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={() => { setUser(null); localStorage.removeItem("token"); }} />}>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={<Login onLogin={(u, t) => { setUser(u); localStorage.setItem("token", t); }} />} />
        <Route path="/register" element={<Register onRegister={(u, t) => { setUser(u); localStorage.setItem("token", t); }} />} />
        <Route path="/posts/new" element={<CreatePost user={user} />} />
        <Route path="/posts/:id/edit" element={<EditPost user={user} />} />
        <Route path="/posts/:id" element={<ViewPost user={user} />} />
      </Route>
    </Routes>
  );
}
