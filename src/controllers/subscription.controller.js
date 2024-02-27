import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // toggle subscription
    if(!channelId) throw new ApiError(400,"no channel id");
    const user = req.user ;
    if(!user) throw new ApiError(400,"user not logged in");
    
    let subscription = await Subscription.findOne({
        subscriber:user?._id,
        channel:channelId
    });
    if(!subscription){
       subscription = await Subscription.create({
           subscriber:user?._id,
           channel:channelId
       })
       return res
       .status(200)
       .json( new ApiResponse(200,subscription,"user subscribed"))
    }else{
        const result = await Subscription.deleteOne({
           _id:subscription._id 
        });
        return res
       .status(200)
       .json( new ApiResponse(200,result,"user unsubscribed"))
    }
    
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    
    if(!channelId) throw new ApiError(400,"channelId missing");
 //  console.log(isValidObjectId(channelId)?channelId : new mongoose.Types.ObjectId(channelId))
   try {

     const subcriberList = await Subscription.aggregate([
        {
          $match: {
            channel: new mongoose.Types.ObjectId(channelId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscribers",
          },
        },
        {
          $unwind: "$subscribers"
        },
        {
          $project: {
            _id: 0, // Exclude _id field from the result if you don't need it
            channel: 1,
            subscriber: "$subscribers._id",
            username: "$subscribers.username",
            fullName: "$subscribers.fullName",
            avatar: "$subscribers.avatar",
          },
        },
      ]
      );

     return res
     .status(200)
     .json(new ApiResponse(200,subcriberList,"subscribers found"))
   } catch (error) {
   // console.log(error);
     throw new ApiError(400,"error while fetching subscriber list")
   }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if(!subscriberId) throw new ApiError(400,"subscriberId is missing") ;
    try {
        const channelList = await Subscription.aggregate([
             {
                $match:{
                    subscriber:new mongoose.Types.ObjectId(subscriberId)
                }
             },{
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"channels"
                }
             },{
                $unwind:"$channels"
             },{
                $project:{
                    subscriber:1,
                    channelId:"$channels._id",
                    channelName:"$channels.username",
                    channelFullName:"$channels.fullName",
                    channelAvatar:"$channels.avatar"
                }
             }
        ]);
        if(channelList.length === 0) throw new ApiError(400,"channel is empty");
        return res
        .status(200)
        .json(
            new ApiResponse(200,channelList,"channel list is fetched")
        )
    } catch (error) {
        throw new ApiError(
            error.statusCode || 400
            ,error?.message || "error which fetching channel list")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}