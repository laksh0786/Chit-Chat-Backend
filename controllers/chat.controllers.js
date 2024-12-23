//importing the modules
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js"

//importing the modules and files
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { emitEvent } from "../utils/emitEvent.js";
import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { deleteFileFromCloudinary } from "../utils/cloudinary.js";


//creating a new group chat
const newGroupChatController = TryCatch(
    async (req, res, next) => {

        const { name, members } = req.body;

        if (members.length < 3) {
            return next(new ErrorHandler("Group chat must have atleast 2 members", 400));
        }

        const allMembers = [...members, req.user];

        const groupChatDetails = await Chat.create({
            name,
            members: allMembers,
            creator: req.user,
            groupChat: true,
        })

        const { creator } = await Chat.findById(groupChatDetails._id).populate("creator", "name email");
        // console.log(creator);

        //emitting the event to all the members when the group chat is created 
        emitEvent(req, ALERT, allMembers, `Welcome to the group chat ${name} created by ${creator.name}`);

        //emitting the event to only the members of the group chat
        emitEvent(req, REFETCH_CHATS, members);

        return res.status(201).json({
            success: true,
            message: "Group created successfully",
        });

    }
)


//creating get my chats controller
const getMyChatsController = TryCatch(
    async (req, res, next) => {

        const myChats = await Chat.find({ members: { $in: [req.user] } }).populate("members", "name avatar")

        const transformedChats = myChats.map(({ _id, name, groupChat, members }) => {
            return {

                _id,
                groupChat,

                avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => {
                    return avatar.url
                }) : [getOtherMember(members, req.user).avatar.url],

                members: members.reduce((prev, curr) => {

                    if (curr._id.toString() !== req.user.toString()) {
                        prev.push(curr._id,)
                    }

                    return prev;

                }, []),

                name: groupChat ? name : getOtherMember(members, req.user).name,
                // lastMessage:chat.lastMessage,  //not included but can be included
            }
        })

        return res.status(200).json({
            success: true,
            chats: transformedChats
        })

    }
)


//getting my groups controller
const getMyGroupsController = TryCatch(
    async (req, resp, next) => {

        const chats = await Chat.find({
            members: { $in: [req.user] },
            groupChat: true,
            creator: req.user
        }).populate("members", "name avatar");

        const groupsData = chats.map(({ _id, name, members, groupChat }) => {
            return {
                _id,
                groupChat,
                name,
                avatar: members.slice(0, 3).map(({ avatar }) => {
                    return avatar.url
                })
            }
        })

        return resp.status(200).json({
            success: true,
            groups: groupsData
        })

    }
)


//adding group members controller
const addGroupMembersController = TryCatch(
    async (req, resp, next) => {

        const { chatId, members } = req.body;

        if (!chatId || !members || members.length === 0) {
            return next(new ErrorHandler("Please provide chatId and members", 400));
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return next(new ErrorHandler("Chat not found", 404));
        }

        if (!chat.groupChat) {
            return next(new ErrorHandler("This is not a group chat", 400));
        }

        if (chat.creator.toString() !== req.user.toString()) {
            return next(new ErrorHandler("You are not authorized to add members", 403));
        }

        //this method is faster as all the promises are been in pending state and not have to be awaited for each promise to be resolved
        const allNewMembersPromise = members.map((member) => User.findById(member, "name"));

        //this will resolve all the promises at once and takes less time than awaiting for each promise to be resolved in a loop
        const allNewMembers = await Promise.all(allNewMembersPromise);

        //# we can also throw an error that if the user is already in the group chat and do not proceed further

        //adding only the members who are not already in the chat. It will not throw an error just only add the user which are not in the chat
        const uniqueMembers = allNewMembers.filter((member) => {
            return !chat.members.includes(member._id.toString());
        }).map(({ _id }) => _id);

        //updating the members of the chat by putting the ids of the new members
        chat.members.push(...uniqueMembers);

        if (chat.members.length > 100) {
            return next(new ErrorHandler("Members limit exceeded", 400));
        }

        await chat.save();

        const allUsersName = allNewMembers.map(({ name }) => name).join(", ");

        emitEvent(req, ALERT, chat.members, `${allUsersName} added to the group ${chat.name}`);
        emitEvent(req, REFETCH_CHATS, chat.members);


        return resp.status(200).json({
            success: true,
            message: "Members added successfully"
        })

    }
)



