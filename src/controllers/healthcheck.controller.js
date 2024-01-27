import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
   if(req){
    res
    .status(200)
    .json( new ApiResponse(
        200,
        {
         health:"ok",
         success:"true"
        },
        "healthStatus:good"
    ))
   }else{
     throw new ApiError(400,"healthStatus:poor")
   }
})

export {
    healthcheck
    }