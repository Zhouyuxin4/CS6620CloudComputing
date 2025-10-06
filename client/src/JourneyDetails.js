import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MapComponent from './MapComponent';
import axios from 'axios';  
import Layout from './Layout';
import Cookies from 'js-cookie';
import './css/JourneyDetails.css';

function JourneyDetails() {
    const { id } = useParams();
    const [journey, setJourney] = useState('');

    const [newTitle, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [details, setDetails] = useState([]); 
    const [userName, setUserName] = useState('');
    const [markers, setMarkers] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const data = location.state;
    const [currentTitle, setCurrentTitle] = useState(location.state?.title || 'My New Journey');
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingDetailId, setEditingDetailId] = useState(null);
    const [editForm, setEditForm] = useState({
        journalText: '',
        journalPhoto: null
    });

    const handleStartEdit = (detail) => {
        setEditingDetailId(detail._id);
        setEditForm({
            journalText: detail.journalText || '',
            journalPhoto: detail.journalPhoto || null
        });
    };

    const handleCancelEdit = () => {
        setEditingDetailId(null);
        setEditForm({
            journalText: '',
            journalPhoto: null
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'journalPhoto' && files) {
            setEditForm(prev => ({
                ...prev,
                journalPhoto: files[0]
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSaveEdit = async (detailId) => {
        try {
            // 创建更新数据对象，而不是 FormData
            const updateData = {
                
                journalText: editForm.journalText
            };
    
            console.log('Sending update request:', {
                detailId,
                updateData
            });
    
            const response = await axios.put(
                `http://localhost:3000/details/${id}/${detailId}/update`,
                updateData,  // 直接发送对象
                {withCredentials: true});
    
            if (response.status === 200) {
                alert('Stop updated successfully');
                setEditingDetailId(null);
                fetchJourneyDetails();
            }
        } catch (error) {
            console.error('Error updating detail:', error);
            console.log('Error details:', error.response);
            alert('Failed to update stop');
        }
    };

    const fetchJourneyDetails = async () => {
        try {

            const response = await axios.get(
                `http://localhost:3000/details/${id}/allDetails`,
                {withCredentials: true});

            setDetails(response.data);
            console.log('Fetched details:', response.data);

        } catch (error) {
            console.error('Error fetching journey details:', error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchJourneyDetails();
        }

        const loginUser = Cookies.get('user');
        if (loginUser) {
            const user = JSON.parse(loginUser);
            setUserName(user.userName);
        }

    }, [id]);

    const handleDeleteDetail = async (detailId) => {
        // 添加确认提示
        const isConfirmed = window.confirm('Are you sure you want to delete this stop?');
        
        if (!isConfirmed) {
            return;
        }

        try {
            console.log(`http://localhost:3000/details/${id}/${detailId}`);
            const response = await axios.delete(
                `http://localhost:3000/details/${id}/${detailId}`, {withCredentials: true}
            );

            if (response.status === 200) {
                alert('Stop deleted successfully');
                fetchJourneyDetails();
            }
        } catch (error) {
            console.error('Error deleting detail:', error);
            alert('Failed to delete stop');
        }
    };

    const handleDetailsUpdate = () => {
        fetchJourneyDetails();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();  
        alert('Do you confirm the change?');
    };

    const handleGoBack = () => {
        navigate('/homepageafterlogin');
    };

    //Update the Journey Title
    const handleUpdateJourney = async () => {
        try {

            //Title cannot be empty
            if (!newTitle.trim()) {
                alert('Title cannot be empty');
                return; 
            }

            const response = await axios.put(
                `http://localhost:3000/journeys/${id}`,
                {
                    title: newTitle,
                }, {withCredentials: true});

            if (response.status === 200) {
                alert('Journey updated successfully');
                setCurrentTitle(newTitle);
                setAddress('');
                navigate('/homepageafterlogin');
            }

        } catch (error) {
            console.error('Error updating journey:', error);
            alert('Failed to updating journey');
        }
    };

    //Delete The Journey
    const handleDeleteJourney = async () => {
        const isConfirmed = window.confirm('Are you sure you want to delete this journey?');

        if (!isConfirmed) {
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.delete(
                `http://localhost:3000/journeys/${user.userName}/${id}`, {withCredentials: true});

            if (response.status === 200) {
                alert('Journey deleted successfully');
                navigate('/homepageafterlogin');
            }

        } catch (error) {
            console.error('Error deleting journey:', error);
            alert('Failed to delete journey');
        }
    };

    return (
        <Layout userName={userName}>
        <div className="journey-details">
            <h1>Details of {currentTitle}</h1>
            <form className='journey-update-box' onSubmit={handleSubmit}>
                <div>
                    <input className='journey-update-title'
                        type="text"
                        placeholder="edit your journey title here"
                        value={newTitle}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                    />
                </div>
    
                <button onClick={handleUpdateJourney}>Update Journey Title</button>
            </form>

            <div className='details-container'>
            <MapComponent apiKey="AIzaSyBvjss2rrxy8HRCt-Yu6dnKRoUpX35wKh8"/>

            <div className="details-list">
                {details.length > 0 ? (
                    details.map((detail, index) => (
                        <div key={detail._id} className="detail-item">
                            <div className="detail-content">
                                <h2>Stop {index + 1}</h2>
    
                            {editingDetailId === detail._id ? (
                                <div className="edit-form">
                                    <textarea  className='journey-text'
                                        name="journalText"
                                        value={editForm.journalText}
                                        onChange={handleEditFormChange}
                                        placeholder="Enter journal text"
                                    />

                                </div>
                            ) : (
                                <>
                                    <p><strong>Location:</strong> {
                                        detail.location?.coordinates ? 
                                        `Latitude: ${detail.location.coordinates[1].toFixed(4)}, Longitude: ${detail.location.coordinates[0].toFixed(4)}` :
                                        'Location not available'
                                    }</p>
    
                                    <p><strong>Time:</strong> {
                                                new Date(detail.time).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                    }</p>
    
                                    <p><strong>Journal:</strong> {detail.journalText || 'No journal entry'}</p>
    
                                    {detail.journalPhoto && detail.journalPhoto !== "" && (
                                        <>
                                            <div className="photo-container">
                                                <img 
                                                    src={detail.journalPhoto} 
                                                    alt={`Photo for stop ${index + 1}`}
                                                    style={{ maxWidth: '200px' }}
                                                    onClick={() => setSelectedImage(detail.journalPhoto)}  
                                                />
                                            </div>

                                            {selectedImage && (
                                                <div 
                                                    className="modal-overlay"
                                                    onClick={() => setSelectedImage(null)}
                                                >
                                                    <img 
                                                        src={selectedImage}
                                                        alt="Enlarged view"
                                                        className="modal-image"
                                                        onClick={(e) => e.stopPropagation()}  
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="detail-actions">
                                    {editingDetailId === detail._id ? (
                                        <>
                                            <button className='save-button'
                                                onClick={() => handleSaveEdit(detail._id)}
                                            >
                                                Save
                                            </button>
                                            <button className='cancel-button'
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className='edit-button'
                                                onClick={() => handleStartEdit(detail)}
                                            >
                                                Edit
                                            </button>
                                            <button className='delete-button'
                                                onClick={() => handleDeleteDetail(detail._id)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                    ))
                ) : (
                    <p>No details added to this journey yet.</p>
                )}
            </div>
            </div>
            <h3></h3>
    
            <div className='detail-button'>
            <button className='delete-journey-button' onClick={handleDeleteJourney}>Delete Journey</button>
            <button onClick={handleGoBack}>Back to My Homepage</button>
            </div>

        </div>
        </Layout>
    );
    

}

export default JourneyDetails;
