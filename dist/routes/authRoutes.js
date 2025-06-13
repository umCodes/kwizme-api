"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authControllers_1 = require("../controllers/authControllers");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/signup', authControllers_1.signup);
exports.authRouter.post('/login', authControllers_1.login);
exports.authRouter.delete('/logout', authControllers_1.logout);
