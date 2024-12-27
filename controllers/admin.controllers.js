//importing the models
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js'

//importing the modules and the required files
import { TryCatch } from '../middlewares/error.js'


//get all users controller
const allUsersController = TryCatch(
    async (req, resp, next) => {

        //finding all the users
        const users = await User.find({});


        //getting the required data _id , avatar url , name , email , no of friends , no of groups 
        const transformedUsers = await Promise.all(
            users.map(async ({ _id, avatar, name, email }) => {

                const [friends, groups] = await Promise.all([
                    Chat.countDocuments({ members: { $in: _id }, groupChat: false }),
                    Chat.countDocuments({ members: { $in: _id }, groupChat: true })
                ])

                return {
                    _id,
                    avatar: avatar.url,
                    name,
                    email,
                    friends,
                    groups
                }
            })
        )

        //return the response
        return resp.status(200).json({
            success: true,
            users: transformedUsers
        })

    }
)



//get all chats controller
const allChatController = TryCatch(
    async (req, resp, next) => {

        //finding all the chats
        const chats = await Chat.find({})
            .populate('members', 'name avatar')
            .populate('creator', 'name avatar');

        //trnasforming the data
        const transformedChats = await Promise.all(chats.map(async ({ _id, members, groupChat, name, creator }) => {

            //getting total messages in each chat
            const totalMessages = await Message.countDocuments({ chat: _id });


            return {
                _id,
                groupChat,
                name,

                avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),

                members: members.map(({ _id, name, avatar }) => {
                    return {
                        _id: _id,
                        name: name,
                        avatar: avatar.url
                    }
                }),

                creator: {
                    _id: creator?._id || "",
                    name: creator?.name || "NONE",
                    avatar: creator?.avatar?.url || ""
                },

                totalMembers: members.length,

                totalMessages: totalMessages
            }

        }))

        //return response
        return resp.status(200).json({
            success: true,
            chats: transformedChats
        })

    }
)



//get all messages controller
const allMessagesController = TryCatch(
    async (req, resp, next) => {

        //finding all the messages
        const messages = await Message.find({})
            .populate('sender', 'name avatar')
            .populate('chat', 'groupChat');

        //transforming the data
        const transformedMessages = messages.map(({ _id, sender, chat, content, createdAt, attachments }) => {

            return {
                _id,
                sender: {
                    _id: sender._id,
                    name: sender.name,
                    avatar: sender.avatar.url
                },
                chat: chat._id,
                groupChat: chat.groupChat,
                attachments,
                content,
                createdAt
            }
        })


        //returning the resposne 
        return resp.status(200).json({
            success: true,
            messages: transformedMessages
        })
    }
)



export { allUsersController, allChatController, allMessagesController };