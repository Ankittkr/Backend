import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async()=>{
    try {
       const connectInstance =  await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\n MongoDB connected !! DB HOST ${connectInstance.connection.host}` ,  );
    } catch (error) {
        console.log("MongoDB connection failed " , error);
        process.exit(1)
    }
}

