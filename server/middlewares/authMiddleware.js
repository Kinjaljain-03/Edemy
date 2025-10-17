import { requireAuth } from "@clerk/express";

// This is the DEMO version of the middleware.
export const protectEducator = (req, res, next) => {
  // First, ensure a user is logged in.
  requireAuth()(req, res, () => {
    
    // --- DEMO SHORTCUT ---
    // We are skipping the role check and just allowing access.
    console.log("DEMO MODE: Bypassing educator role check.");
    next(); 
    // --- END OF SHORTCUT ---

    /*
    // ORIGINAL SECURITY CHECK (Commented out for the demo)
    if (req.auth.sessionClaims?.metadata?.role === "educator") {
      next();
    } else {
      res.status(403).json({ 
        success: false, 
        message: "Access Denied: You do not have educator privileges." 
      });
    }
    */
  });
};