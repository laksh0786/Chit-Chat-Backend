const errorMiddleware = (err , req , resp , next)=>{

    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;

    return resp.status(err.statusCode).json({
        success:false,
        message:err.message
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