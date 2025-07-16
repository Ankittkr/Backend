import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../controllers/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1

        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)  //   http://localhost:8000/api/v1/users/register


router.route("/login").post(loginUser)


// secure routes
router.route("/logout").post(
    verifyJwt ,
    logoutUser
)

export default router

