import express from 'express';
import { isAuth } from '../middlewares/auth.js';

// Create a new router instance
const router = express.Router();


//importing the controller
import {newGroupChatController , getMyChatsController} from "../controllers/chat.controllers.js";



//creating the routes
router.use(isAuth);
router.post("/new-group-chat" , newGroupChatController); 
router.get("/get-my-chats" , getMyChatsController);





export default router;