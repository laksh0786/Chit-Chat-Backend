import { node_env } from "../app.js";

const errorMiddleware = (err , req , resp , next)=>{

    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;

    //mongoose duplicate key error using error code 11000
    if(err.code===11000){
        err.message = `Duplicate Field Value Entered - ${Object.keys(err.keyPattern).join(', ')}`;
        err.statusCode = 400;
    }

    //managing the cast error
    if(err.name==="CastError"){
        err.message = `Invalid format  : ${err.path}`;
        err.statusCode = 400;
    }

    // console.log(node_env === "DEVELOPMENT" , node_env);
    // console.log(err);

    return resp.status(err.statusCode).json({
        success:false,
        message:node_env === "DEVELOPMENT" ? {
            ...err,
            message:err.message,
            // stack:err.stack
        } : err.message
    })

}


const TryCatch = (passedFunction)=> async (req , resp , next)=>{
    try {
        
        await passedFunction(req , resp , next);

    } catch (error) {
        
        next(error);

    }
}

export {errorMiddleware , TryCatch};