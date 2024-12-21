//importing the modules
import Chat from "../models/chat.model.js";

//importing the modules and files
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { emitEvent } from "../utils/emitEvent.js";
import { ALERT, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";


//creating a new group chat
const newGroupChatController = TryCatch(
    async (req, res , next) => {
    
        const {name , members} = req.body;

        if(members.length < 2){
            return next(new ErrorHandler("Group chat must have atleast 2 members" , 400));
        }

        const allMembers = [...members , req.user];
        
        const groupChatDetails = await Chat.create({
            name,
            members:allMembers,
            creator:req.user,
            groupChat:true,
        })

        const {creator} = await Chat.findById(groupChatDetails._id).populate("creator" , "name email");
        // console.log(creator);

        //emitting the event to all the members when the group chat is created 
        emitEvent(req , ALERT , allMembers , `Welcome to the group chat ${name} created by ${creator.name}`);

        //emitting the event to only the members of the group chat
        emitEvent(req , REFETCH_CHATS , members);

        return res.status(201).json({
            success:true,
            message:"Group created successfully",
        });

    }
)


//creating get my chats controller
const getMyChatsController = TryCatch(
    async (req , res , next)=>{

        const myChats = await Chat.find({ members: { $in: [req.user] } }).populate("members" , "name avatar")

        const transformedChats = myChats.map(({_id , name , groupChat , members})=>{
            return {
                _id,
                groupChat,
                avatar:groupChat ? members.slice(0 , 3).map(({avatar})=>{
                    return avatar.url
                }) : [getOtherMember(members , req.user).avatar.url],
                members:members.reduce((prev , curr)=>{

                    if(curr._id.toString() !== req.user.toString()){
                        prev.push(curr._id,)
                    }

                    return prev;

                } , []),
                name : groupChat ? name : getOtherMember(members , req.user).name,
                // lastMessage:chat.lastMessage,  //not included but can be included
            }
        })

        return res.status(200).json({
            success:true,
            chats : transformedChats
        })

    }
)




export {newGroupChatController , getMyChatsController};