//removing group member controller
const removeGroupMemberController = TryCatch(
    async (req, resp, next) => {

        //getting the userId and chatId from the body
        const { userId, chatId } = req.body;

        //if the userId or chatId is not provided then throw an error
        if (!userId || !chatId) {
            return next(new ErrorHandler("Please provide userId and chatId", 400));
        }

        //finding the chat and user by their id
        const [chat, removedUser] = await Promise.all([
            Chat.findById(chatId),
            User.findById(userId)
        ])

        //if user is not found then throw an error
        if (!removedUser) {
            return next(new ErrorHandler("User not found", 404));
        }

        //if chat is not found then throw an error
        if (!chat) {
            return next(new ErrorHandler("Chat not found", 404));
        }

        //if the chat is not a group chat then throw an error
        if (!chat.groupChat) {
            return next(new ErrorHandler("This is not a group chat", 400));
        }

        //if the user is not the creator of the chat then throw an error
        if (chat.creator.toString() !== req.user.toString()) {
            return next(new ErrorHandler("You are not authorized to remove members", 403));
        }

        //maintaing the minimum number of members in the chat
        if (chat.members.length <= 3) {
            return next(new ErrorHandler("Group must have atleast 3 members", 400));
        }

        //if user is not in the chat then throw an error
        if (!chat.members.includes(userId)) {
            return next(new ErrorHandler("User is not in the group", 400));
        }


        //removing the member from the chat
        chat.members = chat.members.filter((member) => member.toString() !== userId.toString());

        //saving the chat
        await chat.save();


        //emit the event to all the members of the chat
        emitEvent(req, ALERT, chat.members, `${removedUser.name} removed from the group ${chat.name}`);

        //refetch the chats
        emitEvent(req, REFETCH_CHATS, chat.members);


        return resp.status(200).json({
            success: true,
            message: "Member removed successfully"
        })

    }
)




//leave the group chat controller
const leaveGroupChatController = TryCatch(
    async (req, resp, next) => {

        const chatId = req.params.id;

        if(!chatId){
            return next(new ErrorHandler("Please provide chatId", 400));
        }

        const chat = await Chat.findById(chatId);

        //if chat is not found then throw an error
        if(!chat){
            return next(new ErrorHandler("Chat not found", 404));
        }

        //if chat is not a group chat then throw an error
        if(!chat.groupChat){
            return next(new ErrorHandler("This is not a group chat", 400));
        }

        //if user is not in the group chat
        if(!chat.members.includes(req.user.toString())){
            return next(new ErrorHandler("You are not added in the group" , 400));
        }

        //finding reamining members in the chat
        const remainingMembers = chat.members.filter((member)=>{
            return member.toString() !== req.user.toString();
        })

        if(remainingMembers.length < 3){
            return next(new ErrorHandler("Group must have atleast 3 members", 400));
        }

        //if the user is the creator of the chat
        if(chat.creator.toString() === req.user.toString()){

            //if the creator is leaving the chat then assign the new creator to the chat 
            //randomly from the remaining members
            const randomNumber = Math.floor(Math.random() * remainingMembers.length);
            const newCreator = remainingMembers[randomNumber];

            //updating the creator of the chat
            chat.creator = newCreator;
        }

        //updating the members of the chat
        chat.members = remainingMembers;

        //saving the chat and finding the user who is leaving the chat
        const [user] = await Promise.all([
            User.findById(req.user , "name"),
            chat.save()
         ]);

        //emit the event to all the members of the chat
        emitEvent(req, ALERT, chat.members, `${user.name} left the group ${chat.name}`);


        return resp.status(200).json({
            success:true,
            message:"Left the group chat successfully"
        })

    }
)




//send attachment controller
const sendAttachmentController = TryCatch(
    async (req , resp , next)=>{

        const {chatId} = req.body;

        const [chat , user] = await Promise.all([
            Chat.findById(chatId),
            User.findById(req.user , "name avatar")
        ]);

        if(!chat){
            return next(new ErrorHandler("Chat not found", 404));
        }

        const files = req.files || [];

        if(files.length < 1){
            return next(new ErrorHandler("Please provide attachments", 400));
        }


        //Upload files to cloudinary 
        const attachments = []


        //message for real time 
        const messageRealTime = {
            sender : {
                _id:user._id,
                name:user.name,
                avatar:user.avatar.url  //optional but can be included
            },
            chat : chatId,
            attachments,
            content:"",
        }


        //message for the db
        const messageDb = {
            sender : req.user,
            chat : chatId,
            attachments,
            content:"",
        }

        //saving the message to the db
        const message = await Message.create(messageDb);

        //emitting the new attachment event to all the members of the chat
        emitEvent(req , NEW_ATTACHMENT , chat.members , {
            message:messageRealTime,
            chatId
        });

        //emitting the new message alert to all the members of the chat
        emitEvent(req , NEW_MESSAGE_ALERT , chat.members , {chatId});

        return resp.status(200).json({
            success:true,
            message
        })
    }
)


