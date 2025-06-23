import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../models/jwt";
import { HttpError } from "./errorHandler";
import { signature, tokenAge } from "../env";
import { storeInCookies } from "../utils/tokens";


function compareTokens(token1: string, token2: string) {
    const uid1 = (jwt.decode(token1) as UserPayload).uid;
    const uid2 = (jwt.decode(token2) as UserPayload).uid;
    return uid1 === uid2
}



export async function refreshtokens(req: Request, res: Response, next: NextFunction){
    
    //Get Tokens...
    const refreshToken = req.cookies['refresh-token'];
    const accessToken = req.cookies['access-token'];   
        
    if(!refreshToken || !accessToken) throw new HttpError('Access or Refresh Token not provided.', 400);

    if(!compareTokens(accessToken, refreshToken)) throw new HttpError('Invalid access token.', 403);

    //Extract UID
    const accessPayload = (jwt.decode(accessToken) as UserPayload);
    const refreshPayload = (jwt.decode(refreshToken) as UserPayload);

    const {uid} = (jwt.decode(refreshToken) as UserPayload);

    
    //Refresh expired tokens
    const tokens = {
        accessToken: 
        //if current date is greater than tokens expiry date, update token
        Date.now() > Number(accessPayload.exp)* 1000
                    ? 
                    jwt.sign({uid}, signature.accessToken, { expiresIn: tokenAge.accessToken })
                    : 
                    undefined,

        refreshToken: 

        //if current date is greater than tokens expiry date, update token
        Date.now() > Number(refreshPayload.exp)* 1000    ?
                    jwt.sign({uid}, signature.refreshToken, { expiresIn: tokenAge.refreshToken })
                    :
                    undefined 
    }

    //Store in cookies:
    storeInCookies(res, tokens);

    //update request cookies if token is updated
    req.cookies["access-token"] = tokens.accessToken || accessToken;
    req.cookies["refresh-token"] = tokens.refreshToken || refreshToken;
    
    return next();

}


export async function verifyTokens(req: Request, res: Response, next: NextFunction) {
    
    //Get access token
    const token = String(req.cookies["access-token"]);
    
    //Throws an error if token doesn't exist
     if(!token){
        return next(new HttpError("Please provide an access token.", 400));
    }


    //Verify token
    jwt.verify(token, signature.accessToken, async (err, decoded) =>{
        console.log(err, "no error");
        if(err) return next(new HttpError('Access Forbidden', 400));
        
        req.user = {uid: (decoded as UserPayload).uid};
        console.log(req.user);
        
        next();
        return;
    })
   
}




export function validateInput(req: Request, res: Response, next: NextFunction){
    const {email, password} = req.body;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){        
        res.status(400).json({
            message: "Email entered is invalid."
        })
        return;
    }

    if(!/^^(?=.*[A-Za-z]).{8,}$/.test(password)){
        res.status(400).json({
            message: "Password entered is invalid."
        })
        return;
    }

    next()
}
