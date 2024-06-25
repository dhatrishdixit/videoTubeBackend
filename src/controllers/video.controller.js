import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from "fs";
import { sendEmail } from "../utils/emailSend.js"


const getAllVideos = asyncHandler(async (req, res) => {
   
    // get all videos based on query, sort, pagination
    // run a query -
    // we also check for query i.e. through which we can search from search bar 
    // also important take care of not showing videos with isPublic = false 
    // first check for page and limit 
    // sortBy - createdAt , views , duration 
    // sortType - ascending , descending 
    // sort by UserId i.e get all the videos of user
    
   try {
     const { page, limit, query, sortBy, sortType, userId, username } = req.query
     
     const pageOptions = {
         page : Number(page) || 0,
         limit : Number(limit) || 10
     }
 
     let pipelineArr = [
         {
             $match:{
                 isPublic:true
             }
         },{
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
         },{
            $addFields:{
                likes: { $size: { $ifNull: ["$likes", []] } }
            }
         }  
     ]

       
     pipelineArr.push(
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"channel"
            }
        }
    )
     pipelineArr.push(
         {
             $unwind:"$channel"
         }
     )

     //TODO: think of matching channel also 
     pipelineArr.push(
         {
             $project:{
                 _id : 1,
                 owner:1,
                 videoFile:1,
                 thumbnail:1,
                 title:1,
                 duration:1,
                 views:1,
                 channelId:"$channel._id",
                 channel:"$channel.username",
                 channelFullName:"$channel.fullName",
                 channelAvatar:"$channel.avatar",
                 createdAt:1,
                 likes:1,
                 description:1
             }
         }
     )
     if(username){
        pipelineArr.push(
            {
                 $match:{
                    channel:username
                 }
            }
        )
     }

          
     if(query){
        pipelineArr.push(
            {  
               $match:{
                title:{
                    $regex:query,
                    $options: 'i'
                }
               }
            }
        )
     }
 
     if(sortBy){
         if(sortType == "ascending") {
            // oldest in case of createdAt
             pipelineArr.push(
                 {
                     $sort: {
                       [sortBy]:1
                     }
                   }
             )
         }
         if(sortType == "descending") {
            // newest in case of createdAt 
             pipelineArr.push(
                 {
                     $sort: {
                       [sortBy]:-1
                     }
                   }
             )
         }
     
     }
     if(userId){
        pipelineArr.push(
            {
                $match:{
                    owner : new mongoose.Types.ObjectId(userId)
                }
            }
        )
     }
 
     const result = await Video.aggregate(pipelineArr)
     .skip(pageOptions.limit*pageOptions.page)
     .limit(pageOptions.limit)
 
      res
      .status(200)
      .json(
         new ApiResponse(
             200,
             result,
             "videos fetched successFully"
         )
      )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in querying videos"
    })
   }
})

const getAllVideosCount = asyncHandler(async (req, res) => {
    
   try {
     const { query } = req.query;

     const result = await Video.aggregate([
        {
            $match:{
                isPublic:true
            }
        },
        {  
            $match:{
             title:{
                 $regex:query,
                 $options: 'i'
             }
            }
         },
         {
            $group: {
              _id: null,
              totalCount: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,           
              totalCount: 1
            }
          }
     ])
 
  
 
      res
      .status(200)
      .json(
         new ApiResponse(
             200,
             result,
             "videos fetched successFully"
         )
      )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in querying videos"
    })
   }
})


