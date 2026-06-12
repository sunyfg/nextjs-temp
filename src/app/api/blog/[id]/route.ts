const posts: { id: number; title: string; content: string }[] = [
  { id: 1, title: "Hello World", content: "First blog post" },
  { id: 2, title: "Getting Started", content: "Welcome to the blog" },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = posts.find((p) => p.id === Number(id));

  if (!post) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  return Response.json({ code: 0, message: "success", data: post });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const index = posts.findIndex((p) => p.id === Number(id));

  if (index === -1) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  posts[index] = { ...posts[index], ...body };
  return Response.json({ code: 0, message: "Post updated", data: posts[index] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = posts.findIndex((p) => p.id === Number(id));

  if (index === -1) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  posts.splice(index, 1);
  return Response.json({ code: 0, message: "Post deleted" });
}
