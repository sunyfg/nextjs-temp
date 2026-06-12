interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  age: number;
}

const users: User[] = [
  { id: 1, name: "Tom", email: "tom@example.com", role: "admin", age: 28 },
  { id: 2, name: "Jack", email: "jack@example.com", role: "editor", age: 35 },
];

let nextId = 3;

export async function GET() {
  return Response.json({ code: 0, message: "success", data: users });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ code: 400, message: "name is required" });
  }
  if (!body.email || typeof body.email !== "string") {
    return Response.json({ code: 400, message: "email is required" });
  }
  if (!["admin", "editor", "viewer"].includes(body.role)) {
    return Response.json({ code: 400, message: "role must be admin, editor, or viewer" });
  }

  const user: User = {
    id: nextId++,
    name: body.name,
    email: body.email,
    role: body.role,
    age: typeof body.age === "number" ? body.age : 0,
  };
  users.push(user);
  return Response.json({ code: 0, message: "用户创建成功", data: user });
}

export async function PUT(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const index = users.findIndex((u) => u.id === body.id);
  if (index === -1) {
    return Response.json({ code: 404, message: "用户不存在" });
  }

  if (body.name !== undefined) users[index].name = body.name;
  if (body.email !== undefined) users[index].email = body.email;
  if (["admin", "editor", "viewer"].includes(body.role)) users[index].role = body.role;
  if (body.age !== undefined) users[index].age = body.age;

  return Response.json({ code: 0, message: "用户更新成功", data: users[index] });
}

export async function DELETE(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const index = users.findIndex((u) => u.id === body.id);
  if (index === -1) {
    return Response.json({ code: 404, message: "用户不存在" });
  }

  users.splice(index, 1);
  return Response.json({ code: 0, message: "用户删除成功" });
}