const getSearchRecommendations = asyncHandler(async (req,res)=>{
    try {
        const {title} = req.query ;
        

        if(!title) {
            return res.
            status(200).
            json(
                new ApiResponse(
                    200,
                    "nothing searched",
                    "nothing searched"
                )
            )
        }
     
        const videoTitles = await Video.aggregate([
            {
               $match:{
                  title:{
                    $regex:title,
                    $options:'i'
                  }
               }
            },{
              $project:{
                  title:1
              }  
            }
        ])
        if(videoTitles.length == 0){
            return res.
            status(200).
            json(
                new ApiResponse(
                    200,
                    "no match",
                    "no match"
                )
            )
        }

        
      return res
      .status(200)
      .json(
         new ApiResponse(
             200,
             videoTitles,
             "videos fetched successFully"
         )
      )
       
    }catch (error){
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in querying searchRecommendation"
        })
    }
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
     const ownerEmail = req.user?.email;
     if(!ownerId ||!ownerEmail) throw new ApiError(401,"user not loggedin");
 
     const videoFile = await uploadOnCloudinary(videoFileLocalPath);
     const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
     if(!thumbnail || !videoFile) throw new ApiError(500,"uploading error when uploading either video or thumbnail to cloudinary") ;
     
     const video = await Video.create({
         videoFile:videoFile.secure_url ,
         videoFilePublicId:videoFile.public_id,
         thumbnail:thumbnail.secure_url ,
         thumbnailPublicId:thumbnail.public_id,
         owner:ownerId,
         title,
         description,
         duration:videoFile.duration ,
         isPublic:req.body.isPublic == "false" ? false : true
        
     })
     //console.log("mail sent")
     await sendEmail(res,"publishVideo",ownerEmail,video._id,video.title);
     return res
     .status(201)
     .json(
         new ApiResponse(201,video,"video is published")
     )
     // video/:videoId
     
     //TODO: send email from here 
   } catch (error) {
     res
     .status(error?.statusCode||500)
     .json({
        status:error?.statusCode||500,
        message:error?.message||"some error in publishing video"
     })
   }

})

const getVideoByIdAndWatch = asyncHandler(async (req, res) => {
   try {
     const { videoId } = req.params; 
     if(!videoId) throw new ApiError(400,"videoId missing");
     const userId = req.user?._id;


     await Video.findOneAndUpdate({
         _id: new mongoose.Types.ObjectId(videoId)
     },{
         $inc:{views:1}
     },{
         new:true
     })
    // remember aggregation pipeline doesn't change anything in data base it is just used to get data not update it in data base
    // $in
    
    const videos = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner"
                }
        },
        {
                $unwind:"$owner" 
        },
        {
               $project: {
                 views:1,
                 description:1,
                 _id:1,
                 videoFile:1,
                 thumbnail:1,
                 channel:"$owner.username",
                 channelId:"$owner._id",
                 channelEmail:"$owner.email",
                 channelName:"$owner.fullName",
                 channelAvatar:"$owner.avatar",
                 title:1,
                 createdAt:1,
                 isPublic:1,
                
                 
               }
        },
        {
                $lookup:{
                from:"subscriptions",
                localField:"channelId",
                foreignField:"channel" ,
                as: "subscribers"
                }
        },
        {
                 $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"video" ,
                    as: "likes"
                 } 
        },
        {
                 $lookup:{
                     from:"comments",
                     localField:"_id",
                     foreignField:"video",
                     as: "comments"
                 }
        },
        {
                 $addFields:{
                   subscribersCount:{
                    $size:"$subscribers"
                },
                   likesCount:{
                     $size:"$likes"
                },
                   commentsCount:{
                     $size:"$comments"
                },
                   isSubscribed:{ 
                     $in: [new mongoose.Types.ObjectId(userId), "$subscribers.subscriber"]
                },  
                   isLiked:{
                     $in: [new mongoose.Types.ObjectId(userId),
                    "$likes.likedBy"] 
                }
                } 
        }
    ])
      const video = videos[0];

     // also get info like channel subscriber count and etc check that 
     if(!video || !video?.isPublic) throw new ApiError(400,`video with this ${videoId} is not available`)
     const user = await User.findById(userId);
     
     user.watchHistory.push(videoId);
     await user.save({
        validateBeforeSave:false
     })

     res.status(200)
     .json(new ApiResponse(200,video,"got video from id"))
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in getting video by id"
    })
   }
})
const getVideoById = asyncHandler(async (req, res) => {
    try {
        // this is for getting video info and displaying it in card if its not there 
      const { videoId } = req.params
      // get video by id
  
      if(!videoId) throw new ApiError(400,"videoId missing");
      
      const video = await Video.findOne({
          _id: new mongoose.Types.ObjectId(videoId)
      })
     
      // can update this so that owner can only see through id
      if(!video || !video?.isPublic) throw new ApiError(400,`video with this ${videoId} is not available`)
 
      res.status(200)
      .json(new ApiResponse(200,video,"got video from id"))
    } catch (error) {
     res
     .status(error?.statusCode||500)
     .json({
        status:error?.statusCode||500,
        message:error?.message||"some error in getting video by id"
     })
    }
 })
 

