import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/EntrypermissionForm.css"; // Ensure the CSS file is correctly named
import Navbar from "./Navbar";

// const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com"; // deployment url

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

  useEffect(() => {
    console.log("Guard email:", guardEmail);
    if (!guardEmail) {
      setError("Please log in to access entry permissions.");
      setLoading(false);
      return;
    }

    fetchSocieties();
    fetchEntries();
    checkExpiringPermissions();
  }, [guardEmail]);

  useEffect(() => {
    if (selectedSociety) {
      fetchUsers();
    } else {
      setUsers([]);
      setFlats([]);
      setFlatNumber("");
      setEmail("");
    }
  }, [selectedSociety]);

  const fetchSocieties = async (retryCount = 3) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/societies?email=${guardEmail}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      console.log("Fetched societies:", response.data);
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
        let errorMessage = "Failed to fetch societies. Please check your connection or contact the server admin.";
        if (error.response?.status === 401) {
          errorMessage = "Unauthorized access. Please verify your guard login credentials.";
        } else if (error.response?.status === 404) {
          errorMessage = "No societies available. Contact the superadmin.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please contact the server admin.";
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (retryCount = 3) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/users/by-society/${selectedSociety}?email=${guardEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      console.log("Fetched users for society:", selectedSociety, response.data);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying fetchUsers... (${retryCount} attempts left)`);
        setTimeout(() => fetchUsers(retryCount - 1), 2000);
      } else {
        console.log("Failed to fetch users, but continuing without email autofill.");
        setUsers([]);
      }
    }
  };

  const fetchEntries = async (retryCount = 3) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/entries?email=${guardEmail}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      console.log("Fetched entries:", response.data);
      setEntries(response.data || []);
      if (response.data.length === 0) {
        console.log("No entries found for guard.");
      }
    } catch (error) {
      console.error("Error fetching entries:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying fetchEntries... (${retryCount} attempts left)`);
        setTimeout(() => fetchEntries(retryCount - 1), 2000);
      } else {
        let errorMessage = "Failed to fetch entries. Please check your connection or contact the server admin.";
        if (error.response?.status === 401) {
          errorMessage = "Unauthorized access. Please verify your guard login credentials.";
        } else if (error.response?.status === 404) {
          errorMessage = "No entries available.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please contact the server admin.";
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkExpiringPermissions = async (retryCount = 3) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/entries/expiring-soon?email=${guardEmail}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      console.log("Expiring entries:", res.data);
      if (res.data.length > 0) {
        res.data.forEach((entry) => {
          toast.warn(`Permission for ${entry.name} is expiring soon!`);
        });
      }
    } catch (error) {
      console.error("Error checking expiring permissions:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying checkExpiringPermissions... (${retryCount} attempts left)`);
        setTimeout(() => checkExpiringPermissions(retryCount - 1), 2000);
      } else {
        toast.error("Failed to check expiring permissions.");
      }
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
      (user) => user.flatNumber === flatNo && user.society && user.society._id === selectedSociety
    );
    console.log("Selected flat:", flatNo, "Found user:", user);
    setEmail(user ? user.email : "");
  };

  const handleSave = async () => {
    if (!name || !selectedSociety || !flatNumber || !visitorType || !description || !dateTime || !expiry || !status) {
      toast.error("All fields are required");
      return;
    }

    if (!guardEmail) {
      toast.error("Guard email is missing. Please log in.");
      return;
    }

    const entryDate = new Date(dateTime);
    const expiryDate = new Date(expiry);

    if (entryDate >= expiryDate) {
      toast.error("Expiry date must be after entry date");
      return;
    }

    const society = societies.find((soc) => soc._id === selectedSociety);
    if (!society?.adminEmail) {
      toast.error("Selected society has no associated admin. Please contact the superadmin.");
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
      adminEmail: society.adminEmail,
    };

    console.log("Saving entry with payload:", payload);

    setSaveLoading(true);
    try {
      if (editingId) {
        const res = await axios.put(`${BASE_URL}/api/entries/${editingId}`, payload);
        setEntries(entries.map((entry) => (entry._id === editingId ? res.data : entry)));
        toast.success("Entry updated successfully!");
        setEditingId(null);
      } else {
        const res = await axios.post(`${BASE_URL}/api/entries`, payload);
        setEntries([...entries, res.data]);
        toast.success("Entry added successfully!");
      }
      resetForm();
      await fetchEntries(); // Refresh entries after save
    } catch (error) {
      console.error("Error saving entry:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Server error: ${error.response?.status || "Unknown"}`;
      toast.error(errorMessage);
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
    setDateTime(entry.dateTime ? new Date(entry.dateTime).toISOString().slice(0, 16) : "");
    setExpiry(entry.additionalDateTime ? new Date(entry.additionalDateTime).toISOString().slice(0, 16) : "");
    setEditingId(entry._id);
  };

  const getSocietyId = (societyIdValue) => {
    if (!societyIdValue) return "";
    return typeof societyIdValue === "string" ? societyIdValue : (societyIdValue?._id?.toString() || "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/entries/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
      await fetchEntries(); // Refresh entries after delete
    } catch (error) {
      console.error("Error deleting entry:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Error deleting entry: " + (error.response?.data?.message || error.message));
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

  const filteredEntries = entries.filter((entry) => {
    const search = searchTerm.toLowerCase();
    return (
      (entry.name || "").toLowerCase().includes(search) ||
      (entry.visitorType || "").toLowerCase().includes(search) ||
      (entry.status || "").toLowerCase().includes(search) ||
      (entry.flatNumber || "").toLowerCase().includes(search)
    );
  });

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
          <p className="error-message">{error}</p>
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
            <form className="entry-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
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
            <p>Debug: Found {filteredEntries.length} entries (Total: {entries.length})</p>
            <div className="entries-list">
              {entries.length === 0 ? (
                <p>No entry permissions available. Add a new entry above.</p>
              ) : (
                filteredEntries.map((entry) => (
                  <div key={entry._id} className="entry-item">
                    <div className="entry-details">
                      <h4>{entry.name || "N/A"}</h4>
                      <p>
                        <strong>Society:</strong>{" "}
                        {(entry.societyId?.name || societies.find((soc) => soc._id === getSocietyId(entry.societyId))?.name) || "Unknown Society"}
                      </p>
                      <p><strong>Flat Number:</strong> {entry.flatNumber || "N/A"}</p>
                      <p><strong>Email:</strong> {entry.email || "N/A"}</p>
                      <p><strong>Visitor Type:</strong> {entry.visitorType || "N/A"}</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className={`status-${entry.status || "unknown"}`}>
                          {entry.status ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : "N/A"}
                        </span>
                      </p>
                      <p><strong>Description:</strong> {entry.description || "N/A"}</p>
                      <p>
                        <strong>Date & Time:</strong>{" "}
                        {entry.dateTime ? new Date(entry.dateTime).toLocaleString() : "N/A"}
                      </p>
                      <p>
                        <strong>Expiry:</strong>{" "}
                        {entry.additionalDateTime ? new Date(entry.additionalDateTime).toLocaleString() : "N/A"}
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
