import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, //-->remove/trim leading and trailing whitespaces
            index: true, //--->create index to the field to optimize the query and sorting process based that index
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true
        },
        coverImage: {
            type: String
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,

        }


    }
    , { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    console.log("access");
    
    return jwt.sign(
        {
            _id : this._id,
            username : this.username,
            email: this.email,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SCERET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    console.log("refresh");
    
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SCERET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)    