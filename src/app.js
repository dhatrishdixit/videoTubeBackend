import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';


const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN
}));

app.use(express.json({
    limit:'16kb'
}));
app.use(cookieParser());
app.use(express.urlencoded({
    extended:true,
    limit:'16kb'
}));
app.use(express.static('public'));

// importing routes 
import userRouter from './routes/user.routes.js';

// activating routes 
app.use('/api/v1/users',userRouter);
 

export { app };