import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string | null;
      username: string | null;
    }
  }
}