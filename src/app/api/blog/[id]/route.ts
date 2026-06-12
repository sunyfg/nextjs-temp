import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });

  if (!post) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  return Response.json({ code: 0, message: "success", data: post });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  const post = await prisma.post.update({
    where: { id: Number(id) },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
    },
  });

  return Response.json({ code: 0, message: "Post updated", data: post });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  await prisma.post.delete({ where: { id: Number(id) } });
  return Response.json({ code: 0, message: "Post deleted" });
}
