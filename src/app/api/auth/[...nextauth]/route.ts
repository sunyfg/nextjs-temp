import { handlers } from "@/auth";

/**
 * GET /api/auth/[...nextauth] - Auth.js 认证处理入口
 * 处理登录、登出、回调、会话查询等所有认证流程
 * @see 委托给 Auth.js handlers 处理
 */
export const { GET, POST } = handlers;
