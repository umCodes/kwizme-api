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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const error_1 = require("./error/error");
const env_1 = require("./env");
const dbConfig_1 = require("./db/dbConfig");
const authRoutes_1 = require("./routes/authRoutes");
const authHandler_1 = require("./middlewares/authHandler");
const quizRoutes_1 = require("./routes/quizRoutes");
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use('/auth', authHandler_1.validateInput, authRoutes_1.authRouter);
app.use(authHandler_1.refreshtokens, authHandler_1.verifyTokens);
app.use('/api', quizRoutes_1.quizRoutes);
app.use(error_1.errorHandler);
exports.database = (() => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, dbConfig_1.connectToDB)();
    if (db)
        app.listen(env_1.PORT, () => console.log(`Server runnig on port ${env_1.PORT}`));
    return db;
}))();
