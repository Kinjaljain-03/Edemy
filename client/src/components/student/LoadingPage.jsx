import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Loading from './Loading';

const LoadingPage = () => {
  const navigate = useNavigate();
  const { fetchUserEnrolledCourses, fetchUserData } = useContext(AppContext);

  useEffect(() => {
    const updateAndRedirect = async () => {
      // Give the database a moment to save the enrollment
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Force a refresh of the user's data and their enrolled courses
      if(fetchUserData) await fetchUserData();
      if(fetchUserEnrolledCourses) await fetchUserEnrolledCourses();
      
      // Navigate to the enrollments page to see the result
      navigate('/my-enrollments');
    };

    updateAndRedirect();
  }, [fetchUserEnrolledCourses, fetchUserData, navigate]);

  return <Loading />;
};

export default LoadingPage;