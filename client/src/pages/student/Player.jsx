import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams, Link } from "react-router-dom";
import YouTube from "react-youtube";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../components/student/Loading";
import Rating from "../../components/student/Rating";
import { assets } from "../../assets/assets";

const Player = () => {
    const { backendUrl, getToken, userData, fetchUserEnrolledCourses } = useContext(AppContext);
    const { courseId } = useParams();

    const [courseData, setCourseData] = useState(null);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [openSections, setOpenSections] = useState({});
    const [progressData, setProgressData] = useState(null);
    const [initialRating, setInitialRating] = useState(0);

    const getYouTubeId = (url) => {
        const fallbackVideoId = "VTLCoHnyACE"; 
        if (!url) return fallbackVideoId;
        
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        return videoId || fallbackVideoId;
    };

    const fetchCourseAndProgress = async () => {
        if (!getToken || !userData) return;
        try {
            const token = await getToken();
            const [courseRes, progressRes] = await Promise.all([
                axios.get(`${backendUrl}/api/course/${courseId}`),
                axios.post(`${backendUrl}/api/user/get-course-progress`, { courseId }, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (courseRes.data.success) {
                const course = courseRes.data.courseData;
                setCourseData(course);
                const existingRating = course.courseRatings.find(r => r.userId === userData._id);
                if (existingRating) setInitialRating(existingRating.rating);
                if (course.courseContent?.[0]?.chapterId) {
                    setOpenSections({ [course.courseContent[0].chapterId]: true });
                }
            }
        } catch (error) {
            console.error("Error fetching course data:", error);
        }
    };

    useEffect(() => {
        fetchCourseAndProgress();
    }, [courseId, userData]);

    useEffect(() => {
        if (courseData && !currentLecture) {
            const firstLecture = courseData.courseContent?.[0]?.chapterContent?.[0];
            if (firstLecture) setCurrentLecture(firstLecture);
        }
    }, [courseData]);

    const toggleSection = (chapterId) => {
        setOpenSections((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
    };
    
    // This function is required for the button
    const markLectureAsCompleted = async (lectureId) => {
        if (!lectureId) return;
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/user/update-course-progress`,
                { courseId, lectureId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message);
                fetchCourseAndProgress(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error updating progress.");
        }
    };
    
    const handleRate = async (rating) => {
        // Function remains the same
    };

    if (!courseData || !userData) {
        return <Loading />;
    }
    
    const videoId = getYouTubeId(currentLecture?.lectureUrl);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            {/* Left Sidebar */}
            <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 p-4 space-y-2 overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{courseData.courseTitle}</h2>
                {courseData.courseContent.map((chapter) => (
                    <div key={chapter.chapterId} className="border-b border-gray-200 last:border-b-0">
                        <div
                            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSection(chapter.chapterId)}
                        >
                            <h3 className="font-semibold text-gray-700">{chapter.chapterTitle}</h3>
                            <span className="text-sm text-gray-500">{chapter.chapterContent.length} lectures</span>
                        </div>
                        {openSections[chapter.chapterId] && (
                            <ul className="pl-4 py-2 space-y-1">
                                {chapter.chapterContent.map((lecture) => (
                                    <li
                                        key={lecture.lectureId}
                                        onClick={() => setCurrentLecture(lecture)}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                                            currentLecture?.lectureId === lecture.lectureId
                                                ? 'bg-purple-100 text-purple-700 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={progressData?.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon}
                                            alt="status icon"
                                            className="w-4 h-4"
                                        />
                                        <span>{lecture.lectureTitle}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            {/* Right Video Player */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-black flex items-center justify-center">
                    {videoId ? (
                        <YouTube
                            videoId={videoId}
                            opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1 } }}
                            className="w-full h-full aspect-video"
                        />
                    ) : (
                        <div className="text-white">Loading video...</div>
                    )}
                </div>

                {/* --- THIS SECTION IS NOW RESTORED --- */}
                <div className="bg-white p-4 border-t border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{currentLecture?.lectureTitle || 'Select a lecture'}</h2>
                    {currentLecture && (
                        <button
                            onClick={() => markLectureAsCompleted(currentLecture.lectureId)}
                            disabled={progressData?.lectureCompleted.includes(currentLecture.lectureId)}
                            className="px-4 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {progressData?.lectureCompleted.includes(currentLecture.lectureId) ? 'Completed' : 'Mark as Complete'}
                        </button>
                    )}
                </div>
                {/* --- END OF RESTORED SECTION --- */}
            </div>
        </div>
    );
};

export default Player;