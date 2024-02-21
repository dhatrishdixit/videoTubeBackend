import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const options = {
    httpOnly:true,
    secure:true
}


async function generateRefreshAndAccessToken(userId){

    try{
        const user =await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // try updateOne 
        user.refreshToken = refreshToken;
        await user.save({
           validateBeforeSave:false
        })
        return {accessToken,refreshToken};
    }
    catch(err){
        console.log('ERROR : ',err)
        throw new ApiError(500,'not able to generate tokens ')
    }

}

const registerUser = asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username,email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { username,fullName,email,password } = req.body ;

    if([username,fullName,email,password].some(field => field?.trim() == "")){
        throw new ApiError(400,"all fields should be filled")
    }

    const existedUser =await User.findOne({
     $or:[
        {
           username
        },{
           email
        }
     ]   
    })

    if(!req.files.avatar){
        throw new ApiError(409,'avatar file is required')
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(409,'avatar file is required')
    }
  
    if(existedUser){
       fs.unlinkSync(req.files?.avatar[0]?.path)  
       if(req.files.converImage){
         fs.unlinkSync(req.files?.coverImage[0]?.path)
       }
      
       throw new ApiError(409,'user already exists in the dataBase')
    }
    // console.log('body: ',req.body);
    // console.log('file: ',req.files);
   
    
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // here when we get req.files and dont get coverImage from  it we get the error of undefined 
  // aur yahan pur agar coverimage nhi diya hai toh woh toh undefined hoga aur hum usko property yani zeroth index ko access karenge toh milega cannot access property of undefined 
  // ? this checks only the left side of it and if it is undefined then it prevents the error('cant access property of undefined') and gives out undefined
 
  //  console.log("__________________",coverImageLocalPath)

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage;
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    const user =await User.create({
         username:username.toLowerCase(),
         email,
         fullName,
         avatar:avatar.url,
         coverImage:coverImage?.url||"",
         password,
    })
    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if(!createdUser) throw new ApiError(500,'user not registered try again ')

    return res.status(201).json(
        new ApiResponse(201,createdUser,'user registered successfully')
    )

    
}) 

// const registerUser =async function (req,res){
//     //    const result = await new Promise((resolve,reject)=>{
//     //     setTimeout(()=>{
//     //         resolve('hello')
//     //     },5000)
//     //    })
//        res.status(200).json({
//         status:'ok',
//         // message:result
//        })
// }

const loginUser = asyncHandler(async(req,res)=>{
     // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie


    const {email,username,password} = req.body ;
   // console.log(req.body)
    if(!(email || username)) throw new ApiError(400,' either username or email both required')
    
    const user =await User.findOne({
        $or:[{username},{email}]
    })
    if(!user) throw new ApiError(404,'user not found');
   // console.log(user)
    const passwordCheck = await user.isPasswordCorrect(password);

    if(!passwordCheck) throw new ApiError(401,'password is incorrect')
    
    const {accessToken,refreshToken} = await generateRefreshAndAccessToken(user._id);
    
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken -updatedAt -__v');

 
     
    return res
    .status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {   
                user:  loggedInUser ,
                Token : accessToken
            },
            'user loggedIn successfully'
        )
    )

})



const logoutUser = asyncHandler(async (req,res)=>{
      const userId = req.user._id ;
      await User.findByIdAndUpdate(
        userId,
        {
           $unset:{
            refreshToken:1
           } 
        },{
            new:true
        }
      )
      
 
    
    return res
    .status(201)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(
        new ApiResponse(201,{},"user logged out")
    )
})

const refreshAccessTokenHandler = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.header?.refreshToken;
  //  console.log(incomingRefreshToken);
    if(!incomingRefreshToken) throw new ApiError(401,"refreshToken is absent")

      let decodedToken ;
       try {
          decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
       } catch (error) {
          console.log('error at decoding ',error.message)
       }

//console.log(decodedToken)
    const user = await User.findById(decodedToken?.id).select("-password");
    // console.log(user)
    if(!user){
        throw new ApiError(401,'invalid refresh token');
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"refreshToken is expired");
    }

    const {accessToken,newRefreshToken} = await generateRefreshAndAccessToken(user._id);

    return res
    .status(201)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',newRefreshToken,options)
    .json(
        new ApiResponse(201,
            {
           user,accessToken
        },
        "accessToken refreshed")
    )
    
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
   try {
    const {oldPassword,newPassword} = req.body;
    
    if(!newPassword) throw new ApiError(400,'enter new password');
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) throw new ApiError(400,"old password is wrong");

    user.password = newPassword ;
    await user.save({
        validateBeforeSave:false
    });
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "password changed successfully"
        )
    )

   } catch (error) {
      res.status(error?.statusCode).json({
        message:error?.message
      })
   }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    try {
        res
        .status(201)
        .json(
            new ApiResponse(
                201,
                req.user,
                "user fetched successfully"
            )
        )

    } catch (error) {
        res
        .status(error?.statusCode)
        .json({
            message:error?.message
        })
    }
});

const updateCurrentUser = asyncHandler(async(req,res)=>{
     try {
         const {firstName,email} = req.body;
         if(!firstName && !email) throw new ApiError(400,"nothing changed")
         if(!req.user) throw new ApiError(400,"user not logged in");
         const user = await User.findByIdAndUpdate(
            req.user?._id,{
                $set:{
                    firstName,
                    email
                }
            },
            {
                new:true
            }
         ).select("-password");

         res
         .status(201)
         .json(
            new ApiResponse(
                201,
                user,
                "user updated"
            )
         )
     } catch (error) {
        res.status(error.statusCode)
        .json({
            message:error?.message
        })
     }
      
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
   
    if(!avatarLocalPath) throw new ApiError(400,"avatar is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url) throw new ApiError(500,"file failed to load in cloudinary");

    
    const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
         $set:{
               avatar:avatar.url,
         }
    },{
        new:true
     }).select("-password");
     await deleteFromCloudinary(avatar.public_id);
     res.status(200)
     .json(
        new ApiResponse(200
            ,{
                user:updatedUser
            },
            "avatar is updated and previous is deleted from cloudinary")
     )
});

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath) throw new ApiError(400,"coverImage is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url) throw new ApiError(500,"file failed to load in cloudinary");

    
    const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
         $set:{
            coverImage:coverImage.url,
         }
    },{
        new:true
     }).select("-password");
     await deleteFromCloudinary(coverImage.public_id);
     res.status(200)
     .json(
        new ApiResponse(200
            ,{
                user:updatedUser
            },
            "coverImage is updated and previous is deleted from cloudinary")
     )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {

    const {username} = req.params;
    if(!username?.trim()) throw new ApiError(400,"username not passed");
    
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.trim().toLowerCase(),
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel" ,
                as: "subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"channelsSubscribedTo"
            }
        },{
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$channelsSubscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
               username:1,
               fullName:1,
               avatar:1,
               coverImage:1,
               email:1,
               subscriberCount:1,
               subscribedToCount:1,
               isSubscribed:1
            }
        }
    ]);

    console.log(channel)

    if(!channel) throw new ApiError(400,"failed to get channel Info")

    res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"info fetched successfully")
    )
});

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    
    res
    .status(200)
    .json(new ApiResponse(
        200
        ,user[0].watchHistory
        ,"watch history fetched perfectly"
        ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessTokenHandler,
    changeCurrentPassword,
    getCurrentUser,
    updateCurrentUser,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
};