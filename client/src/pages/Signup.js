import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css';

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("signup"); // "signup" or "verify"
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/signup", { email, password });
      setStep("verify");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign up");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/verify-otp", { email, otp });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
        {step === "signup" ? "Sign Up" : "Verify Email"}
      </h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
        {step === "signup" ? (
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
            >
              Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the OTP sent to your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
            >
              Verify OTP
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-gray-600">
          {step === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Back to{" "}
              <button
                onClick={() => setStep("signup")}
                className="text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Signup;