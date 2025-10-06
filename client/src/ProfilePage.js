import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './css/Profile.css'
import Cookies from 'js-cookie';
import Layout from './Layout';

function ProfilePage() {

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const navigate = useNavigate();


    const handleSave = async (e) => {
        e.preventDefault();
        console.log('Edit Profile', { userName, password, profilePicture });
        const formData = new FormData();

        formData.append("userName", userName); 
        formData.append("password", password);
        if (profilePicture) 
            formData.append('profilePicture', profilePicture);
        console.log(userName);
        console.log(password);
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }
        try {
            const response = await axios.put(
                `http://localhost:3000/users/${userName}`,
                formData, { withCredentials: true });
            const user = response.data;
            //localStorage.setItem('user', JSON.stringify(user));
            Cookies.set('user', JSON.stringify(user));
            console.log('User profile updated:', user);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile.');
        }
    };


    const handleDelete = (e) => {
        e.preventDefault();
        const userCookie = Cookies.get('user');
        if (!userCookie) {
            console.error('User not found in cookies.');
            return alert('User not logged in.');
        }
    
        const user = JSON.parse(userCookie);
        setUserName(user.userName);
    
        console.log('delete account', { userName: user.userName });
        axios
            .delete(`http://localhost:3000/users/${user.userName}`, { withCredentials: true })
            .then(() => {
                console.log('User account deleted.');
                Cookies.remove('user');
                navigate('/');
            })
            .catch((err) => {
                console.error('Error deleting account:', err);
                alert('Failed to delete account.');
            });
    };
    

    const handleGoBack = () => {
        navigate('/homepageafterlogin'); 
    };

    return (
        <Layout userName={userName}>
        <div className="profile-page">
            <div className='profile-edit-box'>
            <h1>Edit Profile</h1>
            <form onSubmit={handleSave}>
                <div>
                    <label for="userName">Name:</label>
                    <input className='profile-input'
                        type="text"
                        name="userName"
                        placeholder="User Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                </div>
                <div>
                    <label for="password">Password:</label>
                    <input className='profile-input'
                        type="password"
                        name="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label for="profile-img-input">Image:</label>
                    <input className='profile-img-input'
                        id="profile-img-input"
                        type="file"
                        onChange={(e) => setProfilePicture(e.target.files[0])}
                    />
                </div>
                    <button onClick={handleSave}>Save Changes</button>
                    <button onClick={handleDelete}>Delete My Account</button>
            </form>
            <button onClick={handleGoBack}>Back to Homepage</button>
            </div>
            <div className='profile-background'></div>
        </div>
        </Layout>
    );
}
export default ProfilePage;