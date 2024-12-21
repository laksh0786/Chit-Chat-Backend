import mongoose from  'mongoose'
import bcrypt from "bcrypt"

//creating the schema
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    bio:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        select:false, //this will not return the password in the response when we get the user details
        //this is used to hide the password from the response and to get passowrd we have to specifically ask for it using the select method
    },
    avatar:{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    }

} , {
    timestamps:true
})


//hashing the password before saving it to the database

//use function keyword because arrow function does not have its own 'this' keyword and it will not work with this 

//in case of findandUpdate this will not work 

userSchema.pre('save' , async function (next){

    //if the password is not modified then we will not hash the password again
    if(!this.isModified('password')){
        next();
    }

    this.password = await bcrypt.hash(this.password , 10);

})




//models is an object that contains all the models that we have created and we can check if the model is already created or not by checking the models object and if it is created then we can use that model otherwise we can create a new model using the model function of mongoose.

//exporting the model
export default mongoose.models.User || mongoose.model('User' , userSchema);