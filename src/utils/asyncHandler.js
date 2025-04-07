// A utility function to handle async errors in Express routes or middlewares
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        // Resolve the promise and catch any errors, passing them to Express error handler
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}




    // ===================using try-catch===================

    // const asyncHandler = () => {}
    // const asyncHandler = () => {() => {}}
    // const asyncHandler = () => async () => {}

    // const asyncHandler = (fn) => async (req, res, next) => {
    //     try {
            
    //     } catch (error) {
    //         res.status(error.code || 500).json({
    //             success: false,
    //             message: error.message
    //         })
    //     }
    // }

export { asyncHandler }