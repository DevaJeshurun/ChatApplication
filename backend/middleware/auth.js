// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// This middleware checks if the user is authenticated
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header (format: "Bearer TOKEN")
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token found' });
    }

    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to the request object so routes can use it
    req.userId = decoded.userId;
    req.username = decoded.username;
    
    next(); // Continue to the next middleware/route
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;