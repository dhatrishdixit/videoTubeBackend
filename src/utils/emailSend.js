import { Resend } from 'resend';
import { ApiError } from './ApiError.js';
import { User } from '../models/user.model.js';
import { generateOTP, generateVerificationToken } from './generateTokens.js';
import { verificationEmail } from './email/verificationEmail.js';
import { passwordResetEmail } from './email/passwordReset.js';

const resend = new Resend(process.env.RESEND_API_KEY);


// types - verify email,password forgot , password change , forgot password 
// have same token for both work on password 

export async function sendEmail(res,type,emailId,videoId){
   //TODO: think of adding res as parameter 
   // TODO: think of using this as a middleware 
   try {
    const user = await User.findOne({email:emailId});
   
    if(!user) throw new ApiError(404,"User not found");
   
    // passanother parameter(req.body) through register and have a if statement to check it is there then send another email
    if(type == "verifyEmail"){ 
      const verificationToken = generateVerificationToken(28);
      user.verifyEmailToken = verificationToken ;
      user.verifyEmailTokenExpiry = Date.now() + 1800000 ; // 30 minutes from now
        // add frontend url to the button 
        const { data, error } = await resend.emails.send({
            from: "ClipSync <auth@clipsync.dhatrish.online>",
         //TODO: before shipping make sure emailId is there
            to: emailId,
           // to:"official.dhatrishdixit@gmail.com",
            subject: "ClipSync | Verification Email",
            html: verificationEmail(user.username,verificationToken),
          });
          
          if(error) throw new ApiError(500,error,"mail error");
          await user.save();
      
      }
   else if(type ="forgotPassword"){
         //forgotPasswordToken  and  forgotPasswordTokenExpiry
         const otp = generateOTP();
         user.forgotPasswordToken = otp;
         user.forgotPasswordTokenExpiry = Date.now() + 600000;
         const { data, error } = await resend.emails.send({
            from: "ClipSync <auth@clipsync.dhatrish.online>",
            //TODO: before shipping make sure emailId is there
            to: emailId,
            //to:"official.dhatrishdixit@gmail.com",
            subject: "ClipSync | Request for Forgot Password",
            html: passwordResetEmail(otp),
          });
         //  console.log(data);
         //  console.log(error);
         if(error) throw new ApiError(500,error,"mail error in otp");
          await user.save();
        
      }
      else if(type ="publishVideo"){
         const { data, error } = await resend.emails.send({
            from: "ClipSync <auth@clipsync.dhatrish.online>",
            //TODO: before shipping make sure emailId is there
            to: emailId,
            //to:"official.dhatrishdixit@gmail.com",
            subject: "ClipSync | Request for Forgot Password",
            html: passwordResetEmail(otp),
          });
         //  console.log(data);
         //  console.log(error);
         if(error) throw new ApiError(500,error,"mail error in otp");
          await user.save();
      }   
   } catch (error) {
      res
      .status(error?.statusCode||500)
      .json({
         status:error?.statusCode||500,
         message:error||" error in email ",
         originOfError:"email send util"
      })
   }
  
}
