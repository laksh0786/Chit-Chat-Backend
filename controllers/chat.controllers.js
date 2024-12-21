//importing the modules
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

//importing the modules and files
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { emitEvent } from "../utils/emitEvent.js";
import { ALERT, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";


//creating a new group chat
const newGroupChatController = TryCatch(
    async (req, res, next) => {

        const { name, members } = req.body;

        if (members.length < 2) {
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

        const groupsData  = chats.map(({ _id, name, members , groupChat }) => {
            return {
                _id , 
                groupChat , 
                name , 
                avatar: members.slice(0,3).map(({avatar})=>{
                    return avatar.url
                })
            }
        })

        return resp.status(200).json({
            success:true,
            groups:groupsData
        })

    }
)


//adding group members controller
const addGroupMembersController = TryCatch(
    async (req , resp , next)=>{

        const {chatId , members} = req.body;

        if(!chatId || !members || members.length === 0){
            return next(new ErrorHandler("Please provide chatId or members", 400));
        }

        const chat = await Chat.findById(chatId);

        if(!chat){
            return next(new ErrorHandler("Chat not found", 404));
        }

        if(!chat.groupChat){
            return next(new ErrorHandler("This is not a group chat", 400));
        }

        if(chat.creator.toString() !== req.user.toString()){
            return next(new ErrorHandler("You are not authorized to add members", 403));
        }

        //this method is faster as all the promises are been in pending state and not have to be awaited for each promise to be resolved
        const allNewMembersPromise = members.map((member)=> User.findById(member , "name"));

        //this will resolve all the promises at once and takes less time than awaiting for each promise to be resolved in a loop
        const allNewMembers = await Promise.all(allNewMembersPromise);

        //# we can also throw an error that if the user is already in the group chat and do not proceed further
        
        //adding only the members who are not already in the chat. It will not throw an error just only add the user which are not in the chat
        const uniqueMembers = allNewMembers.filter((member)=>{
            return !chat.members.includes(member._id.toString());
        }).map(({_id})=>_id);

        //updating the members of the chat by putting the ids of the new members
        chat.members.push(...uniqueMembers);

        if(chat.members.length > 100){
            return next(new ErrorHandler("Members limit exceeded", 400));
        }

        await chat.save();

        const allUsersName = allNewMembers.map(({name})=>name).join(", ");

        emitEvent(req , ALERT , chat.members , `${allUsersName} added to the group ${chat.name}`);
        emitEvent(req , REFETCH_CHATS , chat.members);


        return resp.status(200).json({
            success:true,
            message:"Members added successfully"
        })

    }
)


export { newGroupChatController, getMyChatsController, getMyGroupsController , addGroupMembersController };
