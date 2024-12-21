//importing the  models
import User from "../models/user.model.js";

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
    async (req, resp , next) => {

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
    async (req , resp)=>{
        return resp.status(200).cookie("token" , null , {
            ...cookieOptions,
            maxAge:0
        }).json({
            success:true,
            message:"User Logged Out Successfully"
        })
    }
) 


//search the user controller
export const searchUserController = TryCatch(
    
    async (req , resp , next)=>{

        const {name} = req.query;

        return resp.status(200).json({
            success:true,
            message:`Searching for ${name}`
        })

    }
)