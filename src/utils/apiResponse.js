// A standard API response structure for successful requests
class apiResponse {
    constructor(
        statusCode,             // HTTP status code (e.g., 200, 201)
        data,                   // Actual data to send back in the response
        message = 'Success'     // Optional message (default: "Success")
    ) {
        this.statusCode = statusCode;           // Sets HTTP status code
        this.data = data;                       // Payload/data to return to client
        this.message = message;                 // A message to describe the outcome
        this.success = statusCode < 400;        // Automatically mark as success if status code is < 400
    }
}

export { apiResponse };