//get messages controller


//get chat details 
const getChatDetailsController = TryCatch(
    async (req , resp , next)=>{

        if(req.query.populate === "true"){

            //lean method is used to convert the mongoose document to plain javascript object
            const chat = await Chat.findById(req.params.id).populate("members", "name avatar").lean();

            if(!chat){
                return next(new ErrorHandler("Chat not found", 404));
            }

            //without lean method we cannot modify the object unless we convert it to plain javascript object or change in the db
            chat.members = chat.members.map(({_id , name , avatar})=>{
                return { 
                    _id,
                    name,
                    avatar:avatar.url
                }
            })

            return resp.status(200).json({
                success:true,
                chat
            })

        } else{

            const chat = await Chat.findById(req.params.id);

            if(!chat){
                return next(new ErrorHandler("Chat not found", 404));
            }

            return resp.status(200).json({
                success:true,
                chat
            })

        }
    }
)


//rename the group chat controller
const renameGroupChatController = TryCatch(
    async (req , resp , next)=>{

        const chatId = req.params.id;
        const {name} = req.body;

        if(!name){
            return next(new ErrorHandler("Please provide name", 400));
        }

        const chat = await Chat.findById(chatId);

        if(!chat){
            return next(new ErrorHandler("Chat not found", 404));
        }

        if(!chat.groupChat){
            return next(new ErrorHandler("This is not a group chat", 400));
        }

        if(chat.creator.toString() !== req.user.toString()){
            return next(new ErrorHandler("You are not authorized to rename the chat", 403));
        }

        //updating the name of the chat
        chat.name = name;

        
        //saving the chat
        await chat.save();

        //emit the refetch chat event to all the members of the chat
        emitEvent(req , REFETCH_CHATS , chat.members);

        return resp.status(200).json({
            success:true,
            message:"Group renamed successfully"
        })

    }
);


//delete chat controller
const deleteChatController = TryCatch(
    async (req , resp , next)=>{

        const chatId = req.params.id;

        //finding the chat by id
        const chat = await Chat.findById(chatId);

        //if chat is not found then throw an error
        if(!chat){
            return next(new ErrorHandler("Chat not found", 404));
        }

        const members = chat.members;

        if(chat.groupChat &&  chat.creator.toString() !== req.user.toString()){
            return next(new ErrorHandler("You are not authorized to delete the chat", 403));
        }

        if(!chat.groupChat && !chat.members.includes(req.user.toString())){
            return next(new ErrorHandler("You are not authorized to delete the chat", 403));
        }

        //delete all the messages and attachments on the cloudinary of the chat

        //finding all the messages with attachments in the chat
        const messageWithAttachments = await Message.find({
            chat:chatId,
            attachments:{$exists:true , $ne:[]} //attachments exists and not qual to empty array
        });

        const public_ids = [];

        //pushing all the public ids of the attachments of all the messages in the chat to the public_ids array
        messageWithAttachments.forEach(({attachments})=>{
            attachments.forEach(({ public_id })=>{
                public_ids.push(public_id);
            })
        })

        //deleting the chat , messages and attachments from the cloudinary
        await Promise.all([
            deleteFileFromCloudinary(public_ids),
            chat.deleteOne(),
            Message.deleteMany({chat:chatId})
        ])

        //emitting the event
        emitEvent(req , REFETCH_CHATS , members);

        //returning the response
        return resp.status(200).json({
            success:true,
            message:"Chat deleted successfully"
        })


    }
)



export {
    newGroupChatController,
    getMyChatsController,
    getMyGroupsController,
    addGroupMembersController,
    removeGroupMemberController,
    leaveGroupChatController,
    sendAttachmentController,
    getChatDetailsController,
    renameGroupChatController,
    deleteChatController
};
