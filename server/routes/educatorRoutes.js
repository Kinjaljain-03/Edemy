import express from "express";

// 1. IMPORT ALL controller functions you are using
import {
  addCourse,
  getEducatorCourses,
  updateRoleToEducator,
  educatorDashboard,
  getEnrolledStudentsData,
} from "../controllers/educatorController.js";

import { protectEducator } from "../middlewares/authMiddleware.js";

// 2. CREATE the router variable
const educatorRouter = express.Router();

// 3. DEFINE all your routes
educatorRouter.get("/update-role", updateRoleToEducator);
educatorRouter.post("/add-course", protectEducator, addCourse);
educatorRouter.get("/courses", protectEducator, getEducatorCourses);
educatorRouter.get("/dashboard", protectEducator, educatorDashboard);
educatorRouter.get(
  "/enrolled-students",
  protectEducator,
  getEnrolledStudentsData
);

// 4. EXPORT the router at the very end
export default educatorRouter;