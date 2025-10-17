import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../components/student/Footer";
import YouTube from "react-youtube";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";

const CourseDetails = () => {
  const { id } = useParams();
  const { isSignedIn } = useUser();

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);

  const {
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency,
    backendUrl,
    userData,
    getToken,
  } = useContext(AppContext);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/${id}`);
      if (data.success) {
        setCourseData(data.courseData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const enrollCourse = async () => {
    try {
      if (!isSignedIn) {
        return toast.warn("Login to Enroll");
      }
      if (!userData) {
        return toast.info("Please wait, fetching your details...");
      }
      if (isAlreadyEnrolled) {
        return toast.warn("Already Enrolled");
      }

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        window.location.replace(data.session_url);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (userData?.enrolledCourses && courseData?._id) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id));
    }
  }, [userData, courseData]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!courseData) {
    return <Loading />;
  }

  const isLoadingUserData = isSignedIn && !userData;

  return (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left">
        {/* The new background is also applied here for consistency */}
        <div className="absolute top-0 left-0 w-full h-[400px] -z-10 bg-gradient-to-br from-purple-100 via-pink-50 to-red-100"></div>

        {/* left column */}
        <div className="max-w-2xl z-10 text-gray-600">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {courseData.courseTitle}
          </h1>
          <p
            className="pt-4 md:text-base text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200) + "...",
            }}
          ></p>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 pt-3 pb-1 text-sm">
            <p className="font-semibold text-gray-800">{calculateRating(courseData)}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={
                    i < Math.floor(calculateRating(courseData))
                      ? assets.star
                      : assets.star_blank
                  }
                  alt="star"
                  className="w-3.5 h-3.5"
                />
              ))}
            </div>
            <p className="text-purple-600 font-medium">
              ({courseData.courseRatings.length}{" "}
              {courseData.courseRatings.length === 1 ? "rating" : "ratings"})
            </p>
            <p>
              {courseData.enrolledStudents.length}{" "}
              {courseData.enrolledStudents.length === 1 ? "student" : "students"}
            </p>
          </div>
          <p className="text-sm">
            Course by{" "}
            <span className="text-purple-600 underline font-medium">
              {courseData.educator?.name}
            </span>
          </p>

          <div className="pt-8 text-gray-800">
            <h2 className="text-2xl font-bold">Course Structure</h2>
            <div className="pt-5 space-y-2">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border border-gray-200 bg-white rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between w-full px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        className={`w-4 h-4 transform transition-transform ${
                          openSections[index] ? "rotate-180" : ""
                        }`}
                        src={assets.down_arrow_icon}
                        alt="toggle section"
                      />
                      <p className="font-semibold text-gray-900">
                        {chapter.chapterTitle}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {chapter.chapterContent.length} lectures -{" "}
                      {calculateChapterTime(chapter)}
                    </p>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openSections[index] ? "max-h-[1000px]" : "max-h-0"
                    }`}
                  >
                    <ul className="py-2 text-gray-600 border-t border-gray-200">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-3 py-2 px-4 hover:bg-gray-50">
                          <img
                            src={assets.play_icon}
                            alt="play icon"
                            className="w-4 h-4 mt-1 opacity-50"
                          />
                          <div className="flex items-center justify-between w-full text-sm">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-4 items-center">
                              {lecture.isPreviewFree && (
                                <p
                                  onClick={() =>
                                    setPlayerData({ videoId: lecture.lectureUrl.split("v=").pop().split('&')[0] })
                                  }
                                  className="text-purple-600 cursor-pointer font-semibold"
                                >
                                  Preview
                                </p>
                              )}
                              <p className="text-gray-500">
                                {humanizeDuration(
                                  lecture.lectureDuration * 60 * 1000,
                                  { units: ["h", "m"], round: true }
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="py-20">
            <h3 className="text-2xl font-bold text-gray-900">
              Course Description
            </h3>
            <div
              className="pt-3 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
            ></div>
          </div>
        </div>

        {/* right column */}
        <div className="sticky top-24 w-full md:w-auto max-w-sm z-10 shadow-2xl rounded-lg overflow-hidden bg-white min-w-[300px] sm:min-w-[420px]">
          {playerData ? (
            <YouTube
              videoId={playerData.videoId}
              opts={{ playerVars: { autoplay: 1 } }}
              iframeClassName="w-full aspect-video"
            />
          ) : (
            <img src={courseData.courseThumbnail} alt={courseData.courseTitle} className="w-full object-cover" />
          )}

          <div className="p-5">
            <div className="flex items-center gap-2">
              <img
                className="w-4 h-4"
                src={assets.time_left_clock_icon}
                alt="time left"
              />
              <p className="text-red-500 text-sm font-medium">
                <span className="font-bold">5 days</span> left at this price!
              </p>
            </div>
            <div className="flex gap-3 items-baseline pt-2">
              <p className="text-gray-900 text-4xl font-bold">
                {currency}
                {(
                  courseData.coursePrice -
                  (courseData.discount * courseData.coursePrice) / 100
                ).toFixed(2)}
              </p>
              <p className="text-lg text-gray-400 line-through">
                {currency}
                {courseData.coursePrice}
              </p>
              <p className="text-lg text-green-600 font-semibold">{courseData.discount}% off</p>
            </div>
            
            {/* The Updated Enroll Button */}
            <button
              onClick={enrollCourse}
              disabled={isLoadingUserData || isAlreadyEnrolled}
              className="mt-6 w-full py-3 rounded-lg bg-purple-600 text-white font-semibold shadow-lg hover:bg-purple-700 active:scale-95 transition-all duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoadingUserData
                ? "Loading..."
                : isAlreadyEnrolled
                ? "Already Enrolled"
                : "Enroll Now"}
            </button>

            <div className="pt-6">
              <p className="text-lg font-semibold text-gray-900">
                What’s in the course?
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2"><img src={assets.lesson_icon} alt="" className="w-4 h-4 opacity-50"/>Lifetime access with free updates.</li>
                <li className="flex items-center gap-2"><img src={assets.lesson_icon} alt="" className="w-4 h-4 opacity-50"/>Step-by-step, hands-on project guidance.</li>
                <li className="flex items-center gap-2"><img src={assets.lesson_icon} alt="" className="w-4 h-4 opacity-50"/>Downloadable resources and source code.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetails;
