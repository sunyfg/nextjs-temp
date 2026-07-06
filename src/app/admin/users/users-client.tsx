"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import { FullPageSkeleton } from "../_components/table-skeleton";

interface Role {
  id: number;
  roleCode: string;
  roleName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  phone: string | null;
  status: number;
  roles: Role[];
}

const emptyForm = {
  name: "",
  email: "",
  age: 0,
  password: "",
  image: "",
  phone: "",
  roleIds: [] as number[],
};

type FormFields = typeof emptyForm;

export default function UsersClient() {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchName);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchName]);

  const fetchUsers = useCallback(async (name?: string) => {
    const params = name ? `?name=${encodeURIComponent(name)}` : "";
    const res = await fetch(`/api/users${params}`);
    const json = await res.json();
    if (json.code === 0) setUsers(json.data);
    setLoading(false);
  }, []);

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/roles");
    const json = await res.json();
    if (json.code === 0) setAllRoles(json.data);
  }, []);

  // Roles only need to be fetched once (for the create/edit modal role checkboxes)
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Users re-fetch when debounced search query changes
  useEffect(() => {
    fetchUsers(debouncedSearch);
  }, [fetchUsers, debouncedSearch]);

  function toggleRole(roleId: number) {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  function toggleEditRole(roleId: number) {
    if (!editingUser) return;
    setEditingUser((prev) => {
      if (!prev) return prev;
      const currentIds = prev.roles.map((r) => r.id);
      const newIds = currentIds.includes(roleId)
        ? currentIds.filter((id) => id !== roleId)
        : [...currentIds, roleId];
      return { ...prev, roles: allRoles.filter((r) => newIds.includes(r.id)) };
    });
  }

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
      setShowCreateModal(false);
      fetchUsers();
    }
  }

  function startEdit(user: User) {
    setEditingUser(user);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const age = Number(formData.get("age"));
    const password = formData.get("password") as string;
    const image = formData.get("image") as string;
    const phone = formData.get("phone") as string;
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingUser.id,
        name,
        email,
        age,
        password: password || undefined,
        image,
        phone: phone || undefined,
        roleIds: editingUser.roles.map((r) => r.id),
      }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingUser(null);
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

  const roleCheckboxes = (selectedIds: number[], onToggle: (id: number) => void) => (
    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
      {allRoles.length === 0 && (
        <p className="p-2 text-xs text-zinc-400">加载中...</p>
      )}
      {allRoles.map((role) => (
        <label
          key={role.id}
          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(role.id)}
            onChange={() => onToggle(role.id)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-black dark:text-zinc-50">{role.roleName}</span>
          <span className="text-xs text-zinc-400">({role.roleCode})</span>
        </label>
      ))}
    </div>
  );

  if (loading) {
    return <FullPageSkeleton withToolbar />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Users
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage user accounts and permissions.
      </p>

      {/* Toolbar: search + create */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="搜索姓名..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 pl-9 text-sm text-black outline-none transition-colors focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
        {hasPermission("system:user:create") && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            + Add User
          </button>
        )}
      </div>

      {/* Users table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Roles</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Age</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3 text-black dark:text-zinc-50">{user.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {role.roleName}
                      </span>
                    ))}
                    {user.roles.length === 0 && (
                      <span className="text-xs text-zinc-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.age}</td>
                <td className="flex gap-2 px-4 py-3">
                  {hasPermission("system:user:update") && (
                    <button
                      onClick={() => startEdit(user)}
                      className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                    >
                      Edit
                    </button>
                  )}
                  {hasPermission("system:user:delete") && (
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              Create User
            </h3>
            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-xs text-zinc-500">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="留空不设置密码"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Avatar URL</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="选填"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                {/* Role checkboxes */}
                <fieldset className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Roles</label>
                  {roleCheckboxes(form.roleIds, toggleRole)}
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setForm(emptyForm); }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              Edit User
            </h3>
            <form onSubmit={handleUpdate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingUser.name}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Email</label>
                  <input
                    name="email"
                    required
                    type="email"
                    defaultValue={editingUser.email}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">New Password</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="留空不修改密码"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Age</label>
                  <input
                    name="age"
                    type="number"
                    defaultValue={editingUser.age}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Phone</label>
                  <input
                    name="phone"
                    defaultValue={editingUser.phone ?? ""}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Avatar URL</label>
                  <input
                    name="image"
                    placeholder="选填"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                {/* Role checkboxes */}
                <fieldset className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Roles</label>
                  {roleCheckboxes(
                    editingUser.roles.map((r) => r.id),
                    toggleEditRole,
                  )}
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
