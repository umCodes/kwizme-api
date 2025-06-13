import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { database } from "..";
import { HttpError } from "../middlewares/errorHandler";
import { clearDBRefreshToken, generateTokens, storeInCookies } from "../utils/tokens";
import { User } from "../models/User";
import { initialCredits } from "../credits";
import { UserPayload } from "../models/jwt";








export async function signup(req: Request, res: Response, next: NextFunction){
    const {name, email} = req.body;

    //Get Database...
    const db = await database;
    if(!db) return console.error('database not connected');

    const usersCollection = db.collection('users');
    //Check if user already exists.
    if(await usersCollection.findOne({email})) throw new HttpError('User with this email already exists. Try logging in.', 409);

    try {
        //Encrypt password
        const password = await bcrypt.hash(req.body.password, 12);    
                //Create User in usersbase
        const user = await usersCollection.insertOne({
            name, email, password, refresh_tokens: [], credits: initialCredits
        });

        //Token Generation:
        //Generate access and refresh token and store refresh token in db
        const tokens = await generateTokens({uid: user.insertedId});

        //Store tokens in cookies
        if(!tokens) throw new Error('Error generating tokens'); 
        storeInCookies(res, tokens);
        //Respond with:
        res.status(201).json({
            message: 'Register Successfull!'
        });

    } catch (error) {
        console.log('error signing up: ', error);
        next(error);
    }

}


export async function login(req: Request, res: Response, next: NextFunction){
    const {email, password} = req.body; // <-- user credentials
    const refreshToken = req.cookies['refresh-token'];


    try{
        //Get database...
        const db = await database;
        if(!db) return console.error('database not connected');

        //Validate Credentials:  
        const user = await db.collection<User>('users').findOne({email})
            //Check if user exists
            if(!user) throw new HttpError('User not Registered. Try signing in.', 409);

            //Check if passwords match 
            const match = await bcrypt.compare(password, user.password);
            if(!match) throw new HttpError('Incorrect password', 401);

            //Clear up existing token for the same client
            if(refreshToken) await clearDBRefreshToken(String(user._id), refreshToken);

            //Token Generation:
            //Generate access and refresh token and store refresh token in db
            const tokens = await generateTokens({uid: user._id}); 
            
            //Store tokens in cookies
            if(!tokens) throw new Error('Error generating tokens'); 
            storeInCookies(res, tokens);
                
            
            //Responed with:
            res.status(200).json({
                message: 'Login Successfull!'
            });
            return;
    }catch(error){
        console.log('error logging in: ', error);
        next(error);
        return;
    }

}




export async function logout(req: Request, res: Response, next: NextFunction){
    //Get RefreshToken
    const refreshToken = req.cookies['refresh-token'];
    if(!refreshToken) return;

    const payload = jwt.verify(refreshToken, String(process.env.REFRESH_TOKEN_SIGNATURE)) as UserPayload; 
    const {uid} = payload;

    try {
        //Clear refresh token from database:
        await clearDBRefreshToken(String(uid), refreshToken);

        //Clear tokens from cookies:
        res.clearCookie('refresh-token');
        res.clearCookie('access-token');
        res.status(204).json({
            message: "logout successfull"
        })
        return;
    } catch (error) {
        console.error('error logging out');
        next(error);
    }
    
}