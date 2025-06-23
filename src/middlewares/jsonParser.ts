import { Request, Response, NextFunction } from "express";


export function jsonParser(req: Request, res: Response, next: NextFunction){

    const {body, file} = req.body;

    if(!body)return

    if(file) req.file = file;
    if(typeof body === 'string') req.body = JSON.parse(req.body.body);
    req.body.number = Math.round(Number(req.body.number));
    
    console.log(req.body, req.file);
    
    next()
    return
}



