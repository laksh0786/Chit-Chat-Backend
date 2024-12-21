import { ErrorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";

const isAuth = (req, resp, next) => {

    const token = req.cookies["token"];

    if (!token) {
        return next(new ErrorHandler("Login first to access this route", 401));
    }

    //verify token and we get the decoded data i.e. user id 
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decode);
    req.user = decode._id;

    next();

}



export { isAuth };