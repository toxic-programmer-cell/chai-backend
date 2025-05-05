import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';
import fs from 'fs';
import { apiError } from './apiError.js';


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // log("RESPONSE", response);
        //file uploaded successfully
        // console.log("File uploaded successfully to Cloudinary", response.url);
        fs.unlinkSync(localFilePath)  // remove the locally saved file after upload
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the locally saved file as the upload operation failed
        return null;
    }
}

const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return null;

    try {
        const parts = imageUrl.split("/");                 // Split the image URL into parts
        const fileName = parts.pop();                      // Extract the filename (e.g., avatar.jpg)

        // Extract folder path after 'upload' and join the remaining parts
        const folderPath = parts.slice(parts.indexOf("upload") + 1).join("/");
        
        // Construct the public ID for the image (without extension)
        const publicId = `${folderPath}/${fileName.split(".")[0]}`;
    
        // Call Cloudinary API to delete the image
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new apiError(400, error?.message || "Error deleting image from cloudinary")
    }
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary
}


