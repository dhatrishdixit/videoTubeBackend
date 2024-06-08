import { Router } from "express";
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessTokenHandler,
    registerUser, 
    updateCoverImage, 
    updateCurrentUser, 
    updateUserAvatar,
    verifyEmail,
    sendEmailForPasswordOtp,
    verifyOtp,
    resetPassword,
    sendVerificationEmail
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route('/register').post(upload.fields([
    {
        name:'avatar',
        maxCount:1
    },
    {
        name:'coverImage',
        maxCount:1
    }
]),registerUser)

router.route('/login').post(loginUser);

//secured
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/refresh-token').post(refreshAccessTokenHandler);
router.route('/password-change').post(verifyJWT,changeCurrentPassword);
router.route('/get-current-user').get(verifyJWT,getCurrentUser);
router.route('/update-user').patch(verifyJWT,updateCurrentUser);
router.route('/update-avatar').patch(verifyJWT,upload.single('avatar'),updateUserAvatar);
router.route('/update-coverImage').patch(verifyJWT,upload.single('coverImage'),updateCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);
router.route("/watch-history").get(verifyJWT,getWatchHistory);
router.route("/verify-email").post(verifyEmail);
router.route("/send-email-for-password-otp").post(sendEmailForPasswordOtp);
router.route("/verify-otp").post(verifyOtp);
router.route("/reset-password").post(resetPassword);
router.route("/send-email-for-verification").post(sendVerificationEmail);

export default router ;
