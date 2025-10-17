import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";

const Hero = () => {
  const { navigate } = useContext(AppContext);

  return (
    // The new background gradient is applied here
    <div className="w-full bg-gradient-to-br from-purple-100 via-pink-50 to-red-100 pt-20 pb-10 md:pt-32 md:pb-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
          Unlock Your Potential with Academix
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Explore a wide range of courses taught by industry experts and take your skills to the next level.
        </p>
        {/* The button color is updated to match the new theme */}
        <button
          onClick={() => navigate("/course-list")}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform duration-150 active:scale-95"
        >
          Explore Courses
        </button>
      </div>
    </div>
  );
};

export default Hero;
