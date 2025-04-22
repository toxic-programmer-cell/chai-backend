import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {User} from "../models/users.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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
    User.findByIdAndUpdate(req.user._id,
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

export { 
    registerUser,
    loginUser,
    logoutUser
 }