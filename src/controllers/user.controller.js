import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something wwnt wrong while genrating the accesss and refresh token")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    // get user data from the frontend
    // validate -- if fields are empty
    // check if the user alredy exists bse don username and email
    // check  for images , avatar
    // upload on cloudinary
    // create user object and create entry  to db
    // remove password and refresh token fileds from res
    // return res

    const { username, password, email, fullname } = req.body
    console.log("log req.body \n", req.body);

    if (
        [username, password, email, fullname].some((field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const isUserExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (isUserExists) {
        throw new ApiError(409, "username or email already exist")
    }

    console.log("Files req log : \n", req.files);

    const avatarLocalPath = req.files?.avatar?.at(0)?.path;
    const coverImageLocalPath = req.files?.coverImage?.at(0)?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar field is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar field is required")
    }
    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""

    })

    const UserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!UserCreated) {
        throw ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, UserCreated, "User created/registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // get login credentals ---> req.body --> username , passwaord , email
    // check for empty fields
    // check user exists
    // password compare
    // genrate access and refresh tokens
    // send cookie

    console.log("hello req body \n", req.body);

    const { email, username, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "No user found")
    }

    const isValidPassword = await user.isCorrectPassword(password)

    if (!isValidPassword) {
        throw new ApiError(400, "Invalid user credentals")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"

            )
        )








})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged  out")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedRefreshToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SCERET)

        const user = await User.findById(decodedRefreshToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessToken()

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isValidPassword = await user.isCorrectPassword(oldPassword)

    if (!isValidPassword) {
        throw new ApiError(400, "Password is incorrect")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                user,

            },
            "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname && !email) {
        throw new ApiError(400, "Fullname or email canot be empty")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select(
        "-password -refreshToken"
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User Accout details updated successfully")
        )

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Error occured while uploading the avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover Image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500, "Error occured while uploading the coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if(!username?.trim()){
        throw new ApiError(400 ,"username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                subscribeToChannelCount:{
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if :{$in : [req.user?._id , "$subscribers.subscriber"] },
                        then : true,
                        else : false
                    }
                }
                
            }
        },
        {
            $project : {
                "fullname" : 1,
                "username" : 1,
                "email" : 1,
                "avatar" : 1,
                "coverImage" : 1,
                "subscribersCount" : 1,
                "isSubscribed" : 1,
                "subscribeToChannelCount" : 1

            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404 , "No channel found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200 , channel[0] , "Channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id :  mongoose.Types.ObjectId.createFromHexString(req.user?._id.toString())
            }
        },
        {
            $lookup : {
                from :"videos",
                localField : "watchHistory",
                foreignField:"_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project :{
                                        fullname: 1,
                                        username : 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                           owner : {
                            $first : "$owner"
                           }
                        }
                    }
                ]
            }
        }
    ])

    console.log(user);
    
    return res
    .status(200)
    .json(
        new ApiResponse(200 ,{ watchHistory : user[0].watchHistory } , "watch history fetched successfully")
    )
    
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}