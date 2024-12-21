//creating the user fake data 
import User from "../models/user.model.js";
import { faker } from "@faker-js/faker";

const createUser = async(numUsers)=>{

    try {

        const usersPromise = [];
        
        for(let i=0 ; i<numUsers ; i++){
            const tempUser = User.create({
                name:faker.person.fullName(),
                email:faker.internet.email(),
                password:"password",
                bio:faker.lorem.sentence(10),
                avatar:{
                    url:faker.image.avatar(),
                    public_id:faker.system.fileName(),
                }
            })

            usersPromise.push(tempUser);

        }

        await Promise.all(usersPromise);
        
        console.log("Users cretaed : " , numUsers);

        process.exit(1);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }

}


export {createUser};