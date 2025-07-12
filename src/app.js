import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express() 

//configure cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))  

//configure body-parsing middleware 
app.use(express.json({limit : "16kb"}))  // for parsing application/json
app.use(express.urlencoded({extended:true , limit:"16kb"}))

//configure built-in middleware to serves static files 
app.use(express.static("public"))

app.use(cookieParser()) //configure to set and access of user broswer by the server

export { app }