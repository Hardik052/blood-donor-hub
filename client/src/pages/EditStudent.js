import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function EditStudent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bloodGroup: "",
    trade: "",
  });
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData(response.data);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load student data");
        navigate("/");
      }
    };
    fetchStudent();
  }, [id, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/students/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update student");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-red-700 tracking-tight flex items-center justify-center">
          <svg className="w-10 h-10 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2c-1.5 0-3 1.5-4 3.5C5 7.5 3 10 3 12a7 7 0 0014 0c0-2-2-4.5-3-6.5-1-2-2.5-3.5-4-3.5z" />
          </svg>
          Edit Donor
        </h1>
      </header>

      <div className="card max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter name"
              className="input-select"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              className="input-select"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Blood Group
            </label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleInputChange}
              className="input-select"
              required
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Trade
            </label>
            <input
              type="text"
              name="trade"
              value={formData.trade}
              onChange={handleInputChange}
              placeholder="e.g., CSE, IT"
              className="input-select"
              required
            />
          </div>
          {error && (
            <p className="alert bg-red-100 text-red-700 animate-fade-in">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Update Donor
          </button>
        </form>
        <button
          onClick={() => navigate("/")}
          className="btn-danger w-full mt-4"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default EditStudent;