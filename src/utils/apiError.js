// A custom Error class to handle API-specific errors in a structured way
class apiError extends Error {
    constructor(
        statusCode,                            // HTTP status code (e.g., 400, 404, 500)
        message = 'something went wrong',      // Default error message
        errors = [],                           // Optional array of additional error details (e.g., validation issues)
        stack = ""                             // Optional custom stack trace
    ){
        super(message)                         // Call parent Error constructor with the message

         // Custom properties for API error structure
        this.statusCode = statusCode         // HTTP status code
        this.data = null                      // Data can be added later (null for error cases)
        this.message = message                // Error message
        this.success = false                   // Indicates failed response
        this.errors = errors                   // Extra error details if any

        // Use custom stack if provided, else capture from the point where error is thrown
        if(stack) {
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { apiError }