import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";
import Cookies from "js-cookie";
import API_BASE_URL from "./config";

const libraries = ["places"];

const MapComponent = ({ apiKey }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [markers, setMarkers] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);
  const [detailID, setDetailId] = useState(null);
  const [user, setUser] = useState(null);
  const [journeyId, setJourneyId] = useState(null);
  const [journalPhoto, setJourneyPhoto] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      //const userStr = localStorage.getItem('user');
      const userStr = Cookies.get("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        console.log("User data loaded:", userData);
      }

      const pathArray = window.location.pathname.split("/");
      const id = pathArray[pathArray.length - 1];
      setJourneyId(id);

      try {
        // const response = await axios.get(
        //     `${API_BASE_URL}/details/${id}/allDetails`,
        //     {
        //         headers: {
        //             Authorization: `Bearer ${localStorage.getItem('authToken')}`
        //         }
        //     }
        // );
        const response = await axios.get(
          `${API_BASE_URL}/details/${id}/allDetails`,
          { withCredentials: true }
        );

        // Convert to all details to markers
        const existingMarkers = response.data.map((detail) => ({
          lat: detail.location.coordinates[1],
          lng: detail.location.coordinates[0],
          title: detail.journalText,
          image: detail.journalPhoto,
        }));

        setMarkers(existingMarkers);
        console.log("Loaded existing markers:", existingMarkers);
      } catch (error) {
        console.error("Error fetching existing details:", error);
      }
    };

    fetchDetails();
  }, []);

  const mapContainerStyle = {
    width: "100%",
    height: "500px",
  };
  const center = {
    lat: 49.1539,
    lng: -123.065,
  };

  // 修改：将 authToken 改为 token
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const handleMapClick = (event) => {
    if (selectedMarkerIndex !== null) {
      return;
    }

    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      title: "",
      image: "",
      time: new Date(),
      saved: false,
    };
    setMarkers((prev) => [...prev, newMarker]);
    setSelectedMarkerIndex(markers.length);
  };

  const handleTimeChange = (index, value) => {
    const updatedMarkers = [...markers];
    updatedMarkers[index].time = new Date(value);
    setMarkers(updatedMarkers);
  };

  const handleMarkerClick = (index) => {
    // 如果点击的是已经选中的 marker，取消选中
    if (index === selectedMarkerIndex) {
      setSelectedMarkerIndex(null);
    } else {
      // 否则选中点击的 marker
      setSelectedMarkerIndex(index);
    }
  };

  const handleMapClickOutside = (event) => {
    // 确保点击的不是 marker
    if (event.placeId || event.feature) {
      return;
    }

    // 如果没有选中的 marker，才创建新的
    if (selectedMarkerIndex === null) {
      handleMapClick(event);
    } else {
      // 否则取消选中
      setSelectedMarkerIndex(null);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      handleMapClick(location);
    }
  };

  const handleTitleChange = (index, value) => {
    const updatedMarkers = [...markers];
    updatedMarkers[index].title = value;
    setMarkers(updatedMarkers);
  };

  // const handleImageUpload = (index, event) => {
  //     const file = event.target.files[0];
  //     if (file) {
  //         const reader = new FileReader();
  //         reader.onloadend = () => {
  //             const updatedMarkers = [...markers];
  //             updatedMarkers[index].image = reader.result;
  //             setMarkers(updatedMarkers);
  //         };
  //         reader.readAsDataURL(file);
  //     }
  // };

  const handleSave = async (index) => {
    const marker = markers[index];

    try {
      console.log("Saving marker:", marker);
      console.log("User:", user);
      console.log("JourneyId:", journeyId);

      if (!user?.userName || !journeyId) {
        throw new Error("Missing user or journey information");
      }

      if (!marker.title?.trim()) {
        alert("Please enter journal text before saving");
        return;
      }

      const formData = new FormData();
      formData.append(
        "time",
        marker.time
          ? new Date(marker.time).toISOString()
          : new Date().toISOString()
      );
      formData.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [marker.lng, marker.lat],
        })
      );
      formData.append("journalText", marker.title);
      formData.append("journeyId", journeyId);
      if (journalPhoto) {
        formData.append("journalPhoto", journalPhoto);
      }

      console.log("Details Information:", formData);
      const response = await axios.post(
        `${API_BASE_URL}/details/${journeyId}/createDetails`,
        formData,
        { withCredentials: true }
      );

      const newDetailId = response.data._id;
      setDetailId(newDetailId);
      Cookies.set("currentDetailId", newDetailId);

      if (response.status === 201) {
        const updatedMarkers = [...markers];
        updatedMarkers[index] = {
          ...marker,
          detailId: newDetailId,
          saved: true,
        };
        setMarkers(updatedMarkers);

        console.log(updatedMarkers[index]);

        alert("Detail saved successfully");
        setSelectedMarkerIndex(null);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error saving marker:", error);
    }
  };

  const handleClose = () => {
    setSelectedMarkerIndex(null);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onClick={handleMapClickOutside}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={{ lat: marker.lat, lng: marker.lng }}
          onClick={() => handleMarkerClick(index)}
          // icon={marker.saved ? {
          //     url: 'path_to_saved_marker_icon',  // 可选：使用不同的图标
          //     scaledSize: new window.google.maps.Size(30, 30)
          // } : undefined}
        />
      ))}

      {selectedMarkerIndex !== null && (
        <div
          style={{
            position: "absolute",
            top: `${
              ((markers[selectedMarkerIndex].lat - center.lat) * 500) / 10 + 50
            }%`,
            left: `${
              ((markers[selectedMarkerIndex].lng - center.lng) * 500) / 10 + 50
            }%`,
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div>
            <div>
              <label>Time:</label>
              <input
                type="datetime-local"
                value={
                  markers[selectedMarkerIndex].time
                    ? new Date(markers[selectedMarkerIndex].time)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  handleTimeChange(selectedMarkerIndex, e.target.value)
                }
                style={{
                  width: "200px",
                  marginBottom: "10px",
                  padding: "5px",
                }}
              />
            </div>

            <textarea
              type="text"
              placeholder="Enter your memories here..."
              value={markers[selectedMarkerIndex].title}
              onChange={(e) =>
                handleTitleChange(selectedMarkerIndex, e.target.value)
              }
              style={{
                width: "200px",
                marginBottom: "10px",
                height: "100px",
                resize: "vertical",
                overflow: "auto",
              }}
            />
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setJourneyPhoto(e.target.files[0])}
              style={{ width: "200px", marginBottom: "10px" }}
            />
            {markers[selectedMarkerIndex].image && (
              <img
                src={markers[selectedMarkerIndex].image}
                alt="Uploaded Preview"
                style={{ width: "100px", height: "100px", marginTop: "10px" }}
              />
            )}
          </div>
          <button
            onClick={() => handleSave(selectedMarkerIndex)}
            style={{
              padding: "5px 10px",
              backgroundColor: "green",
              color: "white",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Save
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: "5px 10px",
              backgroundColor: "red",
              color: "white",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            Close
          </button>
        </div>
      )}

      <Autocomplete
        onLoad={(autocomplete) => setAutocomplete(autocomplete)}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          type="text"
          placeholder="Search location"
          style={{
            boxSizing: "border-box",
            border: "1px solid transparent",
            width: "240px",
            height: "32px",
            padding: "0 12px",
            borderRadius: "3px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
            fontSize: "14px",
            position: "absolute",
            left: "50%",
            marginLeft: "-120px",
          }}
        />
      </Autocomplete>
    </GoogleMap>
  );
};

export default MapComponent;
