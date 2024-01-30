import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
   try {
     // get all comments for a video
     const {videoId} = req.params
     console.log(videoId)
     const {page, limit} = req.query;
     
     const pageOptions = {
         page: parseInt(page, 10) || 0,
         limit: parseInt(limit, 10) || 15
     }
     if(!videoId) throw new ApiError(400,"video id is absent");
    
     // console.log()
    // no point of checking for video further database calls 
     const comments = await Comment.aggregate([
        {
         $match:{
             video:new mongoose.Types.ObjectId(videoId)
         }
        }
     ]).skip(pageOptions.page * pageOptions.limit).limit(pageOptions.limit);
     //console.log(comments)
     if(comments.length == 0) throw new ApiError(400,"no comments found");
     
     res.status(200)
     .json(
        new ApiResponse(
         200,
         comments,
         "comments fetched successfully"
        )
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while getting video comments",
       originOfError:"comment controller"
    })
   }

})

const addComment = asyncHandler(async (req, res) => {
try {
        //  add a comment to a video
    
        const {videoId} = req.params;
        const owner = req.user?._id;
        const {content} = req.body;
        
        if(!owner) throw new ApiError(400,"login to post comment")
        if(!content) throw new ApiError(400,"cant post comment without content")
        if(!videoId) throw new ApiError(400,"video id not present");
        const video = await Video.aggregate([
            {
                $match:{
                    isPublic:true
                }
            },{ 
                $match:{
                    _id:new mongoose.Types.ObjectId(videoId)
                }
                
            }
        ]);
    
        if(!video) throw new ApiError(404,"video with this id not available");
    
        const comment = await Comment.create({
              content,
              video:videoId,
              owner
        })
    
        res.status(200)
        .json(
            new ApiResponse(
                200
                ,comment
                ,"comment is posted")
        )
    
} catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while create comments",
       originOfError:"comment controller"
    })   
}
})

const updateComment = asyncHandler(async (req, res) => {
  try {
      //  update a comment
      const {commentId} = req.params;
      const userId = req.user?._id;
      const {content}= req.body ;
      const updatedContent = content;
      
      if(!userId) throw new ApiError(400,"login to post comment")
      if(!updatedContent) throw new ApiError(400,"cant update comment without new content")
      if(!commentId) throw new ApiError(400,"comment id is not present");
  
      const comment = await Comment.findById(commentId);
      if(!comment) throw new ApiError(404,"comment with this id is not present");
  
      const permission = JSON.stringify(comment?.owner) == JSON.stringify(userId);
      if(!permission) throw new ApiError(400,"login with owner id");
      
      const updatedComment = await Comment.findByIdAndUpdate(
          commentId,
          {
              content:updatedContent
          },{
              new:true
          }
      )
      
      res.status(200)
      .json(
          new ApiResponse(
              200,
              updatedComment,
              "comment is updated"
              )
      )
  } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while updating video comments",
       originOfError:"comment controller"
    })
  }
})

const deleteComment = asyncHandler(async (req, res) => {
   try {
     // delete a comment
     const {commentId} = req.params;
     const userId = req.user?._id;
    
     
     if(!userId) throw new ApiError(400,"login to post comment")
  
     if(!commentId) throw new ApiError(400,"comment id is not present");
 
     const comment = await Comment.findById(commentId);
     if(!comment) throw new ApiError(404,"comment with this id is not present");
 
     const permission = JSON.stringify(comment?.owner) == JSON.stringify(userId);
     if(!permission) throw new ApiError(400,"login with owner id");
 
     await Comment.findByIdAndDelete(commentId);
     
     res.status(200)
     .json(
         new ApiResponse(200,{
             deletedComment:commentId,
             success:true
         },
         "comment deleted"
         )
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while deleting video comments",
       originOfError:"comment controller"
    })
   }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }