//importing the  models
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import Request from "../models/request.model.js";

//importing the modules and files
import bcrypt from 'bcrypt';
import sendToken from "../utils/jsonwebtoken.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { cookieOptions } from "../constants/cookieOptions.js";
import { emitEvent } from "../utils/emitEvent.js"
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";


//creating a new user and saving it to the database and save in cookie
export const newUserController = TryCatch(
    async (req, res, next) => {

        //fetching the data from the request body
        const { name, email, password, bio } = req.body;

        //checking if the user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return next(new ErrorHandler("User Already Exists", 400));
        }

        const file = req.file;
        // console.log("FIle " , file);

        if (!file) {
            return next(new ErrorHandler("Please Upload Avatar", 400));
        }

        //uploading the file to the cloudinary
        const result = await uploadFilesToCloudinary([file]);

        // console.log(result)

        const avatar = {
            public_id: result[0].public_id,
            url: result[0].url
        };

        //hashing the password before saving it to the database
        // const hashedPassword = await bcrypt.hash(password , 10); //done using moongoose middleware

        //create a new user
        const user = await User.create({
            name,
            email,
            password,
            bio,
            avatar,
        })

        sendToken(res, user, 201, "User Created");

    }
)


//login the user controller and send the token
export const loginController = TryCatch(
    async (req, resp, next) => {

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid Username", 404))  //directly error middleware will be called
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return next(new ErrorHandler("Invalid Password", 404));
        }

        sendToken(resp, user, 200, `Welcome back ${user.name}`);

    }
)


//getting my profile
export const getPersonalProfile = TryCatch(
    async (req, resp, next) => {

        const user = await User.findById(req.user);
        // console.log(user);

        //if user is not found then return error
        if (!user) {
            return next(new ErrorHandler("User Not Found", 404));
        }

        resp.status(200).json({
            success: true,
            user
        })
    }
)


//logout the user controller
export const logoutController = TryCatch(
    async (req, resp, next) => {
        return resp.status(200).cookie("token", null, {
            ...cookieOptions,
            maxAge: 0
        }).json({
            success: true,
            message: "User Logged Out Successfully"
        })
    }
)


//search the user controller
export const searchUserController = TryCatch(

    async (req, resp, next) => {

        const { page = 1 } = req.query;
        const name = req.query.name?.trim() || "" ;
        
        const resPerPage = 5;
        const skip = (page - 1) * resPerPage;

        // console.log(name, page);

        //finding all my chats which are not group chats and i am a member of that chat
        const myChats = await Chat.find({
            groupChat: false,
            members: { $in: [req.user] }
        });

        //fetching all the friends including me or users with whom i have chatted with
        const allFriendsSet = new Set(myChats.map((chat) => chat.members).flat());  //flat is used to convert 2d array to 1d array

        allFriendsSet.add(req.user); // Add the requesting user to the set to exclude them


        //finding all the users who are not in the above array i.e all the users who are not my friends
        const [usersExceptMeAndMyFriends, totalUsers] = await Promise.all([
            User.find({
                _id: { $nin: Array.from(allFriendsSet) },
                name: { $regex: name, $options: "i" } //$regex is used to search for the name pattern and $options is used to make the search case insensitive
            }).skip(skip).limit(resPerPage).select("_id name avatar"),

            User.countDocuments({
                _id: { $nin: Array.from(allFriendsSet) },
                name: { $regex: name, $options: "i" }
            })

        ])


        //modifying the response to only send the required fields of all not friends
        const allNotFriends = usersExceptMeAndMyFriends.map(({ _id, name, avatar }) => {
            return {
                _id,
                name,
                avatar: avatar.url || ""
            }
        })

        const totalPages = Math.ceil(totalUsers / resPerPage) || 0;  //total number of pages required to show all the messages


        return resp.status(200).json({
            success: true,
            users: allNotFriends,
            totalPages
        })

    }
)


