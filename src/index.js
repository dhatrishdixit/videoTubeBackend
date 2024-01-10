//require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'./env'
})


connectDB()
.then(()=>{
    app.on('error',(err)=>{
        console.log('ERR: ',err);
    })
    app.listen(process.env.PORT,()=>{
        console.log(`server is working on ${process.env.PORT}`)
    })
})
.catch(err=>{console.log(`server listening error :`,err)})
;