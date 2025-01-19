import jwt from 'jsonwebtoken';
import dotenv from "dotenv"
import { cookieOptions } from '../constants/cookieOptions.js';

dotenv.config();

// const cookieOptions = {
//     maxAge: 15 * 24 * 60 * 60 * 1000,
//     sameSite: 'none',
//     httpOnly: true,
//     secure: true,
// }

const sendToken = (res, user, code, message) => {

    const token = jwt.sign({ _id:user._id} , process.env.JWT_SECRET  );
    // console.log(token);

    res.status(code).cookie("token", token, cookieOptions).json({
        success: true,
        user,
        message
    })

}

export default sendToken;