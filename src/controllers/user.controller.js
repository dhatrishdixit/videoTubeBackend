import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import { sendEmail } from '../utils/emailSend.js';
import { generateVerificationToken } from '../utils/generateTokens.js';



const accessTokenCookieOptions = {
    httpOnly:true,
    secure:process.env.NODE_ENV === "PRODUCTION" ?true:false,
    SameSite:process.env.NODE_ENV === "PRODUCTION" ? "None":"Lax",
    expires: new Date(
        Date.now() + process.env.ACCESS_TOKEN_COOKIE_EXPIRY * 24 * 60 * 60 * 1000
      ),
       //Cookie Expire is in days so we convert it in milliseconds to add it to date
}

const refreshTokenCookieOptions = {
    httpOnly:true,
    secure:process.env.NODE_ENV === "PRODUCTION" ?true:false,
    SameSite:process.env.NODE_ENV === "PRODUCTION" ? "None":"Lax",
    expires: new Date(
        Date.now() + process.env.REFRESH_TOKEN_COOKIE_EXPIRY * 24 * 60 * 60 * 1000
      ),

}

// const options = {
//     httpOnly: true ,
//     secure: true ,
// }


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
     //   console.log('ERROR : ',err)
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

  try {
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
          throw new ApiError(400,'avatar file is required')
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
         if(req.files.coverImage){
           fs.unlinkSync(req.files?.coverImage[0]?.path)
         }
        
         throw new ApiError(409,'user already exists in the dataBase')
      }
  
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
           avatarPublicId:avatar?.public_id,
           coverImagePublicId:coverImage?.public_id
      })
      const createdUser = await User.findById(user._id).select('-password -refreshToken');
    // think of oauth later 
    //TODO: send email when verified pass jwt token to the cookie
    // create token and date - fill those field in data base 
    // give the link to user via email and all so right email is valid for 30 mins 
    // then when user hits /verifyEmail or something ,with the same values of token , and check whether the date milliseconds are less than the set or something
    // if times up then do something same 
    // for password 
    // based on that verify 
  
      if(!createdUser) throw new ApiError(500,'user not registered try again ');

     
      await sendEmail("verification",createdUser.email);
  
      return res.status(201).json(
          new ApiResponse(201,createdUser,'user registered successfully & verification mail sent')
      )
  
  } catch (error) {
    
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in registering user ",
       originOfError:"user controller"
    })

  }
    
}) ;

const sendVerificationEmail = asyncHandler(async(req,res)=>{
    
try {
        //TODO: dont directly send email from input box rather take it from user if response is of status > or something indicating correct response and based on that you have to have to send the data through navigation or something like that or just simply give the email recieved from the server therefore changing the email doesnt changes our output 
        //TODO:
        const {email} = req.body;
        if(!email) throw new ApiError(400,'email is required for verification mail ');
        
        await sendEmail("verification",email);
        return res.status(200).json(
            new ApiResponse(200,'verification mail sent')
        )
} catch (error) {
         
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in sending verification email ",
       originOfError:"user controller"
    })

}


})


const loginUser = asyncHandler(async(req,res)=>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and referesh token
    // send cookie


  try {
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
      .cookie('accessToken',accessToken,accessTokenCookieOptions)
      .cookie('refreshToken',refreshToken,refreshTokenCookieOptions)
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
  } catch (error) {

    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in logging in user ",
       originOfError:"user controller"
    })

  }

})



const logoutUser = asyncHandler(async (req,res)=>{
   try {
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
   } catch (error) {
      
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in logging out user ",
       originOfError:"user controller"
    })
   }
})

