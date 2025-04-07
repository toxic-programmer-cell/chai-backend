import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';


// Function to connect to MongoDB using mongoose
const connectDB = async () => {
    try {
        // console.log(process.env.MONGODB_URI)
        // Try to connect to MongoDB using the URI from environment variables and appending the DB name
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        // If connection is successful, log the host where DB is connected
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
         // If there's any error in connection, log it and exit the process with a failure code (1)
        console.log('MONGODB CONNECTION FAILED: ', error);
        process.exit(1);  // Forcefully terminate the app if DB connection fails
    }
}

export default connectDB;