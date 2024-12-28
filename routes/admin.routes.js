import express from 'express';

//creating the instance of the router
const router = express.Router();

//importing the admin controller

import {
    adminLoginController,
    adminLogoutController,
    allChatController,
    allMessagesController,
    allUsersController,
    getDashboardDataController
} from '../controllers/admin.controllers.js';

import { adminLoginValidator, validateErrorMessage } from '../lib/validators.js';
import { isAdminAuthenticated } from '../middlewares/auth.js';




//creating the routes

router.post("/verify", adminLoginValidator(), validateErrorMessage, adminLoginController)
router.get("/logout" , adminLogoutController);


//only admin can access the below routes so we will use the admin auth middleware
router.use(isAdminAuthenticated);

router.get("/");

router.get("/users", allUsersController);
router.get("/chats", allChatController);
router.get("/messages", allMessagesController);

router.get("/stats" , getDashboardDataController);






//exporting the router
export default router;