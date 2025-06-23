import { NextFunction, Request, Response } from "express";
import { database } from "..";
import { HttpError } from "../middlewares/errorHandler";
import { Quizes } from "../models/quiz";
import { ObjectId } from "mongodb";
import { generateQuiz } from "../utils/prompt";
import { creditsPerQuestion } from "../credits";
import { User } from "../models/User";





export async function getQuizes(req: Request, res: Response, next: NextFunction) {
    
    //Pagination 
    const page = Number(req.query.page || 0) ;
    const limit = 10;
    const skip = page * limit;
    
    const uid = String(req.user?.uid);

    try {
        //Get DB and Collection...
        const quizesCollection = (await database)?.collection<Quizes>('quizHistories');
        if(!quizesCollection) 
            throw new HttpError('Collection not found', 404);

        const quizes = await quizesCollection.find({uid}).limit(limit).skip(skip).toArray();       
        
        console.log(quizes);
        
        res.json(quizes)
        return;    

    } catch (error) {
        console.log('error fetching quizes: ', error);
        next(error);
    }

}

export async function getQuiz(req: Request, res: Response, next: NextFunction) {
   
    //Quiz ID
    const quizId = String(req.query.id);
    
    //User ID
    const uid = String(req.user?.uid); 
    
    try {
        const quizesCollection = (await database)?.collection<Quizes>('quizHistories');
        if(!quizesCollection) throw new HttpError('Collection not found', 500);
        
        //Find Quiz
        const quiz = await quizesCollection.findOne({uid, _id: new ObjectId(quizId)})

        res.json(quiz)        
        return;

    } catch (error) {
        console.log('error fetching quiz: ');
        next(error);
    }

}


export async function deleteQuiz(req: Request, res: Response, next: NextFunction){
    
    //Quiz ID
    const quizId = String(req.query.id);

    //User ID
    const uid = String(req.user?.uid)
    
    try {
        //Get DB and Collection....
        const quizesCollection = (await database)?.collection<Quizes>('quizHistories');
        if(!quizesCollection) throw new HttpError('Collection not found', 500);

        //Delete Quiz
        await quizesCollection.deleteOne({uid, _id: new ObjectId(quizId)})


        res.status(204).json({
            message: 'delete successful'
        })    
        return;
        
    } catch (error) {
        console.log('error deleting quiz: ');
        next(error)

    }
}

export async function createQuiz(req: Request, res: Response, next: NextFunction){

    if(typeof req.body.qTypes === "string")
        req.body.qTypes = JSON.parse(req.body.qTypes);   
    //Quiz specifications
    const { subject, qTypes, difficulty, number} = req.body;
    //User ID
    const uid = req.user?.uid;
    
    if(!req.credits)
        req.credits = Number((number * creditsPerQuestion).toFixed(2));
    
    try {
        //Get DB and Collection....
        const db = await database;
        const quizesCollection = db?.collection<Quizes>('quizHistories');
        if(!quizesCollection) throw new HttpError('Collection not found', 500);

        //Generate Quiz
        const questions: Quizes | undefined = await generateQuiz({uid, subject, qTypes, difficulty, number, credits: req.credits, generated_from: req.body.generated_from || 'prompt'});
        delete questions?.status;

        if(!questions) 
            throw new HttpError("error generating questions", 500);
        if(typeof questions !== 'object') throw new HttpError('Error Generating Quiz.', 500)

        //Insert Quiz to Database
        const { acknowledged } = await quizesCollection.insertOne({...questions});     
        

        //Get User...
        const usersCollection = db?.collection<User>('users');
        if(!usersCollection) throw new HttpError('User collection not found', 500); 
        

        const userCredits = (await usersCollection.findOne({_id: new ObjectId(uid)}, {projection: {credits: 1}}))?.credits;

        console.log("userCredits", userCredits);
        console.log("Credits required", req.credits);

        //Reduce Credits
        if(acknowledged && userCredits)
            if(userCredits > req.credits){
                await usersCollection.updateOne({_id: new ObjectId(uid)},
                {$set: { credits: Number((userCredits - req.credits).toFixed(2))}})
            }else{
                throw new HttpError("Insufficient Credit.", 402);
            }

        

        res.status(201).json(questions);      

        console.log(`${req.credits}credits is subtracted`);
        return;
    } catch (error) {
        console.error("Error generating quiz: ");
        next(error)
    }
 
}
