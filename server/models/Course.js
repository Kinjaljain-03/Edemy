import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureId: { type: String, required: true },
    lectureTitle: { type: String },
    lectureDuration: { type: Number },
    lectureUrl: { type: String }, // <-- 'required' removed for flexibility
    isPreviewFree: { type: Boolean, default: false },
    lectureOrder: { type: Number },
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number },
    chapterTitle: { type: String },
    chapterContent: [lectureSchema],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseTitle: { type: String, required: true },
    courseDescription: { type: String, required: true },
    courseThumbnail: { type: String, required: true }, // <-- Made this required, as it's essential
    notesUrl: { type: String },
    coursePrice: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    courseContent: [chapterSchema],
    courseRatings: [
      { userId: { type: String }, rating: { type: Number, min: 1, max: 5 } },
    ],
    educator: { type: String, ref: "User", required: true },
    enrolledStudents: [{ type: String, ref: "User" }],
  },
  { timestamps: true, minimize: false }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;