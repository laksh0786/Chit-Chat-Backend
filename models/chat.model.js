import mongoose from  'mongoose';


//creating the schema
const chatSchema = new mongoose.Schema({
    
    name:{
        type:String,
        required:true
    },

    groupChat:{
        type:Boolean,
        default:false
    },
    creator:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    admins:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
   
} , {
    timestamps:true
});



//exporting the model
export default mongoose.models.Chat || mongoose.model("Chat" , chatSchema);