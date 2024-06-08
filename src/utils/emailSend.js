import { Resend } from 'resend';
import { ApiError } from './ApiError.js';
import { User } from '../models/user.model.js';
import { generateVerificationToken } from './generateTokens.js';
import { verificationEmail } from './email/verificationEmail.js';

const resend = new Resend(process.env.RESEND_API_KEY);


// types - verify email,password forgot , password change , forgot password 
// have same token for both work on password 

export async function sendEmail(type,emailId,username){
    
   try {
    const user = await User.findOne({email:emailId});
    const verificationToken = generateVerificationToken(16);
    if(!user) throw new ApiError(404,"User not found");
   
    user.verifyEmailToken = verificationToken ;
    user.verifyEmailTokenExpiry = Date.now() + 1800000 ; // 30 minutes from now



    
    if(type == "verification"){
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
   } catch (error) {
      console.log("email error : ",error);
   }
  
}
