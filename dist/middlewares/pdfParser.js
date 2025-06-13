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
exports.pdfParser = pdfParser;
exports.ocrScanner = ocrScanner;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const pdf_poppler_1 = require("pdf-poppler");
const errorHandler_1 = require("./errorHandler");
const credits_1 = require("../credits");
const tesseract_js_1 = __importDefault(require("tesseract.js"));
function pdfParser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.file || req.body.file_type !== 'text')
            return next();
        req.body.generated_from = 'text pdf';
        //Read File's Content
        const filePath = req.file.path;
        const file = fs_1.default.readFileSync(filePath);
        const numberOfQuestions = req.body.number;
        try {
            //Read Pdf Content
            const { numpages, text } = yield (0, pdf_parse_1.default)(file);
            fs_1.default.unlinkSync(filePath);
            //Impose page limit
            if (numpages > 35)
                throw new errorHandler_1.HttpError('Invalid number of pages. Maximum allowed number of pages is 35 pages', 400);
            //Impose character range
            if (text.length < 350)
                throw new errorHandler_1.HttpError('Oops!, file has less than 350 characters. Try prompting it directly', 400);
            //Calculate Required Credits from user
            const calculatedCredits = Number((numpages * credits_1.creditsPerPage.textPDF).toFixed(2)) + Number((numberOfQuestions * credits_1.creditsPerQuestion).toFixed(2));
            //Assign pdf text to Subject
            req.body.subject = text;
            //Calculate Required Credits from user
            req.credits = calculatedCredits;
            return next();
        }
        catch (error) {
            console.log("Error Scanning image Pdf: ", error);
            return next(error);
        }
    });
}
function ocrScanner(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        //if a file isn't provided go to next function:
        if (!req.file || req.body.file_type !== 'image')
            return next();
        req.body.generated_from = 'image pdf';
        //Read File's Content
        const filePath = req.file.path;
        const file = fs_1.default.readFileSync(filePath);
        const numberOfQuestions = req.body.number;
        //Folder where each page is stored as an image 
        const imagesFolderName = `${Math.floor(Math.random() * 100) + Date.now()}`;
        const outputDir = path_1.default.dirname(filePath);
        const folderPath = path_1.default.join(__dirname, '../../', outputDir, imagesFolderName);
        //Create the image pages folder
        fs_1.default.mkdirSync(folderPath);
        const options = {
            format: "png",
            out_dir: './uploads/' + imagesFolderName,
            out_prefix: "document",
            page: null, // null = all pages
        };
        try {
            const pdfFilePages = (yield (0, pdf_parse_1.default)(file)).numpages;
            yield (0, pdf_poppler_1.convert)(filePath, options);
            fs_1.default.unlinkSync(filePath);
            //Future Addition: WebSockets for progress loading
            console.log("Conversion complete.");
            //Loop through each image within the created images folder 
            req.body.subject = '';
            for (let i = 1; i <= pdfFilePages; i++) {
                const ImagePath = `${folderPath}/document-${"0".repeat(digitCount(pdfFilePages) - digitCount(i)) + i.toString()}.png`;
                //Extract text from image:
                const result = yield tesseract_js_1.default.recognize(ImagePath, 'eng');
                //Delete Image from folder
                fs_1.default.unlinkSync(ImagePath);
                //Include text to Subject 
                req.body.subject += result.data.text;
            }
            //Calculate Required Credits from user
            const calculatedCredits = (pdfFilePages * credits_1.creditsPerPage.imagePDF) + (numberOfQuestions * credits_1.creditsPerQuestion);
            //Set Credits in Request
            req.credits = calculatedCredits;
            //Clear up
            req.file = undefined;
            fs_1.default.rmdirSync(folderPath);
            return next();
        }
        catch (error) {
            console.log("Error Scanning image Pdf: ", error);
            return next(new errorHandler_1.HttpError("A problem occured scanning your file. Please try again. ", 400));
        }
    });
}
//Calculates the number of digits of a Number
//Used to loop throug images folder
function digitCount(num) {
    return Math.floor(Math.log10(Math.abs(num)));
}
//Reason:  if the images folder has xxx number of images
//they will be stored by pdfPoppler as document-(001...xxx)
//for the i^th image in the folder the document will be named as document-00i, document-0ii, or document-iii. (ex. 35^th image --> document-035)
