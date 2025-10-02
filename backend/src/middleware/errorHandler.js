/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  // Structured error response
  const errorResponse = {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
    },
  };

  // Add validation errors if available
  if (err.errors) {
    errorResponse.error.details = err.errors;
  }

  // Add request information in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.request = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    };
  }

  res.status(status).json(errorResponse);
};

module.exports = errorHandler;