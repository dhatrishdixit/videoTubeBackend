import { Router } from "express";
import { loginUser, logoutUser, refreshAccessTokenHandler, registerUser } from "../controllers/user.controller.js";
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


export default router ;
