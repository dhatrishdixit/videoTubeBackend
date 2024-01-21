import { Router } from "express";
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessTokenHandler,
    registerUser, 
    updateCoverImage, 
    updateCurrentUser, 
    updateUserAvatar
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
router.route('/update-user').post(verifyJWT,updateCurrentUser);
router.route('/update-avatar').post(verifyJWT,upload.single('avatar'),updateUserAvatar);
router.route('/update-coverImage').post(verifyJWT,upload.single('coverImage'),updateCoverImage)


export default router ;
