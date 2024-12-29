//importing the models
import User from '../models/user.model.js'
import Chat from '../models/chat.model.js'
import Message from '../models/message.model.js'
import dotenv from 'dotenv';

dotenv.config({});

//importing the modules and the required files
import { TryCatch } from '../middlewares/error.js'
import { ErrorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';
import { cookieOptions } from '../constants/cookieOptions.js';
import { adminSecretKey as ADMIN_KEY } from '../app.js';


//admin login controller
const adminLoginController = TryCatch(
    async (req, resp, next) => {

        //fetching the secret key from request body
        const { secretKey } = req.body;

        //original secret key
        const amdinSecretKey = ADMIN_KEY;

        //checking if the secret key is correct or not
        const isMatch = secretKey === amdinSecretKey;

        //if the secret key is not correct then return the error
        if (!isMatch) return next(new ErrorHandler("Invalid Secret Key", 401));


        //if the secret key is correct then create the token
        const token = jwt.sign({ secretKey }, process.env.JWT_SECRET, { expiresIn: '7d' }); //expires in 7 days


        //return the response 
        return resp.status(200).cookie("admin-token", token, {
            ...cookieOptions,
            maxAge: 1000 * 60 * 15  //15 minutes          
        }).json({
            success: true,
            message: "Admin Authenticated Successfully , You are welcome to the admin dashboard"
        })

    }
)


//admin logout controller
const adminLogoutController = TryCatch(
    async (req , resp , next)=>{
        return resp.status(200).cookie("admin-token" , "" , {
            ...cookieOptions,
            maxAge: 0
        }).json({
            success: true,
            message: "Admin Logged Out Successfully"
        })
    }
)


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


//get admin data
const getAdminDataController = TryCatch(
    async (req , resp , next)=>{
        return resp.status(200).json({
            admin:true
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


//get dashboard stats controller
const getDashboardDataController = TryCatch(
    async (req, resp, next) => {

        const [groupCount, userCount, messageCount, totalChatsCount] = await Promise.all([
            Chat.countDocuments({ groupChat: true }),
            User.countDocuments({}),
            Message.countDocuments({}),
            Chat.countDocuments({})
        ])

        const today = new Date();

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const last7DaysMessages = await Message.find({
            createdAt: {
                $gte: last7Days,  //greater than or equal to
                $lte: today       //less than or equal to
            }
        }).select('createdAt');  //selecting only the createdAt field if we want to select all fields then we can remove this line or if we want to select only some fields then we can mention those fields

        // console.log(last7DaysMessages);
        const messages = new Array(7).fill(0);
        const dayInMilliseconds = 24 * 60 * 60 * 1000;

        //getting message chart data
        last7DaysMessages.forEach(message => {

            //getting the difference in days between the current date and the message created date
            const index = Math.floor((today.getTime() - message.createdAt.getTime()) / dayInMilliseconds);
            // console.log(index);

            //incrementing the count of messages on that day by 1 by subtracting the index from 6 as the index is in reverse order : as we get the index from current date to past date so we need to subtract it from 6 to get the correct index

            messages[6 - index]++;

        })

        const dashboardData = {
            groupCount,
            userCount,
            messageCount,
            totalChatsCount,
            messagesChart: messages
        }

        return resp.status(200).json({
            success: true,
            // message: "Dashboard Data"
            stats: dashboardData
        })
    }
)


export {
    allUsersController,
    allChatController,
    allMessagesController,
    getDashboardDataController,
    adminLoginController,
    adminLogoutController,
    getAdminDataController
};