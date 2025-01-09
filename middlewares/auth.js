import { ErrorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { adminSecretKey } from "../app.js";
import { userToken } from "../constants/config.js";
import User from "../models//user.model.js"

dotenv.config({});

const isAuth = (req, resp, next) => {

    const token = req.cookies[userToken];

    if (!token) {
        return next(new ErrorHandler("Login first to access this route", 401));
    }

    //verify token and we get the decoded data i.e. user id 
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decode);
    req.user = decode._id;

    next();

}


const isAdminAuthenticated = (req, resp, next) => {

    //fetch the token from the cookies
    const token = req.cookies["admin-token"];

    //if the token is not present then return the error
    if (!token) {
        return next(new ErrorHandler("Only admin can access this route, token missing", 401));
    }

    //verify the token and get the decoded data
    const { secretKey } = jwt.verify(token, process.env.JWT_SECRET);  //iat is the time when the token was issued and exp is the time when the token will expire and secret key is the secret key

    //checkig if the secret key is correct or not
    const isMatch = secretKey === adminSecretKey;


    //if the secret key is not correct then return the error
    if (!isMatch) {
        return next(new ErrorHandler("Only admin can access this route", 401));
    }

    next();

}


const socketAuthenticator = async (err, socket, next) => {

    try {

        if(err){
            return next(err);
        }

        //fetch the token from the cookies as we have used the cookie parser in io middleware
        const authToken = socket.request.cookies[userToken];

        if(!authToken){
            return next(new ErrorHandler("Login first to access this route", 401));
        }

        const decodedPayload = jwt.verify(authToken, process.env.JWT_SECRET);

        //fetch the user from the database using the user id
        const user = await User.findById(decodedPayload._id);

        //if the user is not present then return the error
        if(!user){
            return next(new ErrorHandler("User not found", 404));
        }

        socket.user = user;

        return next();

        
    } catch (error) {

        console.log(error);

        return next(new ErrorHandler("Error in socket authentication", 401));

    }
    
}


export { isAuth, isAdminAuthenticated, socketAuthenticator };