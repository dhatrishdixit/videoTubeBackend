import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from "fs";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    // get video, upload to cloudinary, create video
    //req.user - user , check if there or not 
    //title , description , check if there not 
    //upload file on multer , check if there not 
    //local path from multer and upload it on cloudinary 
    //find video length etc from cloudinary 
    //if there is anything in is public then also update that 

   try {
     const { title, description } = req.body

     if(!req.files.videoFile || !req.files.thumbnail){
        if(req.files.videoFile){
            fs.unlinkSync(req.files?.videoFile[0]?.path)
        }
        if(req.files.thumbnail){
            fs.unlinkSync(req.files?.thumbnail[0]?.path)
        }
        throw new ApiError(401,"either videoFile or thumbnail is missing");
     }
     const videoFileLocalPath = req.files?.videoFile[0]?.path;
     const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

     if(!title || !description){
        if(videoFileLocalPath){
            fs.unlinkSync(videoFileLocalPath)
        }
        if(thumbnailLocalPath){
            fs.unlinkSync(thumbnailLocalPath)
        }
        throw new ApiError(401,"cannot publish video without title and description");
     }
     
     const ownerId = req.user?._id ;
     if(!ownerId) throw new ApiError(401,"user not loggedin");
 
     const videoFile = await uploadOnCloudinary(videoFileLocalPath);
     const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
     if(!thumbnail || !videoFile) throw new ApiError(500,"uploading error when uploading either video or thumbnail to cloudinary") ;
     
     const video = await Video.create({
         videoFile:videoFile.secure_url ,
         thumbnail:thumbnail.secure_url ,
         owner:ownerId,
         title,
         description,
         duration:videoFile.duration ,
         isPublic:req.body.isPublic == "false" ? false : true
     })
     
     return res
     .status(201)
     .json(
         new ApiResponse(201,video,"video is published")
     )
   } catch (error) {
     res
     .status(error.statusCode||500)
     .json({
        status:error.statusCode||500,
        message:error.message||"some error in publishing video"
     })
   }

})

const getVideoById = asyncHandler(async (req, res) => {
   try {
     const { videoId } = req.params
     // get video by id
 
     if(!videoId) throw new ApiError(400,"videoId missing");
     
     const video = await Video.findOneAndUpdate({
         _id: new mongoose.Types.ObjectId(videoId)
     },{
         $inc:{views:1}
     },{
         new:true
     })
     if(!video && !video?.isPublic) throw new ApiError(400,`video with this ${videoId} is not available`)
     res.status(200)
     .json(new ApiResponse(200,video,"got video from id"))
   } catch (error) {
    res
    .status(error.statusCode||500)
    .json({
       status:error.statusCode||500,
       message:error.message||"some error in getting video by id"
    })
   }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId) throw new ApiError(400,"videoId missing");

})

const deleteVideo = asyncHandler(async (req, res) => {
    // delete video
   try {
     const { videoId } = req.params
     
     if(!videoId) throw new ApiError(400,"videoId missing");
     
     if(!req.user) throw new ApiError(400,"user not loggedIn");
 
     const userId = req.user._id;
     const video = await Video.findById(videoId);
     if(!video) throw new ApiError(400,"video with this videoId is missing")
     const ownerId = video?.owner;
     // console.log(new String(userId));
     // console.log(JSON.stringify(ownerId));
 
     if(JSON.stringify(ownerId) !== JSON.stringify(userId)) throw new ApiError(400,"login with owner id")
 
     const deleted = await Video.findByIdAndDelete(new mongoose.Types.ObjectId(videoId));
     console.log(deleted)
 
     return res
     .status(200)
     .json(
         new ApiResponse(200,{info:`video : ${video.title} is deleted`},"video deleted successFully")
     )
   } catch (error) {
    res
    .status(error.statusCode||500)
    .json({
       status:error.statusCode||500,
       message:error.message||"some error in deleting a video"
    })
   }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}