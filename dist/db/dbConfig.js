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
exports.connectToDB = connectToDB;
const mongodb_1 = require("mongodb");
const env_1 = require("../env");
const client = new mongodb_1.MongoClient(env_1.mongoURI);
function connectToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mongodb = yield client.connect();
            if (!mongodb)
                return console.log('Error connecting to DB.');
            console.log('Connected to DB.');
            return mongodb.db(env_1.mongoDBName);
        }
        catch (error) {
            console.log(error);
            return;
        }
    });
}
