import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


// types - verify email,password forgot , password change , forgot password 
// have same token for both work on password 

async function sendEmail(type,sendingEmail){
    if(type == "Verification"){
        const { data, error } = await resend.emails.send({
        from: "ClipSync <onboarding@resend.dev>",
        to: ["delivered@resend.dev"],
        subject: "hello world",
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 0; text-align: center; background-color: #007bff; color: #ffffff;">
                        <h1>Email Verification</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 5px;">
                            <tr>
                                <td style="padding: 20px; text-align: center;">
                                    <h2>Thank you for signing up!</h2>
                                    <p>Please verify your email address by clicking the link below:</p>
                                    <a href="YOUR_VERIFICATION_LINK_HERE" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Click Here</a>
                                    <p>If you did not sign up for an account, please ignore this email.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px; text-align: center; color: #999999; font-size: 12px;">
                        &copy; 2024 ClipSync. All rights reserved.
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
      });
    }
    await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: ['delivered@resend.dev'],
        subject: 'hello world',
        text: 'it works!',
        attachments: [
          {
            filename: 'invoice.pdf',
            content: invoiceBuffer,
          },
        ],
        headers: {
          'X-Entity-Ref-ID': '123456789',
        },
        tags: [
          {
            name: 'category',
            value: 'confirm_email',
          },
        ],
      });

}
