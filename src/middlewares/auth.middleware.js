import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/ayncHandler.js";
import jwt from "jsonwebtoken"
export const verifyJwt = asyncHandler(async (req, _ , next) => { 
    // replaced res with _ if not used
    //get token from either  cookies or from header
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.split(' ')[1] // Authorization: Bearer <token>
    
        if (!token) {
            throw new ApiError(401, "Access denied. Unauthorized access No token provided.")
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SCERET)
    
        const user =  await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if (!user) {
            throw ApiError(401 , "Invalid access token" )
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "invalid access token")
    }

})