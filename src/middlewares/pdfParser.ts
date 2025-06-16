import type { NextFunction, Request, Response } from "express";
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { convert } from "pdf-poppler";
import { HttpError } from "./errorHandler";
import { creditsPerPage, creditsPerQuestion } from "../credits";
import Tesseract from "tesseract.js";


export async function pdfParser(req: Request, res: Response, next: NextFunction) {
    
    if(!req.file || req.body.file_type !== 'text') return next();
    req.body.generated_from = 'text pdf';

    console.log(req.body);
    console.log(req.file);
    
    
    //Read File's Content
    const filePath = req.file.path;
    const file = fs.readFileSync(filePath);
    const numberOfQuestions = req.body.number;
    
    try {

        //Read Pdf Content
        const {numpages, text} = await pdf(file);
        fs.unlinkSync(filePath);
        //Impose page limit
        if(numpages > 35)
            throw new HttpError('Invalid number of pages. Maximum allowed number of pages is 35 pages', 400);

        //Impose character range
        if(text.length < 350)
            throw new HttpError('Oops!, file has less than 350 characters. Try prompting it directly', 400);

        //Calculate Required Credits from user
        const calculatedCredits = Number((numpages * creditsPerPage.textPDF).toFixed(2)) + Number((numberOfQuestions * creditsPerQuestion).toFixed(2));

        //Assign pdf text to Subject
        req.body.subject = text;
        //Calculate Required Credits from user
        req.credits = calculatedCredits;

        return next();
    } catch (error) {        
        console.log("Error Scanning image Pdf: ", error);
        return next(error);

    }   
}


export async function ocrScanner(req: Request, res: Response, next: NextFunction){
        
    //if a file isn't provided go to next function:
    if(!req.file || req.body.file_type !== 'image') return next();
    req.body.generated_from = 'image pdf';
    
    //Read File's Content
    const filePath = req.file.path;
    const file = fs.readFileSync(filePath);
    const numberOfQuestions = req.body.number;

    //Folder where each page is stored as an image 
    const imagesFolderName = `${Math.floor(Math.random() * 100) + Date.now()}`; 

    const outputDir = path.dirname(filePath);
    const folderPath = path.join(__dirname, '../../',outputDir , imagesFolderName);

    //Create the image pages folder
    fs.mkdirSync(folderPath)
    
    const options = {
        format: "png",
        out_dir: './uploads/' + imagesFolderName,
        out_prefix: "document",
        page: null, // null = all pages
        pdftoppm_path: '/usr/bin/pdftoppm'
    }


    
    
    try {
        const pdfFilePages = (await pdf(file)).numpages;
        await convert(filePath, options)
        fs.unlinkSync(filePath); 
        //Future Addition: WebSockets for progress loading
        console.log("Conversion complete.");
    

        //Loop through each image within the created images folder 
        req.body.subject = '';
        for(let i = 1; i <= pdfFilePages; i++){
            const ImagePath = `${folderPath}/document-${"0".repeat(digitCount(pdfFilePages) - digitCount(i)) + i.toString()}.png`
            //Extract text from image:
            const result = await Tesseract.recognize(
            ImagePath,
            'eng');
            //Delete Image from folder
            fs.unlinkSync(ImagePath); 
            //Include text to Subject 
            req.body.subject += result.data.text;
        }

        //Calculate Required Credits from user
        const calculatedCredits = (pdfFilePages * creditsPerPage.imagePDF) + (numberOfQuestions * creditsPerQuestion);

        //Set Credits in Request
        req.credits = calculatedCredits; 
        
        console.log(req.body);
        //Clear up
        req.file = undefined;
        fs.rmdirSync(folderPath);

        return next();

    } catch (error) {
        console.log("Error Scanning image Pdf: ", error);
        return next(new HttpError("A problem occured scanning your file. Please try again. ", 400));
    }

    
}


//Calculates the number of digits of a Number
//Used to loop throug images folder
function digitCount(num: number){
    return Math.floor(Math.log10(Math.abs(num)))
}
//Reason:  if the images folder has xxx number of images
//they will be stored by pdfPoppler as document-(001...xxx)
//for the i^th image in the folder the document will be named as document-00i, document-0ii, or document-iii. (ex. 35^th image --> document-035)
