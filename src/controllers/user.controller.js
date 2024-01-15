import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
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
    console.log(req.body)

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

    if(existedUser){
       throw new ApiError(409,'user already exists in the dataBase')
    }
    console.log('body: ',req.body);
    console.log('file: ',req.files);
    if(!req.files.avatar){
        throw new ApiError(409,'avatar file is required')
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // here when we get req.files and dont get coverImage from  it we get the error of undefined 
  // aur yahan pur agar coverimage nhi diya hai toh woh toh undefined hoga aur hum usko property yani zeroth index ko access karenge toh milega cannot access property of undefined 
  // ? this checks only the left side of it and if it is undefined then it prevents the error('cant access property of undefined') and gives out undefined
 
  //  console.log("__________________",coverImageLocalPath)
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(409,'avatar file is required')
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

export {registerUser};