import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from "./db/index.js";
import { app } from './app.js';

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("App error", error);
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`App listening at port ${process.env.PORT || 8000}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed , ERROR : ", err);
    })













/*
import express from "express"
const app = express()
;(async ()=>{
    try {
         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
         app.on("error" , (error)=>{
            console.log("Error" ,error);
            throw error
         })

         app.listen(process.env.PORT,()=>{
            console.log(`App is listening at port ${process.env.PORT}`);
         })
    } catch (error) {
        console.error("ERROR" , error);
        throw error
        
    }
})()
    */