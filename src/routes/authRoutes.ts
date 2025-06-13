import { Router } from "express";
import { login, logout, signup } from "../controllers/authControllers";

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.delete('/logout', logout);

