import {v2 as cloudinary} from "cloudinary";
import fs from 'fs'

     
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
   try {
     if(!localFilePath){
        console.log('file path not found');
        return null ;
        
     }
     const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:'auto'
     })
   fs.unlinkSync(localFilePath)
     return response;

   } catch (error) {
     console.log('error while uploading in cloudinary : ',error);
     return null;
   }
}

const deleteFromCloudinary = async(public_id,resource_type="image")=>{
  
  try {
    const response = await cloudinary.uploader.destroy(public_id,{resource_type});
  } catch (error) {
    console.log("error in deleting cloudinary assets :",error);
  }


}


export { uploadOnCloudinary,deleteFromCloudinary};