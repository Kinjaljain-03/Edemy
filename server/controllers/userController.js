import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import { CourseProgress } from "../models/CourseProgress.js";

// Get User Data (or create if non-existent)
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    let user = await User.findById(userId);

    if (!user) {
      console.log(`User ${userId} not found in DB. Creating new user...`);
      try {
        const clerkUser = await clerkClient.users.getUser(userId);

        user = await User.create({
          _id: userId,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          email: clerkUser.emailAddresses[0].emailAddress,
          imageUrl: clerkUser.imageUrl,
          enrolledCourses: [],
        });
        console.log(`Successfully created user ${userId} in DB.`);
      } catch (clerkError) {
        console.error("Error fetching or creating user from Clerk API:", clerkError.message);
        return res.status(500).json({ success: false, message: "Could not retrieve or create user account." });
      }
    }

    res.json({ success: true, user: user.toObject() });
  } catch (error) {
    console.error("General error in getUserData:", error.message);
    res.status(500).json({ success: false, message: "An unexpected error occurred." });
  }
};

// Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.auth();
    const userData = await User.findById(userId).populate("enrolledCourses");

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Purchase Course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const { userId } = req.auth();
    
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.status(404).json({ success: false, message: "User or Course not found" });
    }

    // --- DEMO FIX: ENROLL USER IMMEDIATELY ---
    // 1. Add course to user's enrolled list
    if (!userData.enrolledCourses.includes(courseId)) {
        userData.enrolledCourses.push(courseId);
        await userData.save();
    }

    // 2. Add user to course's student list
    if (!courseData.enrolledStudents.includes(userId)) {
        courseData.enrolledStudents.push(userId);
        await courseData.save();
    }
    
    console.log(`DEMO FIX: Immediately enrolled user ${userId} in course ${courseId}.`);
    // --- END OF FIX ---

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: (
        courseData.coursePrice -
        (courseData.discount * courseData.coursePrice) / 100
      ).toFixed(2),
      status: "completed", // Mark as completed for the demo
    };

    const newPurchase = await Purchase.create(purchaseData);
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = (process.env.CURRENCY || "usd").toLowerCase();

    const line_items = [{
      price_data: {
        currency,
        product_data: { name: courseData.courseTitle },
        unit_amount: Math.round(newPurchase.amount * 100),
      },
      quantity: 1,
    }];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`, // This redirect is still crucial
      cancel_url: `${origin}/course/${courseId}`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error in purchaseCourse:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId, lectureId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (!progressData.lectureCompleted.includes(lectureId)) {
        progressData.lectureCompleted.push(lectureId);
        await progressData.save();
      }
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId],
      });
    }

    res.json({ success: true, message: "Progress Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    res.json({ success: true, progressData: progressData || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add User Ratings to Course
export const addUserRating = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId, rating } = req.body;

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Invalid Details" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.status(403).json({ success: false, message: "User is not enrolled in this course." });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId.toString() === userId
    );

    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();
    return res.json({ success: true, message: "Rating added" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};