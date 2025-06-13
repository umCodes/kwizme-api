"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizes = getQuizes;
exports.getQuiz = getQuiz;
exports.deleteQuiz = deleteQuiz;
exports.createQuiz = createQuiz;
const __1 = require("..");
const errorHandler_1 = require("../middlewares/errorHandler");
const mongodb_1 = require("mongodb");
const prompt_1 = require("../utils/prompt");
const credits_1 = require("../credits");
function getQuizes(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        //Pagination 
        const page = Number(req.query.page || 0);
        const limit = 10;
        const skip = page * limit;
        const uid = String((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid);
        try {
            //Get DB and Collection...
            const quizesCollection = (_b = (yield __1.database)) === null || _b === void 0 ? void 0 : _b.collection('quizHistories');
            if (!quizesCollection)
                throw new errorHandler_1.HttpError('Collection not found', 404);
            const quizes = yield quizesCollection.find({ uid }).limit(limit).skip(skip).toArray();
            res.json(quizes);
            return;
        }
        catch (error) {
            console.log('error fetching quizes: ', error);
            next(error);
        }
    });
}
function getQuiz(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        //Quiz ID
        const quizId = String(req.query.id);
        //User ID
        const uid = String((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid);
        try {
            const quizesCollection = (_b = (yield __1.database)) === null || _b === void 0 ? void 0 : _b.collection('quizHistories');
            if (!quizesCollection)
                throw new errorHandler_1.HttpError('Collection not found', 500);
            //Find Quiz
            const quiz = yield quizesCollection.findOne({ uid, _id: new mongodb_1.ObjectId(quizId) });
            res.json(quiz);
            return;
        }
        catch (error) {
            console.log('error fetching quiz: ');
            next(error);
        }
    });
}
function deleteQuiz(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        //Quiz ID
        const quizId = String(req.query.id);
        //User ID
        const uid = String((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid);
        try {
            //Get DB and Collection....
            const quizesCollection = (_b = (yield __1.database)) === null || _b === void 0 ? void 0 : _b.collection('quizHistories');
            if (!quizesCollection)
                throw new errorHandler_1.HttpError('Collection not found', 500);
            //Delete Quiz
            yield quizesCollection.deleteOne({ uid, _id: new mongodb_1.ObjectId(quizId) });
            res.status(204);
            return;
        }
        catch (error) {
            console.log('error deleting quiz: ');
            next(error);
        }
    });
}
function createQuiz(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (typeof req.body.qTypes === "string")
            req.body.qTypes = JSON.parse(req.body.qTypes);
        //Quiz specifications
        const { subject, qTypes, difficulty, number } = req.body;
        //User ID
        const uid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!req.credits)
            req.credits = Number((number * credits_1.creditsPerQuestion).toFixed(2));
        try {
            //Get DB and Collection....
            const db = yield __1.database;
            const quizesCollection = db === null || db === void 0 ? void 0 : db.collection('quizHistories');
            if (!quizesCollection)
                throw new errorHandler_1.HttpError('Collection not found', 500);
            //Generate Quiz
            const questions = yield (0, prompt_1.generateQuiz)({ uid, subject, qTypes, difficulty, number, credits: req.credits, generated_from: req.body.generated_from || 'prompt' });
            questions === null || questions === void 0 ? true : delete questions.status;
            if (!questions)
                throw new errorHandler_1.HttpError("error generating questions", 500);
            //Insert Quiz to Database
            const { acknowledged } = yield quizesCollection.insertOne(Object.assign({}, questions));
            //Get User...
            const usersCollection = db === null || db === void 0 ? void 0 : db.collection('users');
            if (!usersCollection)
                throw new errorHandler_1.HttpError('User collection not found', 500);
            const userCredits = (_b = (yield usersCollection.findOne({ _id: new mongodb_1.ObjectId(uid) }, { projection: { credits: 1 } }))) === null || _b === void 0 ? void 0 : _b.credits;
            console.log("userCredits", userCredits);
            console.log("Credits required", req.credits);
            //Reduce Credits
            if (acknowledged && userCredits)
                if (userCredits > req.credits) {
                    yield usersCollection.updateOne({ _id: new mongodb_1.ObjectId(uid) }, { $set: { credits: Number((userCredits - req.credits).toFixed(2)) } });
                }
                else {
                    throw new errorHandler_1.HttpError("Insufficient Credit.", 402);
                }
            res.status(201).json({
                message: questions,
            });
            console.log(`${req.credits}credits is subtracted`);
            return;
        }
        catch (error) {
            console.error("Error generating quiz: ");
            next(error);
        }
    });
}
