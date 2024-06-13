export const passwordResetEmail = (otp) => {
    //TODO: important have frontend site link in environment variable
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forgot Password OTP</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #28a745; color: #ffffff;">
                    <h1>Forgot Password</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 5px;">
                        <tr>
                            <td style="padding: 20px; text-align: center;">
                                <h2>Reset Your Password</h2>
                                <p>Use the following One-Time Password (OTP) to reset your password (OTP will expire in 10 mins):</p>
                                <p style="font-size: 24px; font-weight: bold; color: #333333;">${otp}</p>
                                <p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
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
    </html>
    `;
}