// Utility for sending consistent API responses
function sendResponse(res, status, data, message = '') {
  res.status(status).json({
    success: status >= 200 && status < 300,
    data,
    message,
  });
}

module.exports = { sendResponse };
