import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(   // new keyword is important
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description:{
            type:String,
            required : true
        },
        duartion : {
            type:Number,
            required:true
        },
        views : {
            type:Number,
            default : 0,
        },
        isPublished : {
            type:Boolean,
            default:true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true
        },
    }
    , { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video", videoSchema) 