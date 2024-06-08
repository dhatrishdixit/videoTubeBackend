import { Resend } from 'resend';
import { ApiError } from './ApiError.js';
import { User } from '../models/user.model.js';
import { generateOTP, generateVerificationToken } from './generateTokens.js';
import { verificationEmail } from './email/verificationEmail.js';
import { passwordResetEmail } from './email/passwordReset.js';

const resend = new Resend(process.env.RESEND_API_KEY);


// types - verify email,password forgot , password change , forgot password 
// have same token for both work on password 

export async function sendEmail(type,emailId,username){
    
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
            from: "ClipSync <onboarding@resend.dev>",
            //to: emailId,
            to:"dhatrish29@gmail.com",
            subject: "ClipSync | Verification Email",
            html: verificationEmail(username,verificationToken),
          });
          console.log("data :",data);
          console.log("error :",error);
          await user.save();
          console.log(user);
      }
   else{
         //forgotPasswordToken  and  forgotPasswordTokenExpiry
         const otp = generateOTP();
         user.forgotPasswordToken = otp;
         user.forgotPasswordTokenExpiry = Date.now() + 600000;
         const { data, error } = await resend.emails.send({
            from: "ClipSync <onboarding@resend.dev>",
            //to: emailId,
            to:"dhatrish29@gmail.com",
            subject: "ClipSync | Request for Forgot Password",
            html: passwordResetEmail(otp),
          });
          console.log("data :",data);
          console.log("error :",error);
          await user.save();
          console.log(user);
         
      }   
   } catch (error) {
      console.log("email error : ",error);
   }
  
}
