/**
 * Utility to wrap async functions and catch any errors, passing them to the next middleware.
 * This prevents unhandled promise rejections from crashing the Node process.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
