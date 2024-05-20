import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    getVideoByIdAndWatch,
    channelsVideo,
    getSearchRecommendations,
    getAllVideosCount
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/w/:videoId").get(getVideoByIdAndWatch);
router.route("/c/:channelId").get(channelsVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router.route("/s/search").get(getSearchRecommendations);
router.route('/result/counts').get(getAllVideosCount);

export default router