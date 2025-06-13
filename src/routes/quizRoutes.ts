import { Router } from "express";
import { createQuiz, deleteQuiz, getQuiz, getQuizes } from "../controllers/quizControllers";
import upload from "../middlewares/multerMiddleware";
import { ocrScanner, pdfParser } from "../middlewares/pdfParser";


export const quizRoutes = Router();

quizRoutes.get('/quizes', getQuizes);
quizRoutes.get('/quiz', getQuiz);
quizRoutes.post('/quiz', upload, ocrScanner, pdfParser, createQuiz);
quizRoutes.delete('/quiz', deleteQuiz);