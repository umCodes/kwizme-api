"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizRoutes = void 0;
const express_1 = require("express");
const quizControllers_1 = require("../controllers/quizControllers");
const multerMiddleware_1 = __importDefault(require("../middlewares/multerMiddleware"));
const pdfParser_1 = require("../middlewares/pdfParser");
exports.quizRoutes = (0, express_1.Router)();
exports.quizRoutes.get('/quizes', quizControllers_1.getQuizes);
exports.quizRoutes.get('/quiz', quizControllers_1.getQuiz);
exports.quizRoutes.post('/quiz', multerMiddleware_1.default, pdfParser_1.ocrScanner, pdfParser_1.pdfParser, quizControllers_1.createQuiz);
exports.quizRoutes.delete('/quiz', quizControllers_1.deleteQuiz);
