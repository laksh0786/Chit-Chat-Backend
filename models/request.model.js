import mongoose from  'mongoose';

// Define schema
const requestSchema = new mongoose.Schema({

    status:{
        type: String,
        default: "pending",
        enum:["pending", "accepted", "rejected"]
    },

    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

} , {
    timestamps: true
});


//export model
export default mongoose.models.Request || mongoose.model("Request", requestSchema);