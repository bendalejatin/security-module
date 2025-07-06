import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/EntrypermissionForm.css";
import Navbar from "./Navbar";

const BASE_URL = "https://dec-entrykart-backend.onrender.com"; // Deployment URL
const SUPERADMIN_EMAIL = "dec@gmail.com"; // Fallback email for fetching societies and entries

const EntryPermissionForm = () => {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [flats, setFlats] = useState([]);
  const [flatNumber, setFlatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [visitorType, setVisitorType] = useState("");
  const [status, setStatus] = useState("pending");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);

  const guardEmail = localStorage.getItem("guardEmail");
  const guardToken = localStorage.getItem("guardToken");

  useEffect(() => {
    if (!guardEmail || !guardToken) {
      setError("Please log in to access entry permissions.");
      setLoading(false);
      window.location.href = "/security/login";
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/guard/guard-profile`, {
          headers: { Authorization: `Bearer ${guardToken}` },
        });
        console.log("Guard profile response:", response.data); // Debugging
        fetchSocieties();
        fetchUsers();
        fetchEntries();
        checkExpiringPermissions();
      } catch (error) {
        console.error("Token verification failed:", error.response || error);
        setError("Invalid or expired session. Please log in again.");
        setLoading(false);
        localStorage.removeItem("guardToken");
        localStorage.removeItem("guardEmail");
        localStorage.removeItem("securityToken");
        window.location.href = "/security/login";
      }
    };

    verifyToken();
  }, [guardEmail, guardToken]);

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=${SUPERADMIN_EMAIL}`,
        { headers: { Authorization: `Bearer ${guardToken}` } }
      );
      console.log("Societies response:", response.data); // Debugging
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid societies data format");
      }
      setSocieties(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching societies:", error.response || error);
      setError("Failed to fetch societies: " + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/users?email=${SUPERADMIN_EMAIL}`,
        { headers: { Authorization: `Bearer ${guardToken}` } }
      );
      console.log("Users response:", response.data); // Debugging
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid users data format");
      }
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error.response || error);
      setError("Failed to fetch users: " + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/entries?email=${SUPERADMIN_EMAIL}`,
        {
          headers: {
            Authorization: `Bearer ${guardToken}`,
            "Cache-Control": "no-cache",
          },
        }
      );
      console.log("Entries response:", response.data); // Debugging
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid entries data format");
      }
      setEntries(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching entries:", error.response || error);
      toast.error("Failed to fetch entries: " + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const checkExpiringPermissions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/entries/expiring-soon`, {
        headers: { Authorization: `Bearer ${guardToken}` },
      });
      console.log("Expiring permissions response:", res.data); // Debugging
      if (res.data.length > 0) {
        res.data.forEach((entry) => {
          toast.warn(`Permission for ${entry.name} is expiring soon!`);
        });
      }
    } catch (error) {
      console.error("Error checking expiring permissions:", error.response || error);
      toast.error("Failed to check expiring permissions: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSocietyChange = (societyId) => {
    setSelectedSociety(societyId);
    const society = societies.find((soc) => soc._id === societyId);
    setFlats(society ? society.flats : []);
    setFlatNumber("");
    setEmail("");
  };

  const handleFlatChange = (flatNo) => {
    setFlatNumber(flatNo);
    const user = users.find(
      (user) =>
        user.flatNumber === flatNo &&
        user.society &&
        user.society._id === selectedSociety
    );
    setEmail(user ? user.email : "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (
      !name ||
      !selectedSociety ||
      !flatNumber ||
      !visitorType ||
      !description ||
      !dateTime ||
      !expiry ||
      !status
    ) {
      toast.error("All fields are required");
      return;
    }

    if (!guardEmail) {
      toast.error("Guard email is missing. Please log in.");
      window.location.href = "/security/login";
      return;
    }

    const entryDate = new Date(dateTime);
    const expiryDate = new Date(expiry);

    if (entryDate >= expiryDate) {
      toast.error("Expiry date must be after entry date");
      return;
    }

    const expirationDate = new Date(dateTime);
    expirationDate.setDate(expirationDate.getDate() + 7);

    const payload = {
      name: name.trim(),
      flatNumber: flatNumber.trim(),
      dateTime,
      description: description.trim(),
      additionalDateTime: expiry,
      expirationDateTime: expirationDate.toISOString(),
      email,
      visitorType,
      status,
      societyId: selectedSociety,
      adminEmail: guardEmail,
    };

    setSaveLoading(true);
    try {
      if (editingId) {
        const res = await axios.put(
          `${BASE_URL}/api/entries/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${guardToken}` } }
        );
        setEntries(
          entries.map((entry) => (entry._id === editingId ? res.data : entry))
        );
        toast.success("Entry updated successfully!");
        setEditingId(null);
      } else {
        const res = await axios.post(`${BASE_URL}/api/entries`, payload, {
          headers: { Authorization: `Bearer ${guardToken}` },
        });
        setEntries([...entries, res.data]);
        toast.success("Entry added successfully!");
      }
      resetForm();
      await fetchEntries();
    } catch (error) {
      console.error("Error saving entry:", error.response || error);
      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Error saving entry: " + error.message);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (entry) => {
    const societyId = getSocietyId(entry.societyId);
    setName(entry.name || "");
    setSelectedSociety(societyId);
    const society = societies.find((soc) => soc._id === societyId);
    setFlats(society ? society.flats : []);
    setFlatNumber(entry.flatNumber || "");
    setEmail(entry.email || "");
    setVisitorType(entry.visitorType || "");
    setStatus(entry.status || "pending");
    setDescription(entry.description || "");
    setDateTime(
      entry.dateTime ? new Date(entry.dateTime).toISOString().slice(0, 16) : ""
    );
    setExpiry(
      entry.additionalDateTime
        ? new Date(entry.additionalDateTime).toISOString().slice(0, 16)
        : ""
    );
    setEditingId(entry._id);
  };

  const getSocietyId = (societyIdValue) => {
    if (!societyIdValue) return "";
    return typeof societyIdValue === "string"
      ? societyIdValue
      : societyIdValue?._id || "";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/entries/${id}`, {
        headers: { Authorization: `Bearer ${guardToken}` },
      });
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
      await fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", error.response || error);
      toast.error(
        "Error deleting entry: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const resetForm = () => {
    if (editingId && !window.confirm("Are you sure you want to cancel editing?")) {
      return;
    }
    setName("");
    setSelectedSociety("");
    setFlats([]);
    setFlatNumber("");
    setEmail("");
    setVisitorType("");
    setStatus("pending");
    setDescription("");
    setDateTime("");
    setExpiry("");
    setEditingId(null);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.visitorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">
          <h2>Loading...</h2>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-form-container">
        <Navbar />
        <div className="entry-card">
          <p>{error}</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="entry-form-container">
        <div className="entry-card">
          <div className="form-title">Entry Permission Form</div>
          <div className="entry-form-content">
            <form className="entry-form" onSubmit={handleSave}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Visitor Name"
                required
                aria-label="Visitor Name"
              />

              <label htmlFor="society">Society *</label>
              <select
                id="society"
                className="input-field select-field"
                value={selectedSociety}
                onChange={(e) => handleSocietyChange(e.target.value)}
                required
                aria-label="Select Society"
              >
                <option value="">Select Society</option>
                {societies.map((society) => (
                  <option key={society._id} value={society._id}>
                    {society.name}
                  </option>
                ))}
              </select>

              <label htmlFor="flat-number">Flat Number *</label>
              <select
                id="flat-number"
                className="input-field select-field"
                value={flatNumber}
                onChange={(e) => handleFlatChange(e.target.value)}
                disabled={!selectedSociety}
                required
                aria-label="Select Flat Number"
              >
                <option value="">Select Flat</option>
                {flats.map((flat) => (
                  <option key={flat} value={flat}>
                    {flat}
                  </option>
                ))}
              </select>

              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="input-field"
                value={email}
                readOnly
                placeholder="Email"
                aria-label="Email (read-only)"
              />

              <label htmlFor="visitor-type">Visitor Type *</label>
              <select
                id="visitor-type"
                className="input-field select-field"
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value)}
                required
                aria-label="Select Visitor Type"
              >
                <option value="">-- Select Visitor Type --</option>
                <option value="Guest">Guest</option>
                <option value="Swiggy/Zomato">Swiggy/Zomato</option>
                <option value="Maid">Maid</option>
                <option value="Other">Other</option>
              </select>

              <label htmlFor="status">Status *</label>
              <select
                id="status"
                className="input-field select-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                aria-label="Select Status"
              >
                <option value="pending">Pending</option>
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </select>

              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Description"
                rows="3"
                required
                aria-label="Description"
              />

              <label htmlFor="datetime">Date & Time *</label>
              <input
                type="datetime-local"
                id="datetime"
                className="input-field"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                aria-label="Entry Date and Time"
              />

              <label htmlFor="expiry">Expiry Date & Time *</label>
              <input
                type="datetime-local"
                id="expiry"
                className="input-field"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
                aria-label="Expiry Date and Time"
              />

              <div className="decision-buttons">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={saveLoading}
                >
                  {saveLoading
                    ? "Saving..."
                    : editingId
                    ? "Update Entry"
                    : "Add Entry"}
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
          <div className="form-title">Entry Permissions</div>
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

            <div className="entries-list">
              {filteredEntries.length === 0 ? (
                <p>No entry permissions found.</p>
              ) : (
                filteredEntries.map((entry) => (
                  <div key={entry._id} className="entry-item">
                    <div className="entry-details">
                      <h4>{entry.name}</h4>
                      <p>
                        <strong>Society:</strong>{" "}
                        {societies.find(
                          (soc) => soc._id === getSocietyId(entry.societyId)
                        )?.name || "N/A"}
                      </p>
                      <p>
                        <strong>Flat Number:</strong> {entry.flatNumber}
                      </p>
                      <p>
                        <strong>Email:</strong> {entry.email || "N/A"}
                      </p>
                      <p>
                        <strong>Visitor Type:</strong> {entry.visitorType}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className={`status-${entry.status}`}>
                          {entry.status?.charAt(0).toUpperCase() +
                            entry.status?.slice(1)}
                        </span>
                      </p>
                      <p>
                        <strong>Description:</strong> {entry.description}
                      </p>
                      <p>
                        <strong>Date & Time:</strong>{" "}
                        {new Date(entry.dateTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Expiry:</strong>{" "}
                        {new Date(entry.additionalDateTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="entry-actions">
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default EntryPermissionForm;