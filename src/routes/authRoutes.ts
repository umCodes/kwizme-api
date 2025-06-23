import { Router } from "express";
import { login, logout, signup } from "../controllers/authControllers";
import { validateInput } from "../middlewares/authHandler";

export const authRouter = Router();


authRouter.delete('/logout', logout);

authRouter.use(validateInput)
authRouter.post('/signup', signup);
authRouter.post('/login', login);
