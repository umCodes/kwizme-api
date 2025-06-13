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
exports.generateTokens = generateTokens;
exports.storeInCookies = storeInCookies;
exports.clearDBRefreshToken = clearDBRefreshToken;
const __1 = require("..");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongodb_1 = require("mongodb");
const env_1 = require("../env");
function generateTokens(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Get Database...
            const db = yield __1.database;
            if (!db)
                return console.error('database not connected');
            const usersCollection = db.collection('users');
            //Generate refresh and access token
            const accessToken = jsonwebtoken_1.default.sign(user, env_1.signature.accessToken, { expiresIn: env_1.tokenAge.accessToken });
            const refreshToken = jsonwebtoken_1.default.sign(user, env_1.signature.refreshToken, { expiresIn: env_1.tokenAge.refreshToken });
            //store refresh token in db
            const hashedRefreshToken = yield bcrypt_1.default.hash(refreshToken.split('.')[2], 10);
            yield usersCollection.updateOne({ _id: new mongodb_1.ObjectId(user.uid) }, { $push: { refresh_tokens: hashedRefreshToken } });
            return {
                accessToken: accessToken,
                refreshToken: refreshToken
            };
        }
        catch (error) {
            console.log("Error generating tokens: ", error);
            return;
        }
    });
}
function storeInCookies(res, tokens) {
    if (tokens === null || tokens === void 0 ? void 0 : tokens.accessToken) //store access token in cookie
        res.cookie("access-token", tokens.accessToken, {
            httpOnly: true,
            // secure: true,
            // sameSite: 'lax'
        });
    if (tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken) //store refresh token in cookie
        res.cookie("refresh-token", tokens.refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 99,
            httpOnly: true,
            // secure: true,
            // sameSite: 'lax'
        });
    return;
}
function clearDBRefreshToken(uid, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            //Get Database...
            const db = yield __1.database;
            if (!db)
                return;
            const user = yield db.collection('users').findOne({ _id: new mongodb_1.ObjectId(uid) });
            //compare each encrypted refresh token in db with .cookies['refresh-token']
            //then remove the matching one from refresh tokens list in db
            (_a = user === null || user === void 0 ? void 0 : user.refresh_tokens) === null || _a === void 0 ? void 0 : _a.forEach(hashedtoken => {
                //Find client's old refresh token within refresh_tokens[...hashedTokens]
                bcrypt_1.default.compare(refreshToken.split('.')[2], hashedtoken, (err, same) => {
                    if (err || !same)
                        return;
                    //if match clear hashedtoken from refresh_tokens[...hashedTokens]
                    db.collection('users')
                        .updateOne({ _id: new mongodb_1.ObjectId(uid) }, { $pull: { refresh_tokens: hashedtoken } });
                });
            });
        }
        catch (error) {
            console.error(error);
        }
    });
}
