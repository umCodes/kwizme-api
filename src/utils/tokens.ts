import { UserPayload } from "../models/jwt";
import { database } from "..";
import { User } from "../models/User";
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { Response } from "express";
import { signature, tokenAge } from "../env";




export async function generateTokens(user: UserPayload){
    try {    
        //Get Database...
        const db = await database;
        if(!db) return console.error('database not connected');
        
        
        const usersCollection = db.collection<User>('users');
        
        //Generate refresh and access token
        const accessToken = jwt.sign(user, signature.accessToken, { expiresIn: tokenAge.accessToken });

        const refreshToken = jwt.sign(user, signature.refreshToken, { expiresIn: tokenAge.refreshToken });

        //store refresh token in db
        const hashedRefreshToken = await bcrypt.hash(refreshToken.split('.')[2], 10);                
        await usersCollection.updateOne(
                {_id: new ObjectId(user.uid) }, 
                { $push: {refresh_tokens: hashedRefreshToken } }
        );


        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        }

    } catch (error) {
        console.log("Error generating tokens: ", error);
        return;
    }
}


type Tokens = {
    refreshToken: string | JwtPayload | undefined; accessToken: string | JwtPayload | undefined;
}
export function storeInCookies(res: Response, tokens: Tokens){

    if(tokens?.accessToken)//store access token in cookie
    res.cookie("access-token", tokens.accessToken, {
        httpOnly: true,
        // secure: true,
        // sameSite: 'lax'
    });
        
    
    if(tokens?.refreshToken)//store refresh token in cookie
    res.cookie("refresh-token", tokens.refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 99,
        httpOnly: true,
        // secure: true,
        // sameSite: 'lax'
    });
    return;

}

export async function clearDBRefreshToken(uid: string, refreshToken: string){
    try {
        //Get Database...
        const db = await database;
        if(!db) return;

        const user = await db.collection<User>('users').findOne({ _id: new ObjectId(uid)});
        
        //compare each encrypted refresh token in db with .cookies['refresh-token']
        //then remove the matching one from refresh tokens list in db
        user?.refresh_tokens?.forEach(hashedtoken =>{
            //Find client's old refresh token within refresh_tokens[...hashedTokens]
            bcrypt.compare(refreshToken.split('.')[2], hashedtoken, (err, same)=>{    
                if(err || !same) return;

                //if match clear hashedtoken from refresh_tokens[...hashedTokens]
                db.collection<User>('users')
                .updateOne(
                    { _id: new ObjectId(uid)}, 
                    {$pull : {refresh_tokens: hashedtoken}}
                );
                
            })
        })
    } catch (error) {
        console.error(error)
    }
}