//send friend request controller
export const sendFriendRequestController = TryCatch(
    async (req, resp, next) => {

        //fetching the userId from the request body
        const { userId } = req.body;


        //checking if the user is sending request to himself
        if (userId === req.user.toString()) {
            return next(new ErrorHandler("You cannot send request to yourself", 400));
        }

        //checking if user is already a friend
        const chat = await Chat.findOne({
            members: { $all: [userId, req.user] }
        })

        if (chat) {
            return next(new ErrorHandler("User is already a friend", 400));
        }

        //checking the request is already sent before
        const request = await Request.findOne({
            $or: [
                { sender: req.user, receiver: userId },
                { sender: userId, receiver: req.user }
            ]
        })

        //if request is already sent then return error
        if (request) {
            return next(new ErrorHandler("Request Already Sent", 400));
        }

        //if request is not sent then create a new request
        await Request.create({
            sender: req.user,
            receiver: userId
        })

        //emitting the new request event
        emitEvent(req, NEW_REQUEST, [userId]);


        //return the response
        return resp.status(200).json({
            success: true,
            message: "Friend Request Sent Successfully"
        })

    }
)



//accept friend request controller
export const acceptFriendRequestController = TryCatch(
    async (req, resp, next) => {

        //fetching the request id from the request body
        const { requestId, accept } = req.body;

        //finding the request
        const request = await Request.findById(requestId).populate("sender", "name").populate("receiver", "name");

        //if request is not found then return error
        if (!request) {
            return next(new ErrorHandler("Request Not Found", 404));
        }

        //if request is found then check if the request is for the user
        if (request.receiver._id.toString() !== req.user.toString()) {
            return next(new ErrorHandler("You are not authorized to accept the request", 401));
        }

        //check if user has to accept the request
        if (!accept) {
            await request.deleteOne();
            return resp.status(200).json({
                success: true,
                message: "Friend Request Declined Successfully"
            })
        }

        //if user has to accept the request then create a new chat
        const members = [request.sender._id, request.receiver._id];


        //creating the chat and deleting the request
        await Promise.all([
            Chat.create({
                members,
                name: `${request.sender.name}-${request.receiver.name}`,
            }),
            request.deleteOne()
        ])

        //emitting the refetch chat event
        emitEvent(req, REFETCH_CHATS, members);


        //return the response
        return resp.status(200).json({
            success: true,
            message: "Friencd Request Accepted Successfully",
            senderId: request.sender._id
        })

    }
)


//get all the notfications of the user
export const getAllMyNotificationsController = TryCatch(
    async (req, resp, next) => {

        //finding all the requests of the user
        const requests = await Request.find({
            receiver: req.user
        }).populate("sender", "name avatar");

        //transforming the response
        const allRequests = requests.map(({ _id, sender }) => {
            return {
                _id,
                sender: {
                    _id: sender._id,
                    name: sender.name,
                    avatar: sender.avatar.url
                }
            }
        })

        //return the response
        return resp.status(200).json({
            success: true,
            allRequests
        })

    }
)



//get all the friends of the user
export const getMyFriendsController = TryCatch(
    async (req, resp, next) => {

        //to get the friends who are the friends of the user but not in the chat
        const { chatId } = req.query;

        //fetching all the chats of the user which are not group chats and i am a member of that chat
        const chats = await Chat.find({
            groupChat: false,
            members: { $in: [req.user] }
        }).populate("members", "name avatar");


        //getting all the friends of the user
        const friends = chats.map(({ members }) => {
            const friend = getOtherMember(members, req.user);
            return {
                _id: friend._id,
                name: friend.name,
                avatar: friend.avatar.url
            }
        })

        if (chatId) {

            //find that chat whose id is given 
            const chat = await Chat.findById(chatId);

            //if chat is not found then return error
            if (!chat) {
                return next(new ErrorHandler("Chat Not Found", 404));
            }

            //fetch all the friends who are friends of the user but not in the chat
            const availableFriends = friends.filter((friend) => {
                return !chat.members.includes(friend._id)
            })

            //return the response
            return resp.status(200).json({
                success: true,
                afriends: availableFriends
            })

        } else {

            //in this case we return all the friends of the user
            return resp.status(200).json({
                success: true,
                friends
            })
        }

    }
)



