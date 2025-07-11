import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./Navbar";
import "./styles/ServiceEntryForm.css";

// const BASE_URL = "http://localhost:5000";
const BASE_URL = "https://dec-entrykart-backend.onrender.com"; // Deployment URL

const ServiceEntryForm = () => {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const guardEmail = localStorage.getItem("guardEmail");
  const superadminEmail = "dec@gmail.com";

  useEffect(() => {
    if (!guardEmail) {
      setError("Please log in to access service entry form.");
      setLoading(false);
      return;
    }
    fetchSocieties();
    fetchEntries();
  }, [guardEmail]);

  const fetchSocieties = async (retryCount = 3) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=${superadminEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      setSocieties(response.data || []);
      if (response.data.length === 0) {
        setError("No societies found. Contact the superadmin.");
      }
    } catch (error) {
      console.error("Error fetching societies:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying fetchSocieties... (${retryCount} attempts left)`);
        setTimeout(() => fetchSocieties(retryCount - 1), 2000);
      } else {
        setError("Failed to fetch societies. Please check the server.");
        console.warn("Failed to fetch societies after retries.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (retryCount = 3) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/service-entries?adminEmail=${guardEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      setEntries(response.data || []);
      if (response.data.length === 0) {
        console.log("No service entries found for this guard.");
      }
    } catch (error) {
      console.error("Error fetching service entries:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.status === 400) {
        setError("Invalid request. Please check your login credentials.");
      } else if (retryCount > 0) {
        console.log(`Retrying fetchEntries... (${retryCount} attempts left)`);
        setTimeout(() => fetchEntries(retryCount - 1), 2000);
      } else {
        setError("Failed to fetch service entries. Please check the server.");
        console.warn("Failed to fetch service entries after retries.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name || !phoneNumber || !selectedSociety || !visitorType) {
      toast.error("All required fields must be filled");
      return;
    }

    if (!guardEmail) {
      toast.error("Guard email is missing. Please log in.");
      return;
    }

    setSaveLoading(true);
    try {
      let photoData = photoPreview;
      if (photo && !editingId) {
        photoData = photoPreview;
      }

      const payload = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        societyId: selectedSociety,
        visitorType,
        description: description.trim(),
        photo: photoData,
        adminEmail: guardEmail, // Use guardEmail as adminEmail
        status,
      };

      if (editingId) {
        const res = await axios.put(`${BASE_URL}/api/service-entries/${editingId}`, payload);
        setEntries(entries.map((entry) => (entry._id === editingId ? res.data : entry)));
        toast.success("Entry updated successfully!");
        setEditingId(null);
      } else {
        const res = await axios.post(`${BASE_URL}/api/service-entries`, payload);
        setEntries([...entries, res.data]); // Add new entry to state immediately
        toast.success("Entry added successfully!");
      }
      resetForm();
      await fetchEntries(); // Refresh entries after save
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Server error: ${error.response?.status}`;
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      const res = await axios.put(`${BASE_URL}/api/service-entries/${id}`, { status: "checked-in" });
      setEntries(entries.map((entry) => (entry._id === id ? res.data : entry)));
      toast.success("Checked in successfully!");
    } catch (error) {
      toast.error("Error checking in");
    }
  };

  const handleCheckOut = async (id) => {
    try {
      const res = await axios.put(`${BASE_URL}/api/service-entries/${id}`, { status: "checked-out" });
      setEntries(entries.map((entry) => (entry._id === id ? res.data : entry)));
      toast.success("Checked out successfully!");
    } catch (error) {
      toast.error("Error checking out");
    }
  };

  const handleEdit = (entry) => {
    setName(entry.name || "");
    setPhoneNumber(entry.phoneNumber || "");
    setSelectedSociety(entry.societyId?._id || "");
    setVisitorType(entry.visitorType || "");
    setDescription(entry.description || "");
    setPhoto(null);
    setPhotoPreview(entry.photo || "");
    setStatus(entry.status || "pending");
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/service-entries/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
      await fetchEntries();
    } catch (error) {
      toast.error("Error deleting entry");
    }
  };

  const resetForm = () => {
    setName("");
    setPhoneNumber("");
    setSelectedSociety("");
    setVisitorType("");
    setDescription("");
    setPhoto(null);
    setPhotoPreview("");
    setStatus("pending");
    setEditingId(null);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.visitorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="service-entry-form-container">
        <div className="entry-card">
          <div className="form-title">Service Entry Form</div>
          {error && <p className="error-message">{error}</p>}
          <div className="entry-form-content">
            <form className="entry-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                required
              />
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                className="input-field"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter Phone Number"
                required
              />
              <label htmlFor="society">Society *</label>
              <select
                id="society"
                className="input-field select-field"
                value={selectedSociety}
                onChange={(e) => setSelectedSociety(e.target.value)}
                required
              >
                <option value="">Select Society</option>
                {societies.map((society) => (
                  <option key={society._id} value={society._id}>
                    {society.name}
                  </option>
                ))}
              </select>
              <label htmlFor="visitor-type">Visitor Type *</label>
              <select
                id="visitor-type"
                className="input-field select-field"
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value)}
                required
              >
                <option value="">Select Visitor Type</option>
                <option value="Newspaper Boy">Newspaper Boy</option>
                <option value="Postman">Postman</option>
                <option value="Other">Other</option>
              </select>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Description"
                rows="3"
              />
              <label htmlFor="photo">Photo</label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                className="input-field"
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="photo-preview"
                  style={{ width: "100px", height: "100px", marginTop: "10px" }}
                />
              )}
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                className="input-field select-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="pending">Pending</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
              </select>
              <div className="decision-buttons">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : editingId ? "Update Entry" : "Add Entry"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="submit-btn cancel-btn"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        <div className="entry-card" style={{ marginTop: "20px" }}>
          <div className="form-title">Service Entries</div>
          <div className="entry-form-content">
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              aria-label="Search entries"
              style={{ marginBottom: "20px" }}
            />
            {loading ? (
              <p>Loading entries...</p>
            ) : filteredEntries.length === 0 ? (
              <p>No service entries found.</p>
            ) : (
              <div className="entries-list">
                {filteredEntries.map((entry) => (
                  <div key={entry._id} className="entry-item">
                    <div className="entry-details">
                      <h4>{entry.name}</h4>
                      {entry.photo && (
                        <img
                          src={entry.photo}
                          alt={entry.name}
                          className="entry-photo"
                          style={{ width: "100px", height: "100px", objectFit: "cover" }}
                        />
                      )}
                      <p><strong>Society:</strong> {entry.societyId?.name || "N/A"}</p>
                      <p><strong>Phone Number:</strong> {entry.phoneNumber}</p>
                      <p><strong>Visitor Type:</strong> {entry.visitorType}</p>
                      <p><strong>Status:</strong> {entry.status}</p>
                      <p><strong>Check-In:</strong> {entry.checkInTime ? new Date(entry.checkInTime).toLocaleString() : "N/A"}</p>
                      <p><strong>Check-Out:</strong> {entry.checkOutTime ? new Date(entry.checkOutTime).toLocaleString() : "N/A"}</p>
                      <p><strong>Description:</strong> {entry.description || "N/A"}</p>
                    </div>
                    <div className="entry-actions">
                      {entry.status !== "checked-out" && (
                        <>
                          <button
                            className="submit-btn check-in-btn"
                            onClick={() => handleCheckIn(entry._id)}
                            disabled={entry.status === "checked-in"}
                          >
                            Check In
                          </button>
                          <button
                            className="submit-btn check-out-btn"
                            onClick={() => handleCheckOut(entry._id)}
                            disabled={entry.status !== "checked-in"}
                          >
                            Check Out
                          </button>
                        </>
                      )}
                      <button
                        className="submit-btn edit-btn"
                        onClick={() => handleEdit(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(entry._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default ServiceEntryForm;