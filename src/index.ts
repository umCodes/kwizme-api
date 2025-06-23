import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './error/error';
import { PORT } from './env';
import { connectToDB } from './db/dbConfig';
import { authRouter } from './routes/authRoutes';
import { refreshtokens, validateInput, verifyTokens } from './middlewares/authHandler';
import { quizRoutes } from './routes/quizRoutes';
import { userRoutes } from './routes/userRoutes';


const app = express();


app.use(cors({ origin: String(process.env.ORIGIN), credentials: true }));

app.use(cookieParser());
app.use(express.json());


app.use('/auth', authRouter);
app.use(refreshtokens, verifyTokens);


app.use('/api', quizRoutes);
app.use('/', userRoutes);





app.use(errorHandler);

export const database = (async () =>{
    const db = await connectToDB();
    if(db)
        app.listen(PORT, () => console.log(`Server runnig on port ${PORT}`));    
    return db;
})();

