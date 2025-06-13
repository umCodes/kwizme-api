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
exports.refreshtokens = refreshtokens;
exports.verifyTokens = verifyTokens;
exports.validateInput = validateInput;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const env_1 = require("../env");
const tokens_1 = require("../utils/tokens");
function compareTokens(token1, token2) {
    const uid1 = jsonwebtoken_1.default.decode(token1).uid;
    const uid2 = jsonwebtoken_1.default.decode(token2).uid;
    return uid1 === uid2;
}
function refreshtokens(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        //Get Tokens...
        const refreshToken = req.cookies['refresh-token'];
        const accessToken = req.cookies['access-token'];
        if (!refreshToken || !accessToken)
            throw new errorHandler_1.HttpError('Access or Refresh Token not provided.', 400);
        if (!compareTokens(accessToken, refreshToken))
            throw new errorHandler_1.HttpError('Invalid access token.', 403);
        //Extract UID
        const accessPayload = jsonwebtoken_1.default.decode(accessToken);
        const refreshPayload = jsonwebtoken_1.default.decode(refreshToken);
        const { uid } = jsonwebtoken_1.default.decode(refreshToken);
        //Refresh expired tokens
        const tokens = {
            accessToken: 
            //if current date is greater than tokens expiry date, update token
            Date.now() > Number(accessPayload.exp) * 1000
                ?
                    jsonwebtoken_1.default.sign({ uid }, env_1.signature.accessToken, { expiresIn: env_1.tokenAge.accessToken })
                :
                    undefined,
            refreshToken: 
            //if current date is greater than tokens expiry date, update token
            Date.now() > Number(refreshPayload.exp) * 1000 ?
                jsonwebtoken_1.default.sign({ uid }, env_1.signature.refreshToken, { expiresIn: env_1.tokenAge.refreshToken })
                :
                    undefined
        };
        //Store in cookies:
        (0, tokens_1.storeInCookies)(res, tokens);
        //update request cookies if token is updated
        req.cookies["access-token"] = tokens.accessToken || accessToken;
        req.cookies["refresh-token"] = tokens.refreshToken || refreshToken;
        return next();
    });
}
function verifyTokens(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        //Get access token
        const token = String(req.cookies["access-token"]);
        //Throws an error if token doesn't exist
        if (!token) {
            return next(new errorHandler_1.HttpError("Please provide an access token.", 400));
        }
        //Verify token
        jsonwebtoken_1.default.verify(token, env_1.signature.accessToken, (err, decoded) => __awaiter(this, void 0, void 0, function* () {
            console.log(err);
            if (err)
                return next(new errorHandler_1.HttpError('Access Forbidden', 400));
            req.user = { uid: decoded.uid };
            next();
            return;
        }));
    });
}
function validateInput(req, res, next) {
    const { email, password } = req.body;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({
            message: "Email entered is invalid."
        });
        return;
    }
    if (!/^^(?=.*[A-Za-z]).{8,}$/.test(password)) {
        res.status(400).json({
            message: "Password entered is invalid."
        });
        return;
    }
    next();
}
