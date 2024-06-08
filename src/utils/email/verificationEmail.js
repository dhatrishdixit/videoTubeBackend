export const verificationEmail = (username,verificationToken) => {
    return `<!DOCTYPE html>
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
                                <h2>Thank you ${username} for signing up!</h2>
                                <p>Please verify your email address by clicking the link below (link is valid for 30mins):</p>
                                <a href="${verificationToken}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Click Here</a>
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
    </html>`;
}