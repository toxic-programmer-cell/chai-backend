import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
    path: './env'
})

connectDB()








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