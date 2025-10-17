import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

// Import database and cloud configurations
import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";

// Import route handlers
import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

// Import webhook controllers
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";

const app = express();

// Await initial connections
await connectDB();
await connectCloudinary();

// --- Middleware Setup ---

// 1. CORS for cross-origin requests
app.use(cors());

// 2. A special raw body parser for the Stripe webhook ONLY.
// This must come before the general express.json() parser.
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// 3. The general JSON parser for all other routes.
app.use(express.json());

// 4. Clerk webhook uses its own JSON parser.
app.post("/clerk", express.json(), clerkWebhooks);

// 5. Clerk authentication middleware. It populates `req.auth`.
// If this causes a silent crash, the issue is 100% in your .env file.
// Double-check CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.
app.use(clerkMiddleware());


// --- API Routes ---
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);


// --- Root Route for Testing ---
app.get("/", (req, res) => res.send("API Working"));


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});