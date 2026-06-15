"use client";

import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  age: number;
}

const ROLE_OPTIONS = ["admin", "editor", "viewer"] as const;

const emptyForm = { name: "", email: "", role: "viewer" as const, age: 0 };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    if (json.code === 0) setUsers(json.data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.code === 0) {
      setForm(emptyForm);
      fetchUsers();
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role, age: user.age });
  }

  async function handleUpdate(id: string) {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingId(null);
      fetchUsers();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeletingUser(null);
      fetchUsers();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Users
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage user accounts and permissions.
      </p>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black"
      >
        <fieldset className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Age</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </fieldset>
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Add User
        </button>
      </form>

      {/* Users table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Age</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) =>
              editingId === user.id ? (
                <tr key={user.id} className="bg-white dark:bg-black">
                  <td className="px-4 py-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User["role"] })}
                      className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                      className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                  </td>
                  <td className="flex gap-2 px-4 py-2">
                    <button
                      onClick={() => handleUpdate(user.id)}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded bg-zinc-500 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={user.id} className="bg-white dark:bg-black">
                  <td className="px-4 py-3 text-black dark:text-zinc-50">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.age}</td>
                  <td className="flex gap-2 px-4 py-3">
                    <button
                      onClick={() => startEdit(user)}
                      className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm dialog */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete user{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {deletingUser.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingUser.id)}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
