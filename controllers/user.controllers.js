//importing the  models
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";

//importing the modules and files
import bcrypt from 'bcrypt';
import sendToken from "../utils/jsonwebtoken.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { cookieOptions } from "../constants/cookieOptions.js";


//creating a new user and saving it to the database and save in cookie
export const newUserController = TryCatch(
    async (req, res) => {

        //fetching the data from the request body
        const { name, email, password, bio } = req.body;

        const avatar = {
            public_id: "sndisnd",
            url: "https://res.cloudinary.com/djxkexzvz/image/upload/v1633660137/avatars/avataaars"
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
        console.log(user);

        resp.status(200).json({
            success: true,
            user
        })
    }
)


//logout the user controller
export const logoutController = TryCatch(
    async (req, resp) => {
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

        const { name = "" } = req.query;

        //finding all my chats which are not group chats and i am a member of that chat
        const myChats = await Chat.find({
            groupChat: false,
            members: { $in: [req.user] }
        });

        //fetching all the friends including me or users with whom i have chatted with including me
        const allFriends = myChats.map((chat) => {
            return chat.members;
        }).flat()  //flat method is used to convert 2d array to 1d array and parameter is the depth of the array which means how many levels of array to flatten


        //finding all the users who are not in the above array i.e all the users who are not my friends
        const usersExceptMeAndMyFriends = await User.find({
            _id: { $nin: allFriends },
            name: { $regex: name, $options: "i" } //$regex is used to search for the name pattern and $options is used to make the search case insensitive
        });

        //modifying the response to only send the required fields of all not friends
        const allNotFriends =  usersExceptMeAndMyFriends.map(({_id , name , avatar})=>{
            return {
                _id,
                name,
                avatar:avatar.url
            }
        })


        return resp.status(200).json({
            success: true,
            users:allNotFriends
        })

    }
)