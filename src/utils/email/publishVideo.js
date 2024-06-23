export const publishEmail = (videoId,videoTitle) =>{
 console.log(`${process.env.FRONTEND_URI}/video/${videoId}`);
    
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Published</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            width: 100%;
            border: 0;
            cellspacing: 0;
            cellpadding: 0;
        }
        .header {
            padding: 20px 0;
            text-align: center;
            background-color: #28a745;
            color: #ffffff;
        }
        .content {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            padding: 20px;
            text-align: center;
            color: #999999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <table class="email-container">
        <tr>
            <td class="header">
                <h1>Congratulations!</h1>
            </td>
        </tr>
        <tr>
            <td>
                <table class="content" align="center">
                    <tr>
                        <td style="padding: 20px; text-align: center;">
                            <h2>Your Video "${videoTitle}" is Published!</h2>
                            <p>We are excited to inform you that your video has been successfully published. </p>
                            <p>Thank you for sharing your content with us!</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td class="footer">
                &copy; 2024 Clip Sync. All rights reserved.
            </td>
        </tr>
    </table>
</body>
</html>
    `
}