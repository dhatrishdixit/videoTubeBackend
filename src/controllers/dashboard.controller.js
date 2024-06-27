import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"



const getChannelStats = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    const totalViews = await Video.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(userId)
              }
        },{
            $group:
                {
                    _id: null,
                    totalViews: {
                      $sum: "$views"
                    },
                    totalVideos:{
                        $sum:1
                    }
            }
        }
    ])

 
    const totalVideoLikes = await Like.aggregate   (
        [
          {
            $match: {
              video: { $exists: true, $ne: '' }
            }
          },
          {
            $lookup: {
              from: 'videos',
              localField: 'video',
              foreignField: '_id',
              as: 'likedVideo'
            }
          },
          { $unwind: { path: '$likedVideo' } },
          {
            $match: {
              'likedVideo.owner': new mongoose.Types.ObjectId(
                userId
              )
            }
          },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: 1 }
            }
          }
        ]
    
      );

    

    const totalCommentLikes = await Like.aggregate([
      {
        $match: {
          comment: { $exists: true, $ne: '' }
        }
      },{
        $lookup:{
          from:"comments",
          localField:"comment",
          foreignField:"_id",
          as:"commentsLikes",
        }
      },{
        $unwind:{
          path:"$commentsLikes"
        }
      },{
        $match:{
          'commentsLikes.owner':new mongoose.Types.ObjectId(userId)
        }
      }
    ])
    const totalTweetsLikes = await Like.aggregate([
      {
        $match: {
          tweet: { $exists: true, $ne: '' }
        }
      },{
        $lookup:{
          from:"tweets",
          localField:"tweet",
          foreignField:"_id",
          as:"tweetsLikes",
        }
      },{
        $unwind:{
          path:"$tweetsLikes"
        }
      },{
        $match:{
          'tweetsLikes.owner':new mongoose.Types.ObjectId(userId)
        }
      }
    ])

    const totalLikes = totalTweetsLikes.length + totalCommentLikes.length + totalVideoLikes[0].totalLikes ;
    // add total likes and total subscribers also 
    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
               channel: new mongoose.Types.ObjectId(userId)
            }
        },{
            $group:{
                _id:null,
                subscriberCount:{
                    $sum:1
                }
            }
        }
    ]);

    res.status(200)
    .json(
        new ApiResponse(200,{
            totalViews:totalViews[0].totalViews,
            totalVideos:totalViews[0].totalVideos,
            totalLikes:totalLikes,
            totalSubscribers:totalSubscribers[0].subscriberCount
        })
    )
    
}) 

const likesAnalytics = asyncHandler(async (req,res)=>{
  try {
    const userId = req.user?._id;
    if(!userId) throw new ApiError(404, "User not logged in");
    const totalVideoLikes = await Like.aggregate   (
      [
        {
          $match: {
            video: { $exists: true, $ne: '' }
          }
        },
        {
          $lookup: {
            from: 'videos',
            localField: 'video',
            foreignField: '_id',
            as: 'likedVideo'
          }
        },
        { $unwind: { path: '$likedVideo' } },
        {
          $match: {
            'likedVideo.owner': new mongoose.Types.ObjectId(
              userId
            )
          }
        }
      ]
    );
    
    const totalCommentLikes = await Like.aggregate([
      {
        $match: {
          comment: { $exists: true, $ne: '' }
        }
      },{
        $lookup:{
          from:"comments",
          localField:"comment",
          foreignField:"_id",
          as:"commentsLikes",
        }
      },{
        $unwind:{
          path:"$commentsLikes"
        }
      },{
        $match:{
          'commentsLikes.owner':new mongoose.Types.ObjectId(userId)
        }
      }
    ])
    const totalTweetsLikes = await Like.aggregate([
      {
        $match: {
          tweet: { $exists: true, $ne: '' }
        }
      },{
        $lookup:{
          from:"tweets",
          localField:"tweet",
          foreignField:"_id",
          as:"tweetsLikes",
        }
      },{
        $unwind:{
          path:"$tweetsLikes"
        }
      },{
        $match:{
          'tweetsLikes.owner':new mongoose.Types.ObjectId(userId)
        }
      }
    ])
    res.status(200)
    .json(
        new ApiResponse(200,{
          totalVideoLikes:totalVideoLikes.length,
          totalCommentLikes:totalCommentLikes.length,
          totalTweetsLikes:totalTweetsLikes.length
        },"Subscription")
    )
    
  } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in fetching like analytics"
    })
  }
})

const subscriptionPerDay = asyncHandler(async (req,res)=>{
  try {
    const userId = req.user?._id;
    const subscriptionPerDay = await Subscription.aggregate([
      {
        $match:{
          channel:new mongoose.Types.ObjectId(userId)
        }
      },

    ])
    res.status(200)
    .json(
        new ApiResponse(200,subscriptionPerDay,"Subscription")
    )
  } catch (error) {
    console.log(error)
  }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    //  Get all the videos uploaded by the channel also the isPublic false video but also 
    const userId = req.user?._id;
    const videos = await Video.aggregate([
      {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
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
    ]);
    res.status(200)
    .json(
        new ApiResponse(200,videos,"videos fetched successfully for user: ",userId)
    )
})


const getChannelPostsOrTweets = asyncHandler(async(req,res)=>{
   try {
    const ownerId = req.user?._id;
    if(!ownerId) throw new ApiError(400,"user not logged in");
    const posts = await Tweet.aggregate([
       {
         $match:{
           owner:new mongoose.Types.ObjectId(ownerId)
         }
       },{
        
          $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"tweet",
            as:"likesCount"
          }
       },{
          $project:{
            _id:1,
            tweet:1,
            createdAt:1,
            ownerId:"$owner",
            content:1,
            likesCount:{
              $cond: { 
                  if: { $isArray: "$likesCount" }, 
                  then: { $size: "$likesCount" }, 
                  else: 0}
            }
          }
       }
    ]);


    
    res.status(200)
    .json(
        new ApiResponse(200,posts,"posts fetched successfully for user: ",ownerId)
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

//TODO:get channel comments 


export {
    getChannelStats, 
    getChannelVideos,
    getChannelPostsOrTweets,
    subscriptionPerDay,
    likesAnalytics
}