"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import { FullPageSkeleton } from "../table-skeleton";

interface Permission {
  id: number;
  parentId: number;
  permissionName: string;
  permissionCode: string | null;
  type: "CATALOG" | "MENU" | "BUTTON" | "API";
  path: string | null;
  component: string | null;
  icon: string | null;
  visible: number;
  status: number;
  sortOrder: number;
}

const TYPE_LABELS: Record<string, string> = {
  CATALOG: "目录",
  MENU: "菜单",
  BUTTON: "按钮",
  API: "接口",
};

const TYPE_OPTIONS = ["CATALOG", "MENU", "BUTTON", "API"] as const;

const emptyForm = {
  parentId: 0,
  permissionName: "",
  permissionCode: "",
  type: "MENU" as string,
  path: "",
  component: "",
  icon: "",
  visible: 1,
  status: 1,
  sortOrder: 0,
};

type FormFields = typeof emptyForm;

interface TreeNode extends Permission {
  children: TreeNode[];
}

function buildTree(list: Permission[]): (Permission & { depth: number })[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of list) {
    map.set(item.id, { ...item, children: [] });
  }
  for (const item of list) {
    const node = map.get(item.id)!;
    if (item.parentId === 0 || !map.has(item.parentId)) {
      roots.push(node);
    } else {
      map.get(item.parentId)!.children.push(node);
    }
  }

  const result: (Permission & { depth: number })[] = [];
  function walk(nodes: TreeNode[], depth: number) {
    for (const { children, ...rest } of nodes) {
      result.push({ ...rest, depth });
      walk(children, depth + 1);
    }
  }
  walk(roots, 0);
  return result;
}

export default function PermissionsClient() {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Permission[]>([]);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Permission | null>(null);
  const [deletingItem, setDeletingItem] = useState<Permission | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/permissions");
    const json = await res.json();
    if (json.code === 0) setItems(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const tree = useMemo(() => buildTree(items), [items]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.code === 0) {
      setForm(emptyForm);
      setShowCreateModal(false);
      fetchItems();
    } else {
      alert(json.message);
    }
  }

  function startEdit(item: Permission) {
    setEditingItem(item);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const parentId = Number(formData.get("parentId"));
    const permissionName = formData.get("permissionName") as string;
    const permissionCode = formData.get("permissionCode") as string;
    const type = formData.get("type") as string;
    const path = formData.get("path") as string;
    const component = formData.get("component") as string;
    const icon = formData.get("icon") as string;
    const visible = Number(formData.get("visible"));
    const status = Number(formData.get("status"));
    const sortOrder = Number(formData.get("sortOrder"));
    const res = await fetch("/api/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingItem.id,
        parentId,
        permissionName,
        permissionCode: permissionCode || undefined,
        type,
        path: path || undefined,
        component: component || undefined,
        icon: icon || undefined,
        visible,
        status,
        sortOrder,
      }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingItem(null);
      fetchItems();
    } else {
      alert(json.message);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch("/api/permissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeletingItem(null);
      fetchItems();
    } else {
      alert(json.message);
    }
  }

  const parentOptions = (currentId?: number, defaultParentId: number = 0) => {
    const opts = items.filter((p) => (p.type === "CATALOG" || p.type === "MENU") && p.id !== currentId);
    return (
      <select
        name="parentId"
        defaultValue={defaultParentId}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value={0}>无（顶级）</option>
        {opts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.permissionName}
          </option>
        ))}
      </select>
    );
  };

  if (loading) {
    return <FullPageSkeleton withToolbar={false} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        权限管理
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        管理系统权限项，支持树形层级结构
      </p>

      {hasPermission("system:permissions:create") && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-6 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + 新增权限
        </button>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">名称</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">编码</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">类型</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">路由</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">状态</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">排序</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tree.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  暂无权限数据
                </td>
              </tr>
            )}
            {tree.map((item) => (
              <tr key={item.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3 text-black dark:text-zinc-50">
                  <span style={{ marginLeft: `${item.depth * 1.5}rem` }}>
                    {item.depth > 0 && (
                      <span className="mr-1 text-zinc-300 dark:text-zinc-600">└</span>
                    )}
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.permissionName}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{item.permissionCode || "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {item.path || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 1
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {item.status === 1 ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.sortOrder}</td>
                <td className="flex gap-2 px-4 py-3">
                  {hasPermission("system:permissions:update") && (
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                    >
                      编辑
                    </button>
                  )}
                  {hasPermission("system:permissions:delete") && (
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">新增权限</h3>
            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">权限名称</label>
                  <input
                    required
                    value={form.permissionName}
                    onChange={(e) => setForm({ ...form, permissionName: e.target.value })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">权限编码</label>
                  <input
                    value={form.permissionCode}
                    onChange={(e) => setForm({ ...form, permissionCode: e.target.value })}
                    placeholder="user:create"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">类型</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
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
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">父级</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: Number(e.target.value) })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value={0}>无（顶级）</option>
                    {items.filter((p) => p.type === "CATALOG" || p.type === "MENU").map((p) => (
                      <option key={p.id} value={p.id}>{p.permissionName}</option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">图标</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="home"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">路由路径</label>
                  <input
                    value={form.path}
                    onChange={(e) => setForm({ ...form, path: e.target.value })}
                    placeholder="/dashboard/users"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">组件路径</label>
                  <input
                    value={form.component}
                    onChange={(e) => setForm({ ...form, component: e.target.value })}
                    placeholder="dashboard/users"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">菜单可见</label>
                  <select
                    value={form.visible}
                    onChange={(e) => setForm({ ...form, visible: Number(e.target.value) })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value={1}>显示</option>
                    <option value={0}>隐藏</option>
                  </select>
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

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">编辑权限</h3>
            <form onSubmit={handleUpdate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">权限名称</label>
                  <input
                    name="permissionName"
                    required
                    defaultValue={editingItem.permissionName}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">权限编码</label>
                  <input
                    name="permissionCode"
                    defaultValue={editingItem.permissionCode ?? ""}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">类型</label>
                  <select
                    name="type"
                    defaultValue={editingItem.type}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">排序</label>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={editingItem.sortOrder}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">父级</label>
                  {parentOptions(editingItem.id, editingItem.parentId)}
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">图标</label>
                  <input
                    name="icon"
                    defaultValue={editingItem.icon ?? ""}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">路由路径</label>
                  <input
                    name="path"
                    defaultValue={editingItem.path ?? ""}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">组件路径</label>
                  <input
                    name="component"
                    defaultValue={editingItem.component ?? ""}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">菜单可见</label>
                  <select
                    name="visible"
                    defaultValue={editingItem.visible}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value={1}>显示</option>
                    <option value={0}>隐藏</option>
                  </select>
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">状态</label>
                  <select
                    name="status"
                    defaultValue={editingItem.status}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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

      {/* Delete confirm */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              确定要删除权限{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {deletingItem.permissionName}
              </span>
              吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingItem.id)}
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
