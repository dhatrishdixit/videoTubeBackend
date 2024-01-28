import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
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
       throw new ApiError(error.statusCode||400,error.message || "error while creating a tweet") 
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
   try {
     const ownerId = req.user._id;
     if(!ownerId) throw new ApiError(400,"owner is not logged in")
     const tweets = await Tweet.aggregate([
         {
             $match:{
                 owner:new mongoose.Types.ObjectId(ownerId)
             }
         },{
             $project:{
                 content:1
             }
         }
     ]);
     
     if(tweets.length == 0) throw new ApiError(400,"no tweets")
 
     return res
     .json(
         new ApiResponse(200,tweets,"tweets fetched successfully")
     )
   } catch (error) {
    throw new ApiError(error.statusCode||400,error.message || "error while fetching tweets") 
   }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
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
        throw new ApiError(error.statusCode||400,error.message || "error while updating a tweet") 
     }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
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
      throw new ApiError(error.statusCode||400,error.message || "error while deleting a tweet") 
   }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}