const refreshAccessTokenHandler = asyncHandler(async(req,res)=>{
 try {
       const incomingRefreshToken = req.cookies?.refreshToken || req.header?.refreshToken;
      
       if(!incomingRefreshToken) throw new ApiError(401,"refreshToken is absent")
   
         let decodedToken ;
             decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
  

       const user = await User.findById(decodedToken?.id).select("-password");
     
       if(!user){
           throw new ApiError(401,'invalid refresh token');
       }
       if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401,"refreshToken is expired");
       }
   
       const {accessToken,newRefreshToken} = await generateRefreshAndAccessToken(user._id);
   
       return res
       .status(201)
       .cookie('accessToken',accessToken,accessTokenCookieOptions)
       .cookie('refreshToken',newRefreshToken,refreshTokenCookieOptions)
       .json(
           new ApiResponse(201,
               {
              user,accessToken
           },
           "accessToken refreshed")
       )
       
 } catch (error) {
    
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in refresh access token user ",
       originOfError:"user controller"
    })
 }
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
   
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in registering user ",
       originOfError:"user controller"
    })
   }
});

const sendEmailForPasswordOtp = asyncHandler(async(req,res)=>{
    try {
       
       
        const {email} = req.body;
        if(!email) throw new ApiError(400,"email is absent");

  

        await sendEmail("Reset Password",email);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {},
                "otp send successfully successfully"
            )
        )


    } catch (error) {
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||" error in sending email for password otp ",
           originOfError:"user controller"
        })
    }
})

const verifyOtp = asyncHandler(async(req,res)=>{
    try{
       const { otp } = req.body;
       if(!otp) throw new ApiError(400,"otp is absent");

       const user = await User.findOne({
        forgotPasswordToken:otp
       });

       if(!user) throw new ApiError(400,"invalid otp");

       if(Date.now()>user.forgotPasswordTokenExpiry){
         await sendEmail("Reset Password",user.email);
         throw new ApiError(410,"otp has expired and a new otp has been sent through email");
       }
       
       user.resetPasswordAccess = generateVerificationToken(30);
       user.forgotPasswordToken = null;
       user.forgotPasswordTokenExpiry = null;
       await user.save({
        validateBeforeSave:false
       })

       res.status(200).json(new ApiResponse(200,{
        success:true,
        resetPasswordAccess: user.resetPasswordAccess,
       },'otp verified successfully'))    
    }
    catch(error){
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in registering user ",
           originOfError:"user controller"
        })
    }
});

const resetPassword = asyncHandler(async(req,res)=>{
    try {
     const {newPassword,confirmNewPassword,resetPasswordAccess} = req.body;
     // verify otp is true or false 
     if(!resetPasswordAccess) throw new ApiError(400,'verify otp first');
     if(!newPassword || !confirmNewPassword) throw new ApiError(400,'enter both password');
    
     const user = await User.findOne({resetPasswordAccess});
 
     const isPasswordCorrect = newPassword == confirmNewPassword ;
     if(!isPasswordCorrect) throw new ApiError(400,"both password don't match");
 
     user.password = newPassword ;
     user.resetPasswordAccess = null;
     await user.save({
         validateBeforeSave:false
     });
     
     return res
     .status(200)
     .json(
         new ApiResponse(
             200,
             {success:"true"},
             "password changed successfully"
         )
     )
 
    } catch (error) {
    
     res
     .status(error?.statusCode||500)
     .json({
        status:error?.statusCode||500,
        message:error?.message||"some error in registering user ",
        originOfError:"user controller"
     })
    }
 });


const verifyEmail = asyncHandler(async(req,res)=>{
    try {
        const { token } = req.body;
        if(!token) throw new ApiError(403,"verifyToken is absent")
        const user = await User
                           .findOne({ verifyEmailToken : token})
                           .select("-password -refreshToken -accessToken");
    
        if(!user) throw new ApiError(400,"invalid token");
        
        if(Date.now()>user.verifyEmailTokenExpiry){
        await sendEmail("verification",user.email);
        throw new ApiError(410," verify token has expired and a new verification mail has been sent please verify");
        }
  
    
        user.isVerified = true ;
        user.verifyEmailToken = "" ;
        user.verifyEmailTokenExpiry="";
        
        await user.save({
            validateBeforeSave:false
        });
        //console.log(user);
       
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "email verified successfully"
            )
        )
    } catch (error) {
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in getting verifying user email ",
           originOfError:"user controller"
        })
    }

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    if(!req.user) throw new ApiError(401,"user authentication cookie not found");
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
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in getting current user ",
           originOfError:"user controller"
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
        res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in updating current user ",
       originOfError:"user controller"
    })
     }
      
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  try {
      const user = req.user;
      if(!user) throw new ApiError(400,"user not logged in")
      const avatarLocalPath = req.file?.path;
     
      if(!avatarLocalPath) throw new ApiError(400,"avatar is missing")
  
      const avatar = await uploadOnCloudinary(avatarLocalPath);
      if(!avatar.url) throw new ApiError(500,"file failed to load in cloudinary");
      
      if(user.avatarPublicId){
        await deleteFromCloudinary(user.avatarPublicId);
      }
      
      const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
           $set:{
                 avatar:avatar.url,
                 avatarPublicId:avatar.public_id
           }
      },{
          new:true
       }).select("-password");
       
       res.status(200)
       .json(
          new ApiResponse(200
              ,{
                  user:updatedUser
              },
              "avatar is updated and previous is deleted from cloudinary")
       )
  } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in updating user avatar",
       originOfError:"user controller"
    })
  }
});

