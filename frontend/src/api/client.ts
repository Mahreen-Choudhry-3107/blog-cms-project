const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const text = await res.text();

  if (!text) {
    throw new Error(res.ok ? "Server returned empty response" : `Server error (${res.status})`);
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    const snippet = text.length > 100 ? text.slice(0, 100) + "..." : text;
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    throw new Error(
      `Backend returned invalid response (expected JSON). Make sure the backend is running on port 3001. Response: ${snippet}`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export type User = { id: number; username: string };
export type Post = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  user_id: number;
  username: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
};
export type Comment = {
  id: number;
  content: string;
  post_id: number;
  user_id: number;
  username: string;
  created_at: string;
};

export const api = {
  auth: {
    register: (username: string, password: string) =>
      request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<{ user: User }>("/auth/me"),
  },
  posts: {
    list: (page = 1, limit = 10) =>
      request<{
        posts: Post[];
        total: number;
        page: number;
        limit: number;
        pages: number;
      }>(`/posts?page=${page}&limit=${limit}`),
    get: (id: number) => request<Post>(`/posts/${id}`),
    create: (data: { title: string; content: string; excerpt?: string }) =>
      request<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { title?: string; content?: string; excerpt?: string }) =>
      request<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/posts/${id}`, { method: "DELETE" }),
    comment: (postId: number, content: string) =>
      request<Comment>(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },
};
