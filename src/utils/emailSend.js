import { Resend } from 'resend';
import { ApiError } from './ApiError.js';
import { User } from '../models/user.model.js';
import { generateOTP, generateVerificationToken } from './generateTokens.js';
import { verificationEmail } from './email/verificationEmail.js';
import { passwordResetEmail } from './email/passwordReset.js';

const resend = new Resend(process.env.RESEND_API_KEY);


// types - verify email,password forgot , password change , forgot password 
// have same token for both work on password 

export async function sendEmail(type,emailId){
    
   try {
    const user = await User.findOne({email:emailId});
   
    if(!user) throw new ApiError(404,"User not found");
   

    // passanother parameter(req.pody) through register and have a if statemnt to check it is there then send another email
    if(type == "verification"){ 
      const verificationToken = generateVerificationToken(28);
      user.verifyEmailToken = verificationToken ;
      user.verifyEmailTokenExpiry = Date.now() + 1800000 ; // 30 minutes from now
        // add frontend url to the button 
        const { data, error } = await resend.emails.send({
            //from: "ClipSync <onboarding@resend.dev>",
            //from: "ClipSync <resend@clipsync.in.net>",
            from: "ClipSync <auth@resend.dhatrish.online>",
            //to: emailId,
            to:"dhatrish29@gmail.com",
            subject: "ClipSync | Verification Email",
            html: verificationEmail(user.username,verificationToken),
          });
       
          await user.save();
      
      }
   else{
         //forgotPasswordToken  and  forgotPasswordTokenExpiry
         const otp = generateOTP();
         user.forgotPasswordToken = otp;
         user.forgotPasswordTokenExpiry = Date.now() + 600000;
         const { data, error } = await resend.emails.send({
            //from: "ClipSync <onboarding@resend.dev>",
            //from: "ClipSync <auth@clipsync.in.net>",
            from: "ClipSync <auth@resend.dhatrish.online>",
            //TODO: before shipping make sure emailId is there
            //to: emailId,
            to:"official.dhatrishdixit@gmail.com",
            subject: "ClipSync | Request for Forgot Password",
            html: passwordResetEmail(otp),
          });
          console.log(data);
          console.log(error);
          await user.save();
        
      }   
   } catch (error) {
      console.log("email error in emailSend utils : ",error);
   }
  
}
