import { cloudinary } from "../config/cloudinary.js";
import { v4 as uuid } from 'uuid'
import { getBase64 } from "../lib/helper.js";

//upload files to cloudinary
const uploadFilesToCloudinary = async (files = []) => {


    const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {

            //uploading the file to cloudinary using the cloudinary.uploader.upload method
            cloudinary.uploader.upload(
                getBase64(file),
                {
                    folder: "Chat_Attachments",
                    resource_type: "auto",
                    public_id: uuid(),
                }
                , (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                })
        })
    })

    try {

        const results = await Promise.all(uploadPromises);

        const formattedResults = results.map(result => {
            return {
                public_id: result.public_id,
                url: result.secure_url
            }
        });

        return formattedResults;

    } catch (error) {
        throw new Error("Error uploading files to cloudinary", error);
    }

}


//delete the files from the cloudinary
const deleteFileFromCloudinary = async (public_ids) => {
    // code to delete file from cloudinary
};


export { deleteFileFromCloudinary, uploadFilesToCloudinary };