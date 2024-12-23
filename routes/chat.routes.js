import express from 'express';
import { isAuth } from '../middlewares/auth.js';
import { attachmentsMulter } from '../middlewares/multer.js';

// Create a new router instance
const router = express.Router();


//importing the controller
import{
    newGroupChatController, 
    getMyChatsController, 
    getMyGroupsController, 
    addGroupMembersController, 
    removeGroupMemberController, 
    leaveGroupChatController, 
    sendAttachmentController, 
    getChatDetailsController,
    renameGroupChatController,
    deleteChatController,
    getMessagesController
} from "../controllers/chat.controllers.js";



//creating the routes

//middleware to check if the user is authenticated before accessing the all the below routes
router.use(isAuth);

router.post("/new-group-chat" , newGroupChatController); 

router.get("/get-my-chats" , getMyChatsController);

router.get("/get-my-chats/groups" , getMyGroupsController);

router.put("/add-group-members" , addGroupMembersController);

router.put("/remove-group-member" , removeGroupMemberController);

router.delete("/leave-group-chat/:id" , leaveGroupChatController);

router.post("/send-attachments", attachmentsMulter, sendAttachmentController);

router.get("/messages/:id" , getMessagesController);


//this is called as route chaining where we can chain same route with different methods

//get chat details , rename chat , delete chat

// /:id must be at the end of the route so that it cannot be confused with other routes eg /new-group-chat 
//in this id is considered as new-group-chat so place it at the end
router.route("/:id").get(getChatDetailsController).put(renameGroupChatController).delete(deleteChatController);

//the above is equivalent to the below code
// router.get("/:id" , fun1);
// router.put("/:id" , fun2);
// router.delete("/:id", fun3);




export default router;