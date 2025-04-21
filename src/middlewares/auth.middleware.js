import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/users.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new apiError(401, "No token provided, authorization denied");
        }
        //NOTE: 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = User.findByIdAndDelete(decodedToken._id).select("--password --refreshToken");
    
        if (!user) {
            throw new apiError(401, "Token is not valid");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, error?.message || "Token is not valid");
    }
})