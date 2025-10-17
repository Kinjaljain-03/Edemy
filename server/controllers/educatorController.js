import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";

// Update role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const { userId } = req.auth(); // Corrected Clerk auth call

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "educator",
      },
    });

    res.json({ success: true, message: "You can publish a course now" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add New Course (Using URL for thumbnail)
export const addCourse = async (req, res) => {
  try {
    // 1. Get all data directly from the JSON body. No file upload needed.
    const {
      courseTitle,
      courseDescription,
      coursePrice,
      discount,
      courseContent,
      courseThumbnail, // This is now a URL string from the form
      notesUrl,         // The new notes URL field
    } = req.body;

    const { userId } = req.auth(); // Corrected Clerk auth call

    // 2. Validate that the thumbnail URL was provided
    if (!courseThumbnail) {
      return res.json({ success: false, message: "Thumbnail URL is required" });
    }

    // 3. Create the new course with the provided URLs
    const newCourse = await Course.create({
      courseTitle,
      courseDescription,
      coursePrice,
      discount,
      courseContent,
      courseThumbnail, // Save the URL directly
      notesUrl,        // Save the new notes URL
      educator: userId,
    });

    res.json({ success: true, message: "Course added successfully", course: newCourse });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
  try {
    const { userId } = req.auth(); // Corrected Clerk auth call
    const courses = await Course.find({ educator: userId });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Educator Dashboard Data
export const educatorDashboard = async (req, res) => {
  try {
    const { userId } = req.auth(); // Corrected Clerk auth call
    const courses = await Course.find({ educator: userId });
    const totalCourses = courses.length;

    const courseIds = courses.map((course) => course._id);

    // Calculate total earnings
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    // Collect enrolled students data
    const enrolledStudentsData = [];
    for (const course of courses) {
      const students = await User.find(
        { _id: { $in: course.enrolledStudents } },
        "name imageUrl"
      );

      students.forEach((student) => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student,
        });
      });
    }

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalCourses,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const { userId } = req.auth(); // Corrected Clerk auth call
    const courses = await Course.find({ educator: userId });
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl")
      .populate("courseId", "courseTitle");

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};