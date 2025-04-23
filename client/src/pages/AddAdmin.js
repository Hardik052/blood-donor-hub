import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AddAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/add-admin",
        { email, password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Admin created successfully");
      setError("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add admin");
      setSuccess("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-red-700 tracking-tight flex items-center justify-center">
          <svg className="w-10 h-10 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2c-1.5 0-3 1.5-4 3.5C5 7.5 3 10 3 12a7 7 0 0014 0c0-2-2-4.5-3-6.5-1-2-2.5-3.5-4-3.5z" />
          </svg>
          Add New Admin
        </h1>
      </header>

      <div className="card max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              className="input-select"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="input-select"
              required
            />
          </div>
          {error && (
            <p className="alert bg-red-100 text-red-700 animate-fade-in">
              {error}
            </p>
          )}
          {success && (
            <p className="alert bg-green-100 text-green-700 animate-fade-in">
              {success}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Add Admin
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

export default AddAdmin;