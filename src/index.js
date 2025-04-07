import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

// Load variables from the .env file located at the root level (filename: "env")
dotenv.config({
    path: './env'
})

// Attempt to connect to MongoDB, and start the server upon successful connection
connectDB()
.then(() => {
    // If the app encounters an internal error, log it
    app.on('error', (error) => {
        console.log('🚨 App error: ', error)
    })
    
    // Start the Express server on the defined port (fallback to 8000 if not provided)
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App is running on port: ${process.env.PORT}`)
    })
})

.catch((err) => {
    // If MongoDB connection fails, log the error and stop execution
    console.log('MONGO DB connection FAILED !!! : ', err)
})








/* THIS IS ALSO A GOOD APPROCH BUT INDEX FILE LOOKS MESSY

import express from 'express';
const app = express();
( async () => {
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', (error) => {
            console.log('ERROR: ', error)
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listing on port ${process.env.PORT}`)
        })

    } catch (error) {
       console.error('ERROR: ', error) 
       throw error
    }
})()
    */