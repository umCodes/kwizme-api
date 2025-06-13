import { RequestUser, User } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;      // attach authenticated user
      credits?: number; // attach calculated credits
      // Add other fields as needed
      file?: Multer.File;

    }
  }
}