const updateVideo = asyncHandler(async (req, res) => {
   try {
     const { videoId } = req.params
     // update video details like title, description, thumbnail
     if(!videoId) throw new ApiError(400,"videoId missing");
     
     const {title,description} = req.body ;
     const thumbnailLocalPath = req.file?.path;
     if(!title && !description && !thumbnailLocalPath)
     throw new ApiError(400,"either send updated title ,description or thumbnail");
     
     const userId = req.user._id;
     if(!userId) throw new ApiError(400,"user not logged in");
 
     const video = await Video.findById(videoId);
 
     if(!video) throw new ApiError(400,"video with this videoId is missing")
     const ownerId = video?.owner;
     const permission = JSON.stringify(ownerId) == JSON.stringify(userId);
   //  console.log(JSON.stringify(ownerId),JSON.stringify(userId))
 
     if(!permission) throw new ApiError(400,"login with owner id");
     
     if(thumbnailLocalPath){ 
         var thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
         if(video.thumbnailPublicId){
            deleteFromCloudinary(video.thumbnailPublicId)
            .catch(err=>console.log(err))
         }
     }

    
     
     const updatedObj = {};
     if(title) updatedObj.title = title;
     if(description) updatedObj.description = description;
     if(thumbnailLocalPath) {
        updatedObj.thumbnail = thumbnail.secure_url ;
        updatedObj.thumbnailPublicId = thumbnail.public_id; 
     }
     
 
     const updatedVideo = await Video.findByIdAndUpdate(
         new mongoose.Types.ObjectId(videoId),
         updatedObj,
         {
             new:true
         }
     )
 
     res.status(200)
     .json( 
         new ApiResponse(200,updatedVideo,"video updated successFully")
     ) ;
 
   } catch (error) {
     
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in updating the video"
    })

   }

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
     if(video.thumbnailPublicId){
  
        deleteFromCloudinary(video.thumbnailPublicId).catch(err=>console.log(err));
     }
     if(video.videoFilePublicId){
      
        deleteFromCloudinary(video.videoFilePublicId,"video").catch(err=>console.log(err));
     }
    // console.log(deleted)
 
     return res
     .status(200)
     .json(
         new ApiResponse(200,{info:`video : ${video.title} is deleted`},"video deleted successFully")
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in deleting a video"
    })
   }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
   try {
     const { videoId } = req.params
     // check if video is present and user  is logged in 
     // check if the owner is the one who is toggling the status
     // then if all conditions are satisfied then toggle it
     if(!videoId) throw new ApiError(400,"videoId is absent");
 
     const video = await Video.findById(videoId);
     if(!video) throw new ApiError(400,"video with this videoId is missing");
     const ownerId = video?.owner;
 
     const userId = req.user?.id;
     if(!userId)throw new ApiError(400,"user is not logged in");
 
     const permission = JSON.stringify(userId) == JSON.stringify(ownerId);
 
     if(!permission) throw new ApiError(400,"for toggling video status login with owner id");
 
     const updatedUser = await Video.findByIdAndUpdate(
         new mongoose.Types.ObjectId(videoId),
         {
             isPublic: video.isPublic? false :true  
         },
         {
             new : true 
         }
     )
     
     res
     .status(200)
     .json(
         new ApiResponse(
             200,
             updatedUser,
             `${video._id} toggle to ${video.isPublic?false:true}`
         )
     )
     
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in deleting a video"
    })
   }

})

const channelsVideo = asyncHandler(async (req,res) => {
     try {
        const {channelId} = req.params ;
        if(!channelId) throw new ApiError(400,"channelId is absent");
        const videos = await Video.aggregate([
              {
                $match:{
                    owner:new mongoose.Types.ObjectId(channelId)
                }
              },{
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"channel"
                }
              },{
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"video",
                    as:"likesCount"
                }
              },{
                $unwind:"$channel"
              },{
                $project:{
                    _id:1,
                    videoFile:1,
                    thumbnail:1,
                    owner:1,
                    title:1,
                    duration:1,
                    views:1,
                    createdAt:1,
                    description:1,
                    channel:"$channel.username",
                    channelAvatar:"$channel.avatar",
                    channelFullName:"$channel.fullName",
                    isPublic:1,
                    likesCount:{
                        $cond: { 
                            if: { $isArray: "$likesCount" }, 
                            then: { $size: "$likesCount" }, 
                            else: 0}
                    }
                }
              }
        ])
        
        res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                `got videos from channel : ${channelId}`
            )
        )
     } catch (error) {
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in fetching channel videos"
        })
     }
})
 
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getVideoByIdAndWatch,
    channelsVideo,
    getSearchRecommendations,
    getAllVideosCount
}