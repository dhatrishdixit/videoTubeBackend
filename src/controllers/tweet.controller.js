import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // create tweet
    try {
       const {content} = req.body;
       if(!content) throw new ApiError(400,"content is missing")
       const owner = req.user?._id ;
       if(!owner) throw new ApiError(400,"user not logged in")
       
       const tweet = await Tweet.create({
        content,
        owner
       })
       
       return res
       .status(200)
       .json(
        new ApiResponse(200,tweet,"tweet posted successfully")
       )
       
    } catch (error) {
        res
        .status(error.statusCode)
        .json({
           status:error.statusCode,
           message:error.message
        })
    }
})


const getUserTweetsByUsername = asyncHandler(async (req, res) => {
    // this is the userTweets under use
    // get user tweets
   try {
     const ownerUsername = req.params.username;
     const userId = req.user._id;
    // console.log(ownerUsername)
     if(!userId) throw new ApiError(400,"user not logged in")
     if(!ownerUsername) throw new ApiError(400,"owner username is not there")

     const tweets = await Tweet.aggregate([
         {
             $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"  
             }
         },{
            $unwind:"$owner"
         },{
            $match:{
                "owner.username":ownerUsername
            }
         },{
             $project:{
                 ownerUsername:"$owner.username",
                 ownerAvatar:"$owner.avatar",
                 ownerFullname:"$owner.fullName",
                 ownerId:"$owner._id",
                 createdAt:1,
                 content:1,
                 _id:1 
             }
         },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes"
            }
         },{
            $addFields:{
                isLiked:{
                    $in:[new mongoose.Types.ObjectId(userId),"$likes.likedBy"]
                },
                likes:{
                    $size:"$likes"
                }
            }
         }
     ]);
   
     

 
     return res
     .json(
         new ApiResponse(200,
             tweets
            ,"tweets fetched successfully")
     )
   } catch (error) {
    res
    .status(error.statusCode || 500)
    .json({
       status:error.statusCode || 500,
       message:error.message || "some error in finding tweets by a username "
    })
   }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // get user tweets
   try {
     const userId = req.user._id;
     if(!userId) throw new ApiError(400,"owner is not logged in")
     const tweets = await Tweet.aggregate([
         {
             $match:{
                 owner:new mongoose.Types.ObjectId(userId)
             }
         },{
             $project:{
                 content:1,
                 owner:1
             }
         }
     ]);
     
     if(tweets.length == 0) throw new ApiError(400,"no tweets")
 
     return res
     .json(
         new ApiResponse(200,tweets,"tweets fetched successfully")
     )
   } catch (error) {
    res
    .status(error.statusCode)
    .json({
       status:error.statusCode,
       message:error.message
    })
   }
})


const updateTweet = asyncHandler(async (req, res) => {
    // update tweet
    try {
        const {tweetId} = req.params;
        if(!tweetId) throw new ApiError(400,"tweetId is absent");
        const oldTweet = await Tweet.findById(new mongoose.Types.ObjectId(tweetId));
        const  oldContent = oldTweet.content;
        const {content} = req.body;
        
        if(!content) throw new ApiError(400,"content is not there")
        const tweet = await Tweet.findByIdAndUpdate(
            new mongoose.Types.ObjectId(tweetId),
            {
                content
            },
            {
                new:true
            }
            );
            return res
            .status(200)
            .json(
             new ApiResponse(200,{oldContent,tweet},"tweet updated successfully")
            )
    } catch (error) {
        res
        .status(error.statusCode)
        .json({
           status:error.statusCode,
           message:error.message
        })
     }
})

const deleteTweet = asyncHandler(async (req, res) => {
    // delete tweet
   try {
     const {tweetId} = req.params;
     if(!tweetId) throw new ApiError(400,"tweetId is absent");
     const result = await Tweet.deleteOne({
         _id : new mongoose.Types.ObjectId(tweetId)
     })
 
     return res.
     status(200)
     .json(
         new ApiResponse(200,result,"tweet deleted successFully")
     )
   } catch (error) {
    res
    .status(error.statusCode)
    .json({
       status:error.statusCode,
       message:error.message
    })
   }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getUserTweetsByUsername
}