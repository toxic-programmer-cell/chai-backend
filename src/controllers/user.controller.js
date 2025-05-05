import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {User} from "../models/users.models.js";
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

//@NOTE: GENERATE ACCESS TOKEN AND REFRESH TOKEN METHOD FOR REUSIBILITY
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, "Something went wrong when generating access and refresh tokens")
    }
}

//@NOTE: REGISTER USER METHOD
const registerUser = asyncHandler( async (req, res) => {
    //steps to register user
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images, check foe avatar
    //upload them to cloudinary, avatar 
    //create user object - create entry in db
    //remove password and refresh token field from response
    // check for user creation
    // return response to frontend


    const { fullName, userName, email, password } = req.body;
    // console.log("email", email);

    if (
        [fullName, email, userName, password].some((field) => field?.trim() === "")
    ){
        throw new apiError(400, "All fields are required")
    }

    
    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    })
    // console.log("USER EXIST",existedUser);
    

    if (existedUser) {
        throw new apiError(409, "User with email or username already exists")
    }
    // console.log("REQ FILE",req.files);
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log("AVATAR LOCAL PATH", avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar upload failed")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiError(500, "Something went wrong when registering user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )
})

//@NOTE: LOGIN USER METHOD
const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //check user avalible
    //check password
    //generate access token and refresh token
    //send cookies
    //send response to frontend
    
    // console.log(req.body);
    
    const { email, userName, password } = req.body

    if (!(email || userName)) {
        throw new apiError(400, "email or username is required");
    }

    //@NOTE: CHECK FOR USER EXISTENCE
    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })

    if(!user){
        throw new apiError(401, "user not found");
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
        throw new apiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken)
    .json(
        new apiResponse( 200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully" )
    )
})

//@NOTE: LOGOUT USER METHOD
const logoutUser = asyncHandler(async (req, res) => {
    //LOGIC_STEPS:
    //get access to req.user from verifyJWT middleware 
    //Remove refresh token from BD
    //clear cookie from client
    //send response
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {refreshToken:  undefined}  //NOTE: remove refresh token from db
        },
        {
            new: true  //NOTE: new updated value will be returned
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    //NOTE: clear cookies from browser and send response to frontend
    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new apiResponse(200, {}, "User logged out successfully"));
})

//NOTE: ENDPOINT REFRESH ACCESS TOCKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
    //LOGIC_STEPS:
    //Access refresh token => cookie || body
    //Verify and decode the refresh tocken
    //Find user
    //check refreshToken in user are equal to accessed refresh token (incomingRefreshToken == user?.refreshToken)
    //Generate access token
    //send response

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    //DEBUG
    // console.log("Incoming Refresh Token",incomingRefreshToken);

    try {
        if (!incomingRefreshToken) {
            throw new apiError(401, "Unauthorize Request")
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
    
        if (!user) {
            throw new apiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh token is expired or used")
        }
    
        const option = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        //DEBUG
        // console.log("access-token", accessToken);
        // console.log("new refresh token", newRefreshToken);
        
        
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, option)
        .cookie("refreshToken",newRefreshToken, option)
        .json(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token Refreshed"
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Unauthorize refresh toke")
    }

    
})

//NOTE: CHANGE CURRENT PASSWORD
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new apiError(401, "Invalid user")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new apiResponse(200, {}, "Password change successfully"))
})

//NOTE: GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

//NOTE: UPDATE ACCOUNT DETAILS
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if (!(fullName || email)) {
        throw new apiError(400, "All field are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file missing")
    }

    // const oldAvatarUrl = user.avatar

    const newAvatar = await uploadOnCloudinary(avatarLocalPath)

    if (!newAvatar.url) {
        throw new apiError(400, "Error while uploading avatar")
    }

    // Get old avatar before updating
    const existingUser = await User.findById(req.user?._id);
    const oldAvatarUrl = existingUser?.avatar;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        {new: true}
    ).select("-password")

    // ✅ Delete old avatar after DB update is successful
    if (user && oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl);
    }

    return res
    .status(200)
    .json(new apiResponse(200, user, "avatar updated successfully" ))
})

const updateUsercoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400, "coverImage file missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading coverImage")
    }

    const existingUser = await User.findById(req.body?._id)
    const oldCoverImage = existingUser.coverImage;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

     // ✅ Delete old avatar after DB update is successful
     if (user && oldCoverImage) {
        await deleteFromCloudinary(oldCoverImage);
    }

    return res
    .status(200)
    .json(new apiResponse(200, user, "coverImage updated successfully" ))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { userName } = req.params;

    if (!userName) {
        throw new apiError(400, "User name not found")
    }

    //NOTE: AGGREGATE PAIPLINE FOR USER CHANNEL PROFILE
    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
        
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed"
            }
        },
        {
            $addFields: {
                subscribeCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribed"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribeCount: 1,
                channelSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1
            }
        }
    ])
    //DEBUG
    // console.log("CHANNEL", channel);

    if (!channel?.length) {
        throw new apiError(404, "Channel not exist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, channel[0], "User channel fetched successfully")
    )
    
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully")
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile,
    getWatchHistory
 }