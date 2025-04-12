import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Creating an instance of the Express application
const app = express();

// ================== MIDDLEWARES & CONFIGURATIONS ==================

// app.use() are used for middleware or configurations

// Enable Cross-Origin Resource Sharing (CORS)
// This allows your backend to handle requests from different origins (e.g., your frontend on another domain or port)
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Allows requests only from the specified origin (defined in .env)
    credentials: true                   // Allows cookies and authentication headers to be sent/received across origins
}))

// Limit is set to 16kb to avoid unnecessarily large request bodies
app.use(express.json({limit: '16kb'}))

// Parse incoming URL-encoded form data
// extended: true allows for rich objects and arrays to be encoded
app.use(express.urlencoded({ extended: true, limit: '16kb' }))

// Serve static files (like images, CSS, JS) from the "public" directory
// This lets you expose a folder for client access (e.g., public/images/logo.png)
app.use(express.static('public'))

// This is useful when working with authentication tokens or session data stored in cookies
app.use(cookieParser())


//Routes import
import userRouter from './routes/users.routes.js';

//routes decleration
app.use("/api/v1/users", userRouter)




export { app };