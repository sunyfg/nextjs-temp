import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage dashboard users",
};

const users = [
  { id: 1, name: "Alice Kim", role: "Admin" },
  { id: 2, name: "Bob Park", role: "Editor" },
  { id: 3, name: "Carol Lee", role: "Viewer" },
];

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Users
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage user accounts and permissions.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3 text-black dark:text-zinc-50">{user.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
