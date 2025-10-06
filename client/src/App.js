import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import SignIn from './SignIn';
import HomepageAfterLogin from './HomepageAfterLogin';
import ProfilePage from './ProfilePage';
import JourneyDetails from './JourneyDetails';
import SearchPage from './SearchPage';

function App() {
  const [userProfile, setUserProfile] = useState({
    id: '',
    theme: 'light',
  });

  const updateUserProfile = (updatedProfile) => {
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      ...updatedProfile,
    }));
  };

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignIn />} />
      <Route path="/homepageafterlogin" element={<HomepageAfterLogin />} />
      <Route
        path="/profile"
        element={<ProfilePage userProfile={userProfile} updateUserProfile={updateUserProfile} />}
      />
      <Route path="/journey/:id" element={<JourneyDetails />} />
      <Route path="/search" element={<SearchPage />} />
    </Routes>
  );
}

export default App;