const updateCoverImage = asyncHandler(async(req,res)=>{
   try {
     const user = req.user ;
     if(!user) throw new ApiError(400,"user not logged in ")
     const coverImageLocalPath = req.file?.path;
     if(!coverImageLocalPath) throw new ApiError(400,"coverImage is missing")
 
     const coverImage = await uploadOnCloudinary(coverImageLocalPath);
     if(!coverImage.url) throw new ApiError(500,"file failed to load in cloudinary");
    
      if(user.coverImagePublicId) await deleteFromCloudinary(user.coverImagePublicId);
     
     const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
          $set:{
             coverImage:coverImage.url,
             coverImagePublicId:coverImage.public_id
          }
     },{
         new:true
      }).select("-password");
      
      res.status(200)
      .json(
         new ApiResponse(200
             ,{
                 user:updatedUser
             },
             "coverImage is updated and previous is deleted from cloudinary")
      )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in updating cover image of user ",
       originOfError:"user update updateCoverImage controller"
    })
   }
})

const getUserChannelProfile = asyncHandler(async(req,res) => {

try {   
        
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
                $lookup:{
                    from:"videos",
                    localField:"_id",
                    foreignField:"owner",
                    as:"videos"
                }
            },{
                $lookup:{
                    from:"tweets",
                    localField:"_id",
                    foreignField:"owner",
                    as:"tweet"
                }
            },{
                $lookup:{
                    from:"playlist",
                    localField:"_id",
                    foreignField:"owner",
                    as:"playlist"
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
                    },
                    videos: { $size: { $ifNull: ["$videos", []] } },
                    tweets: { $size: { $ifNull: ["$tweets", []] } },
                    playlists: { $size: { $ifNull: ["$playlist", []] } }
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
                   isSubscribed:1,
                   videos:1,
                   tweets:1,
                   playlists:1
               
                }
                
            }
        ]);
    

    
        if(!channel) throw new ApiError(400,"failed to get channel Info")
    
        res
        .status(200)
        .json(
            new ApiResponse(200,channel[0],"info fetched successfully")
        )
} catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in getting in user channel profile"
    })   
}
});

const getWatchHistory = asyncHandler(async(req,res)=>{
    try {
            const user = await User.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(req.user?._id)
                    }
                },
                {
                    $lookup: {
                        from: "videos",
                        localField: "watchHistory",
                        foreignField: "_id",
                        as: "watchHistory",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "owner",
                                    foreignField: "_id",
                                    as: "owner",
                                    pipeline: [
                                        {
                                            $project: {
                                                fullName: 1,
                                                username: 1,
                                                avatar: 1
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields:{
                                    owner:{
                                        $first: "$owner"
                                    }
                                }
                            }
                        ]
                    }
                }
            ])
        
        res
        .status(200)
        .json(new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched perfectly"
            ))
    } catch (error) {
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in getting in user watch history"
        })   
    }
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
    getWatchHistory,
    verifyEmail,
    sendEmailForPasswordOtp,
    verifyOtp,
    resetPassword,
    sendVerificationEmail
};