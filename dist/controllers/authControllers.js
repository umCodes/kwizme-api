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
exports.signup = signup;
exports.login = login;
exports.logout = logout;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const __1 = require("..");
const errorHandler_1 = require("../middlewares/errorHandler");
const tokens_1 = require("../utils/tokens");
const credits_1 = require("../credits");
function signup(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, email } = req.body;
        //Get Database...
        const db = yield __1.database;
        if (!db)
            return console.error('database not connected');
        const usersCollection = db.collection('users');
        //Check if user already exists.
        if (yield usersCollection.findOne({ email }))
            throw new errorHandler_1.HttpError('User with this email already exists. Try logging in.', 409);
        try {
            //Encrypt password
            const password = yield bcrypt_1.default.hash(req.body.password, 12);
            //Create User in usersbase
            const user = yield usersCollection.insertOne({
                name, email, password, refresh_tokens: [], credits: credits_1.initialCredits
            });
            //Token Generation:
            //Generate access and refresh token and store refresh token in db
            const tokens = yield (0, tokens_1.generateTokens)({ uid: user.insertedId });
            //Store tokens in cookies
            if (!tokens)
                throw new Error('Error generating tokens');
            (0, tokens_1.storeInCookies)(res, tokens);
            //Respond with:
            res.status(201).json({
                message: 'Register Successfull!'
            });
        }
        catch (error) {
            console.log('error signing up: ', error);
            next(error);
        }
    });
}
function login(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body; // <-- user credentials
        const refreshToken = req.cookies['refresh-token'];
        try {
            //Get database...
            const db = yield __1.database;
            if (!db)
                return console.error('database not connected');
            //Validate Credentials:  
            const user = yield db.collection('users').findOne({ email });
            //Check if user exists
            if (!user)
                throw new errorHandler_1.HttpError('User not Registered. Try signing in.', 409);
            //Check if passwords match 
            const match = yield bcrypt_1.default.compare(password, user.password);
            if (!match)
                throw new errorHandler_1.HttpError('Incorrect password', 401);
            //Clear up existing token for the same client
            if (refreshToken)
                yield (0, tokens_1.clearDBRefreshToken)(String(user._id), refreshToken);
            //Token Generation:
            //Generate access and refresh token and store refresh token in db
            const tokens = yield (0, tokens_1.generateTokens)({ uid: user._id });
            //Store tokens in cookies
            if (!tokens)
                throw new Error('Error generating tokens');
            (0, tokens_1.storeInCookies)(res, tokens);
            //Responed with:
            res.status(200).json({
                message: 'Login Successfull!'
            });
            return;
        }
        catch (error) {
            console.log('error logging in: ', error);
            next(error);
            return;
        }
    });
}
function logout(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        //Get RefreshToken
        const refreshToken = req.cookies['refresh-token'];
        if (!refreshToken)
            return;
        const payload = jsonwebtoken_1.default.verify(refreshToken, String(process.env.REFRESH_TOKEN_SIGNATURE));
        const { uid } = payload;
        try {
            //Clear refresh token from database:
            yield (0, tokens_1.clearDBRefreshToken)(String(uid), refreshToken);
            //Clear tokens from cookies:
            res.clearCookie('refresh-token');
            res.clearCookie('access-token');
            res.status(204).json({
                message: "logout successfull"
            });
            return;
        }
        catch (error) {
            console.error('error logging out');
            next(error);
        }
    });
}
