import { Resend } from 'resend';
import { ApiError } from './ApiError.js';
import { User } from '../models/user.model.js';
import { generateOTP, generateVerificationToken } from './generateTokens.js';
import { verificationEmail } from './email/verificationEmail.js';
import { passwordResetEmail } from './email/passwordReset.js';
import { publishEmail } from './email/publishVideo.js';

const resend = new Resend(process.env.RESEND_API_KEY);


// types - verify email,password forgot , password change , forgot password 
// have same token for both work on password 

export async function sendEmail(res,type,emailId,videoId,videoTitle){

   try {
   
  
    if(type == "verifyEmail"){ 
      const user = await User.findOne({email:emailId});
   
      if(!user) throw new ApiError(404,"User not found");
      const verificationToken = generateVerificationToken(28);
      user.verifyEmailToken = verificationToken ;
      user.verifyEmailTokenExpiry = Date.now() + 1800000 ;
        const { data, error } = await resend.emails.send({
            from: "ClipSync <auth@mail.dhatrish.dpdns.org>",
            to: emailId,
            subject: "ClipSync | Verification Email",
            html: verificationEmail(user.username,verificationToken),
          });
          if(error) throw new ApiError(500,error,"mail error");
          await user.save();
      
      }
   else if(type =="forgotPassword"){
         //forgotPasswordToken  and  forgotPasswordTokenExpiry
         const user = await User.findOne({email:emailId});
   
         if(!user) throw new ApiError(404,"User not found");
         const otp = generateOTP();
         user.forgotPasswordToken = otp;
         user.forgotPasswordTokenExpiry = Date.now() + 600000;
         const { data, error } = await resend.emails.send({
            from: "ClipSync <auth@mail.dhatrish.dpdns.org>",
            //TODO: before shipping make sure emailId is there
            to: emailId,
            //to:"official.dhatrishdixit@gmail.com",
            subject: "ClipSync | Request for Forgot Password",
            html: passwordResetEmail(otp),
          });
         //  console.log(data);
      
         if(error) throw new ApiError(500,error,"mail error in otp");
          await user.save();
        
      }
      else if(type =="publishVideo"){
         console.log(JSON.stringify(videoId),videoTitle);
         const { data, error } = await resend.emails.send({
            from: "ClipSync <support@mail.dhatrish.dpdns.org>",
            to: emailId,
            subject: "ClipSync | Video Published",
            html: publishEmail(videoId.toString(),videoTitle),
          });

         if(error) throw new ApiError(500,error,"mail error in publish video");
      }   
   } catch (error) {
      console.log(toString(error));
      res
      .status(error?.statusCode||500)
      .json({
         status:error?.statusCode||500,
         message:error||" error in email ",
         originOfError:"email send util"
      })
   }
  
}
