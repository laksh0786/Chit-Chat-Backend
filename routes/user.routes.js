import express from 'express';
import { isAuth } from '../middlewares/auth.js';


//importing the  middleware
import singleAvatar from '../middlewares/multer.js';


// Create a new router
const router = express.Router();


//import the user controller
import { newUserController, loginController, getPersonalProfile, logoutController, searchUserController } from "../controllers/user.controllers.js";
import { loginValidator, registerValidator, validateErrorMessage } from '../lib/validators.js';




//creating the routes
router.post("/new", singleAvatar, registerValidator(), validateErrorMessage, newUserController);
router.post("/login", loginValidator(), validateErrorMessage, loginController);


//Authenticated User Routes (User login required to access the routes)

//use the isAuth middleware before accessing the below routes (shortcut to use the middleware for all the below routes) 

//if we write at the end of all routes then then it will be executed at the end of all routes if required then only it will be executed

router.use(isAuth);
router.get("/myprofile", getPersonalProfile);
router.get("/logout", logoutController);
router.get("/search-user", searchUserController);



//export the router
export default router;