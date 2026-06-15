import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      appEnv: string;
    } & DefaultSession["user"];
  }

  interface User {
    appEnv?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    appEnv?: string;
  }
}
