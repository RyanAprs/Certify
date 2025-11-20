import { Session } from "express-session";

declare module "express-serve-static-core" {
  interface Request {
    session: Session & {
      address?: string;
      dev?: boolean;
    };
  }
}
