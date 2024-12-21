import mongoose from  'mongoose';


// Define schema
const messageSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    chat:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    content:{
        type: String,
    },
    attachments:[{
        public_id:{
            type: String,
            required: true
        },
        url:{
            type: String,
            required: true
        }   
    }],
    readBy:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
} , {
    timestamps: true 
});


//export model
export default mongoose.models.Message || mongoose.model("Message", messageSchema);