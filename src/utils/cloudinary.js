import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';
import fs from 'fs';


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

export { uploadOnCloudinary }


