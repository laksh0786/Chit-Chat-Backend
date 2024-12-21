import mongoose from "mongoose";

const dbConnect = (uri)=>{
    mongoose.connect(uri , {
        dbName:"ChatApp"
    }).then((data)=>{
        console.log(`Connected to database : ${data.connection.host}`);
    }).catch((err)=>{
        throw err;
    });
}

export {dbConnect};