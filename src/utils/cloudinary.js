import {v2 as cloudinary} from "cloudinary";
import fs from 'fs'

// unlink is the process for delete

     
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
   try {
    //uploading file to cloudinary 
     if(!localFilePath){
        console.log('file path not found');
        return null ;
        
     }
     const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:'auto'
     })
   //  console.log(response);
   //  console.log("file is successfully uploaded: ",response.url);
     
     // after file is successfully uploaded unlink the file in localstorage or operating system 
     
   // console.log("response returned from cloudinary ::",response)
   
   fs.unlinkSync(localFilePath)
     return response;

   } catch (error) {
     console.log('cloudinary error : ',error);
     return null;
   }
}

const deleteFromCloudinary = async(url)=>{
  
console.log(url)
// Split the URL by "/"
const urlParts = url.split("/");

// Find the index of "Images" in the URL parts
const imagesIndex = urlParts.indexOf("Images");

// Extract the relevant part
const desiredPart = urlParts.slice(imagesIndex, imagesIndex + 2).join("/");

// Optionally, remove the file extension
const desiredPartWithoutExtension = desiredPart.split(".")[0];
 console.log(desiredPartWithoutExtension)

  const response = await cloudinary.uploader.destroy(desiredPartWithoutExtension);
  console.log(response)
  //console.log(filePublicID,'image deleted from cloudinary',response);

}

export { uploadOnCloudinary,deleteFromCloudinary };