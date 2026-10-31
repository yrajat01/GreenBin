const admin = require("firebase-admin");
const User = require("../models/User");

// Middleware to verify token and attach user to request
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    // Check for local token (from local email/password login and signup)
    if (token.startsWith("local-")) {
      const targetUid = token.substring(6); // e.g. local-uid-citizen => uid-citizen
      const user = await User.findOne({ uid: targetUid });
      if (user) {
        req.user = user;
        return next();
      } else {
        return res
          .status(401)
          .json({ message: "Not authorized, user profile not found" });
      }
    }

    // Explicitly reject mock tokens so users must authenticate with valid credentials
    if (token.startsWith("mock-")) {
      return res
        .status(401)
        .json({ message: "Mock authentication is disabled. Please sign in with your account credentials." });
    }

    // Verify real Firebase ID Token if Firebase admin is initialized
    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      const email = decodedToken.email || "";
      const name = decodedToken.name || decodedToken.email || "Firebase User";

      let user = await User.findOne({ uid });
      if (!user) {
        // Auto-register user in MongoDB on first auth
        user = await User.create({
          uid,
          name,
          email,
          role: "citizen", // Default role
          zone: "Zone-A",
          points: 0,
        });
      }

      req.user = user;
      return next();
    }

    return res
      .status(401)
      .json({ message: "Not authorized, invalid authentication token" });
  } catch (error) {
    console.error("Auth verification error:", error);
    res
      .status(401)
      .json({ message: "Not authorized, token verification failed" });
  }
};

// Middleware to check roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res
        .status(403)
        .json({
          message: `Access denied. Requires one of these roles: ${roles.join(", ")}`,
        });
    }
  };
};

module.exports = {
  protect,
  requireRole,
};
