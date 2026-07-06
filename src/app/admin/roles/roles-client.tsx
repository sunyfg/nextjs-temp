"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import { FullPageSkeleton } from "../_components/table-skeleton";
import { message } from "antd";

interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  status: number;
  sortOrder: number;
}

interface SysPermission {
  id: number;
  parentId: number;
  permissionName: string;
  permissionCode: string | null;
  type: string;
  path: string | null;
  component: string | null;
  icon: string | null;
  visible: number;
  status: number;
  sortOrder: number;
}

interface TreeNode extends SysPermission {
  children: TreeNode[];
}

const emptyForm = {
  roleCode: "",
  roleName: "",
  description: "",
  status: 1,
  sortOrder: 0,
};

type FormFields = typeof emptyForm;

/* ---------- Tree helpers ---------- */

function buildTree(perms: SysPermission[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  for (const p of perms) {
    map.set(p.id, { ...p, children: [] });
  }
  for (const p of perms) {
    const node = map.get(p.id)!;
    if (p.parentId === 0) {
      roots.push(node);
    } else {
      const parent = map.get(p.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node); // orphan → root
    }
  }
  return roots;
}

function getAllDescendantIds(perms: SysPermission[], parentId: number): number[] {
  const ids: number[] = [];
  for (const p of perms) {
    if (p.parentId === parentId) {
      ids.push(p.id);
      ids.push(...getAllDescendantIds(perms, p.id));
    }
  }
  return ids;
}

function getAncestorIds(perms: SysPermission[], childId: number): number[] {
  const ids: number[] = [];
  let current = perms.find((p) => p.id === childId);
  while (current && current.parentId !== 0) {
    const parent = perms.find((p) => p.id === current!.parentId);
    if (parent) {
      ids.push(parent.id);
      current = parent;
    } else {
      break;
    }
  }
  return ids;
}

/* ---------- Tree checkbox node ---------- */

function TreeNodeRow({
  node,
  depth,
  selectedIds,
  allPermissions,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedIds: Set<number>;
  allPermissions: SysPermission[];
  onToggle: (id: number, checked: boolean) => void;
}) {
  const childIds = useMemo(() => getAllDescendantIds(allPermissions, node.id), [allPermissions, node.id]);
  const descendantIds = useMemo(() => [node.id, ...childIds], [node.id, childIds]);

  const checkedCount = descendantIds.filter((id) => selectedIds.has(id)).length;
  const isChecked = checkedCount === descendantIds.length;
  const isIndeterminate = checkedCount > 0 && !isChecked;

  const handleChange = () => {
    onToggle(node.id, !isChecked);
  };

  return (
    <div className="select-none">
      <label
        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          ref={(el) => {
            if (el) el.indeterminate = isIndeterminate && !isChecked;
          }}
          onChange={handleChange}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <span className="text-black dark:text-zinc-50">{node.permissionName}</span>
        <span className="ml-1 text-xs text-zinc-400">
          {node.permissionCode ?? node.type}
        </span>
      </label>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              allPermissions={allPermissions}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Main component ---------- */

export default function RolesClient() {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Permission config modal state
  const [permModalRole, setPermModalRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<SysPermission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(new Set());
  const [permModalLoading, setPermModalLoading] = useState(false);
  const [permModalSaving, setPermModalSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/roles");
    const json = await res.json();
    if (json.code === 0) setRoles(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
    // Preload all permissions for TreeSelect
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((json) => {
        if (json.code === 0) setAllPermissions(json.data);
      });
  }, [fetchRoles]);

  const permTree = useMemo(() => buildTree(allPermissions), [allPermissions]);

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
      message.error(json.message);
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
      message.error(json.message);
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
      message.error(json.message);
    }
  }

  /* ---------- Permission config handlers ---------- */

  async function openPermConfig(role: Role) {
    setPermModalRole(role);
    setPermModalLoading(true);
    try {
      const res = await fetch(`/api/roles/${role.id}/permissions`);
      const json = await res.json();
      if (json.code === 0) {
        setSelectedPermIds(new Set(json.data.permissionIds));
      } else {
        message.error(json.message);
      }
    } catch {
      alert("加载权限配置失败");
    } finally {
      setPermModalLoading(false);
    }
  }

  function handlePermToggle(toggledId: number, checked: boolean) {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      const affected = [
        toggledId,
        ...getAllDescendantIds(allPermissions, toggledId),
      ];
      if (checked) {
        // Select: add node + all descendants + ancestors
        const ancestors = getAncestorIds(allPermissions, toggledId);
        for (const id of [...affected, ...ancestors]) next.add(id);
      } else {
        // Unselect: remove node + all descendants
        for (const id of affected) next.delete(id);
      }
      return next;
    });
  }

  async function savePermConfig() {
    if (!permModalRole) return;
    setPermModalSaving(true);
    try {
      const res = await fetch(`/api/roles/${permModalRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: Array.from(selectedPermIds) }),
      });
      const json = await res.json();
      if (json.code === 0) {
        setPermModalRole(null);
      } else {
        message.error(json.message);
      }
    } catch {
      alert("保存权限配置失败");
    } finally {
      setPermModalSaving(false);
    }
  }

  if (loading) {
    return <FullPageSkeleton withToolbar={false} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        角色管理
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        管理系统角色和权限分配
      </p>

      {hasPermission("system:role:create") && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-6 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + 新增角色
        </button>
      )}

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
                  {hasPermission("system:role:update") && (
                    <button
                      onClick={() => openPermConfig(role)}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      权限
                    </button>
                  )}
                  {hasPermission("system:role:update") && (
                    <button
                      onClick={() => startEdit(role)}
                      className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                    >
                      编辑
                    </button>
                  )}
                  {hasPermission("system:role:delete") && (
                    <button
                      onClick={() => setDeletingRole(role)}
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

      {/* Permission config modal */}
      {permModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              配置权限 — {permModalRole.roleName}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              勾选需要分配给该角色的权限项
            </p>

            {/* Tree area */}
            <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              {permModalLoading ? (
                <p className="py-8 text-center text-sm text-zinc-400">加载中...</p>
              ) : permTree.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">暂无权限数据</p>
              ) : (
                permTree.map((node) => (
                  <TreeNodeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedIds={selectedPermIds}
                    allPermissions={allPermissions}
                    onToggle={handlePermToggle}
                  />
                ))
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPermModalRole(null);
                  setSelectedPermIds(new Set());
                }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={savePermConfig}
                disabled={permModalSaving}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {permModalSaving ? "保存中..." : "保存权限"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
