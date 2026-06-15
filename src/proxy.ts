import { auth } from '@/auth';

export const proxy = auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
