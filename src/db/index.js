import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async() =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        //console.log(connectionInstance);
        console.log(`MongoDB connected || DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log('Mongodb Error: ',error)
        process.exit(1)
    }
}

export default connectDB