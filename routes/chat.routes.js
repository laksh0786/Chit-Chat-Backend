import express from 'express';
import { isAuth } from '../middlewares/auth.js';

// Create a new router instance
const router = express.Router();


//importing the controller
import {newGroupChatController , getMyChatsController, getMyGroupsController , addGroupMembersController, removeGroupMemberController, leaveGroupChatController} from "../controllers/chat.controllers.js";



//creating the routes
router.use(isAuth);

router.post("/new-group-chat" , newGroupChatController); 

router.get("/get-my-chats" , getMyChatsController);

router.get("/get-my-chats/groups" , getMyGroupsController);

router.put("/add-group-members" , addGroupMembersController);

router.put("/remove-group-member" , removeGroupMemberController);

router.delete("/leave-group-chat/:id" , leaveGroupChatController);




export default router;