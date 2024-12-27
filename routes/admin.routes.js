import express from 'express';

//creating the instance of the router
const router = express.Router();

//importing the admin controller

import {
    allChatController,
    allMessagesController,
    allUsersController
} from '../controllers/admin.controllers.js';



//creating the routes
router.get("/");


router.post("/verify")

router.get("/logout");

router.get("/users", allUsersController);
router.get("/chats", allChatController);
router.get("/messages", allMessagesController);

router.get("/stats")






//exporting the router
export default router;