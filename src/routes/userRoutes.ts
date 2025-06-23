import { Router } from "express";
import { getUser, sendFeedback, updateUserName } from "../controllers/userController";



export const userRoutes = Router();

userRoutes.get('/user', getUser)
userRoutes.put('/user/name', updateUserName)
userRoutes.post('/api/feedback', sendFeedback)
