import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById({ userId })
        const accessToken = generateAccessToken()
        const refreshToken = generateRefreshToken()
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

    const { username, email, password } = req.body

    if (!username || !email) {
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
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options ={
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200 , {} , "User logged  out")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser
}