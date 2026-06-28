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
    let uid;
    let email = "";
    let name = "";

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
          .json({ message: "Not authorized, local profile not found" });
      }
    }

    // Check for mock token (for local development and easy testing)
    if (token.startsWith("mock-")) {
      const mockRole = token.split("-")[1]; // e.g. mock-admin, mock-staff, mock-citizen
      uid = `uid-${mockRole}`;
      email = `${mockRole}@greenbin.com`;
      name = `${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)} Demo`;

      // Auto-create or fetch mock user in DB
      let user = await User.findOne({ uid });
      if (!user) {
        user = await User.create({
          uid,
          name,
          email,
          role: ["admin", "staff", "citizen"].includes(mockRole)
            ? mockRole
            : "citizen",
          zone: "Zone-A",
          points: mockRole === "citizen" ? 120 : 0,
        });
      }
      req.user = user;
      return next();
    }

    // Verify real Firebase ID Token
    // Check if Firebase admin is initialized
    if (admin.apps.length === 0) {
      return res
        .status(500)
        .json({ message: "Firebase Admin not initialized" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid;
    email = decodedToken.email || "";
    name = decodedToken.name || decodedToken.email || "Firebase User";

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
    next();
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
