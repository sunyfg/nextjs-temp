"use client";

import { useCallback, useEffect, useState } from "react";

interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  status: number;
  sortOrder: number;
}

const emptyForm = {
  roleCode: "",
  roleName: "",
  description: "",
  status: 1,
  sortOrder: 0,
};

type FormFields = typeof emptyForm;

export default function RolesClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/roles");
    const json = await res.json();
    if (json.code === 0) setRoles(json.data);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.code === 0) {
      setForm(emptyForm);
      setShowCreateModal(false);
      fetchRoles();
    } else {
      alert(json.message);
    }
  }

  function startEdit(role: Role) {
    setEditingRole(role);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const roleCode = formData.get("roleCode") as string;
    const roleName = formData.get("roleName") as string;
    const description = formData.get("description") as string;
    const status = Number(formData.get("status"));
    const sortOrder = Number(formData.get("sortOrder"));
    const res = await fetch("/api/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingRole.id,
        roleCode,
        roleName,
        description,
        status,
        sortOrder,
      }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingRole(null);
      fetchRoles();
    } else {
      alert(json.message);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch("/api/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeletingRole(null);
      fetchRoles();
    } else {
      alert(json.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        角色管理
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        管理系统角色和权限分配
      </p>

      {/* Create button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="mt-6 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        + 新增角色
      </button>

      {/* Roles table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">编码</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">名称</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">描述</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">状态</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">排序</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {roles.map((role) => (
              <tr key={role.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3 text-black dark:text-zinc-50">{role.roleCode}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{role.roleName}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{role.description || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      role.status === 1
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {role.status === 1 ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{role.sortOrder}</td>
                <td className="flex gap-2 px-4 py-3">
                  <button
                    onClick={() => startEdit(role)}
                    className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeletingRole(role)}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create role modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">新增角色</h3>
            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">角色编码</label>
                  <input
                    required
                    value={form.roleCode}
                    onChange={(e) => setForm({ ...form, roleCode: e.target.value })}
                    placeholder="admin"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">角色名称</label>
                  <input
                    required
                    value={form.roleName}
                    onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                    placeholder="系统管理员"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-zinc-500">描述</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="角色描述"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">排序</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setForm(emptyForm); }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit role modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">编辑角色</h3>
            <form onSubmit={handleUpdate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">角色编码</label>
                  <input
                    name="roleCode"
                    required
                    defaultValue={editingRole.roleCode}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">角色名称</label>
                  <input
                    name="roleName"
                    required
                    defaultValue={editingRole.roleName}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-zinc-500">描述</label>
                  <input
                    name="description"
                    defaultValue={editingRole.description || ""}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">状态</label>
                  <select
                    name="status"
                    defaultValue={editingRole.status}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">排序</label>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={editingRole.sortOrder}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              确定要删除角色{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {deletingRole.roleName}
              </span>
              吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingRole(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingRole.id)}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
