import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async (req,res,next)=>{
     try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
      //   console.log("cookie",token);
        if(!token) throw new ApiError(401,'unauthorized request')
   
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
   
        const user =await User.findById(decodedToken?._id).select('-password -refreshToken ');
   
        if(!user){
           throw new ApiError(401,"Invalid Access Token");
        }
       
        req.user = user ;
        next();
     } catch (error) {
      res
      .status(error?.statusCode||500)
      .json({
         status:error?.statusCode||500,
         message:error?.message||"access token not present"
      })
     }

})

