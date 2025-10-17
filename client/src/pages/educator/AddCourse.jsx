import React, { useContext, useEffect, useRef, useState } from "react";
import uniqid from "uniqid";
import Quill from "quill";
import "quill/dist/quill.snow.css"; // Make sure to import Quill's CSS
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const AddCourse = () => {
  const { backendUrl, getToken } = useContext(AppContext);

  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [notesUrl, setNotesUrl] = useState("");

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
  });

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name:");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters((prevChapters) => [...prevChapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters((prevChapters) =>
        prevChapters.filter((chapter) => chapter.chapterId !== chapterId)
      );
    } else if (action === "toggle") {
      setChapters((prevChapters) =>
        prevChapters.map((chapter) =>
          chapter.chapterId === chapterId
            ? { ...chapter, collapsed: !chapter.collapsed }
            : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters((prevChapters) =>
        prevChapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            const updatedContent = chapter.chapterContent.filter(
              (_, index) => index !== lectureIndex
            );
            return { ...chapter, chapterContent: updatedContent };
          }
          return chapter;
        })
      );
    }
  };

  // --- THIS FUNCTION HAS BEEN CORRECTED ---
  const addLecture = () => {
    // Use the functional update form to ensure we have the latest state
    setChapters((prevChapters) =>
      prevChapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder:
              chapter.chapterContent.length > 0
                ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
                : 1,
            lectureId: uniqid(),
          };
          // Return a new chapter object with the new lecture array
          return {
            ...chapter,
            chapterContent: [...chapter.chapterContent, newLecture],
          };
        }
        return chapter;
      })
    );

    setShowPopup(false);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!thumbnailUrl) {
        return toast.error("Thumbnail URL is required");
      }

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
        courseThumbnail: thumbnailUrl,
        notesUrl: notesUrl,
      };

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        courseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setCourseTitle("");
        setCoursePrice(0);
        setDiscount(0);
        setThumbnailUrl("");
        setNotesUrl("");
        setChapters([]);
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            ["link", "image"],
            [{ list: "ordered" }, { list: "bullet" }],
          ],
        },
      });
    }
  }, []);

  return (
    <div className="h-screen overflow-y-auto flex flex-col items-start p-4 md:p-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-xl w-full text-gray-500"
      >
        <div className="flex flex-col gap-1">
          <p>Course Title</p>
          <input
            onChange={(e) => setCourseTitle(e.target.value)}
            value={courseTitle}
            type="text"
            placeholder="e.g., Introduction to Web Development"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-400"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <p>Course Description</p>
          <div ref={editorRef} className="bg-white"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <p>Course Price</p>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <p>Discount %</p>
            <input
              onChange={(e) => setDiscount(e.target.value)}
              value={discount}
              type="number"
              placeholder="0"
              min={0}
              max={100}
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-400"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p>Course Thumbnail URL</p>
          <input
            onChange={(e) => setThumbnailUrl(e.target.value)}
            value={thumbnailUrl}
            type="text"
            placeholder="https://example.com/image.png"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-400"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <p>Notes URL (Optional)</p>
          <input
            onChange={(e) => setNotesUrl(e.target.value)}
            value={notesUrl}
            type="text"
            placeholder="https://docs.google.com/..."
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-400"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Course Content
          </h3>
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapter.chapterId} className="bg-gray-50 border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
                  <img
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                    src={assets.dropdown_icon}
                    width={14}
                    alt="toggle"
                    className={`cursor-pointer transition-transform ${
                      chapter.collapsed && "-rotate-90"
                    }`}
                  />
                  <span className="font-semibold text-gray-800">
                    {chapterIndex + 1}. {chapter.chapterTitle}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <img
                    onClick={() => handleChapter("remove", chapter.chapterId)}
                    src={assets.cross_icon}
                    alt="remove chapter"
                    className="cursor-pointer w-4 h-4"
                  />
                </div>
              </div>
              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div
                      key={lecture.lectureId}
                      className="flex justify-between items-center mb-2 text-sm"
                    >
                      <span className="text-gray-700">
                        {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
                        {lecture.lectureDuration} mins
                      </span>
                      <img
                        src={assets.cross_icon}
                        alt="remove lecture"
                        onClick={() =>
                          handleLecture("remove", chapter.chapterId, lectureIndex)
                        }
                        className="cursor-pointer w-3.5 h-3.5"
                      />
                    </div>
                  ))}
                  <div
                    className="inline-flex text-purple-600 font-medium p-2 rounded cursor-pointer mt-2 text-sm"
                    onClick={() => handleLecture("add", chapter.chapterId)}
                  >
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          <div
            className="flex justify-center items-center bg-purple-100 text-purple-700 p-2 rounded-lg cursor-pointer font-semibold"
            onClick={() => handleChapter("add")}
          >
            + Add Chapter
          </div>

          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white text-gray-700 p-6 rounded-lg shadow-lg relative w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add Lecture</h2>
                <div className="space-y-4">
                  <div>
                    <p>Lecture Title</p>
                    <input
                      type="text"
                      className="mt-1 block w-full border rounded py-2 px-3"
                      value={lectureDetails.lectureTitle}
                      onChange={(e) =>
                        setLectureDetails((prev) => ({
                          ...prev,
                          lectureTitle: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <p>Duration (minutes)</p>
                    <input
                      type="number"
                      className="mt-1 block w-full border rounded py-2 px-3"
                      value={lectureDetails.lectureDuration}
                      onChange={(e) =>
                        setLectureDetails((prev) => ({
                          ...prev,
                          lectureDuration: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <p>Lecture URL</p>
                    <input
                      type="text"
                      className="mt-1 block w-full border rounded py-2 px-3"
                      value={lectureDetails.lectureUrl}
                      onChange={(e) =>
                        setLectureDetails((prev) => ({
                          ...prev,
                          lectureUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-preview-free"
                      className="h-4 w-4"
                      checked={lectureDetails.isPreviewFree}
                      onChange={(e) =>
                        setLectureDetails((prev) => ({
                          ...prev,
                          isPreviewFree: e.target.checked,
                        }))
                      }
                    />
                    <label htmlFor="is-preview-free">Is Preview Free?</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-md"
                    onClick={() => setShowPopup(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md"
                    onClick={addLecture}
                  >
                    Add Lecture
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-black text-white w-max py-2.5 px-8 rounded my-4 font-semibold"
        >
          ADD COURSE
        </button>
      </form>
    </div>
  );
};

export default AddCourse;
