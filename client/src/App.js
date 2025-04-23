import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import AddStudent from "./pages/AddStudent";
import EditStudent from "./pages/EditStudent";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddAdmin from "./pages/AddAdmin";
import MyRequests from "./pages/MyRequests";

function AcceptRequest() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const acceptRequest = async () => {
      try {
        await axios.get(`http://localhost:5000/api/accept-request/${requestId}`);
        alert("Request accepted. The requester will see your response in their 'My Requests' page.");
        navigate("/login");
      } catch (error) {
        alert(error.response?.data?.message || "Failed to accept request");
        navigate("/login");
      }
    };
    acceptRequest();
  }, [requestId, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="animate-pulse text-gray-600 text-lg font-medium">Processing request...</div>
    </div>
  );
}

function RejectRequest() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const rejectRequest = async () => {
      try {
        await axios.get(`http://localhost:5000/api/reject-request/${requestId}`);
        alert("Request rejected.");
        navigate("/login");
      } catch (error) {
        alert(error.response?.data?.message || "Failed to reject request");
        navigate("/login");
      }
    };
    rejectRequest();
  }, [requestId, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="animate-pulse text-gray-600 text-lg font-medium">Processing request...</div>
    </div>
  );
}

function Home() {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [students, setStudents] = useState([]);
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const url = selectedBloodGroup
          ? `http://localhost:5000/api/bloodgroup/${selectedBloodGroup}`
          : "http://localhost:5000/api/students";
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login");
        } else if (error.response?.status === 404) {
          setStudents([]);
        }
      }
    };
    fetchStudents();
  }, [selectedBloodGroup, navigate]);

  const handleBloodGroupChange = (event) => {
    setSelectedBloodGroup(event.target.value);
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      alert("Only admins can delete students");
      return;
    }
    if (window.confirm("Are you sure you want to delete this donor?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(students.filter((student) => student._id !== id));
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete student");
      }
    }
  };

  const handleRequestBlood = async () => {
    if (!selectedBloodGroup) {
      alert("Please select a blood group to request.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/request-blood",
        { bloodGroup: selectedBloodGroup },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUserRole(null);
    navigate("/login");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-red-700 tracking-tight flex items-center">
          <svg className="w-10 h-10 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2c-1.5 0-3 1.5-4 3.5C5 7.5 3 10 3 12a7 7 0 0014 0c0-2-2-4.5-3-6.5-1-2-2.5-3.5-4-3.5z" />
          </svg>
          Blood Donor Hub
        </h1>
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <button
            onClick={() => navigate("/my-requests")}
            className="btn-secondary"
          >
            My Requests
          </button>
          <button
            onClick={handleLogout}
            className="btn-danger"
          >
            Logout
          </button>
        </div>
      </header>

      {userRole === "admin" && (
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <button
            onClick={() => navigate("/add-student")}
            className="btn-primary"
          >
            Add New Donor
          </button>
          <button
            onClick={() => navigate("/add-admin")}
            className="btn-primary"
          >
            Add New Admin
          </button>
        </div>
      )}

      <section className="mb-12 max-w-lg mx-auto">
        <label
          htmlFor="bloodGroup"
          className="block text-lg font-semibold text-gray-800 mb-3"
        >
          Filter by Blood Group
        </label>
        <select
          id="bloodGroup"
          value={selectedBloodGroup}
          onChange={handleBloodGroupChange}
          className="input-select"
        >
          <option value="">All Blood Groups</option>
          {bloodGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        {selectedBloodGroup && (
          <button
            onClick={handleRequestBlood}
            className="btn-primary mt-4 w-full animate-pulse hover:animate-none"
          >
            Request {selectedBloodGroup} Blood
          </button>
        )}
        {message && (
          <p
            className={`alert ${
              message.includes("Failed")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            } animate-fade-in`}
          >
            {message}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 text-center">
          Donor List
        </h2>
        {students.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <div
                key={student._id}
                className="card animate-fade-in"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {student.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">Email:</span> {student.email}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">Blood Group:</span>{" "}
                  <span className="text-red-600 font-semibold">
                    {student.bloodGroup}
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Trade:</span> {student.trade}
                </p>
                {userRole === "admin" && (
                  <div className="mt-5 flex space-x-3">
                    <button
                      onClick={() => navigate(`/edit-student/${student._id}`)}
                      className="btn-primary flex-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
                      className="btn-danger flex-1"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-lg italic text-center animate-fade-in">
            {selectedBloodGroup
              ? `No donors found with blood group ${selectedBloodGroup}`
              : "No donors available."}
          </p>
        )}
      </section>
    </div>
  );
}

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const publicPaths = ["/login", "/signup", "/accept-request", "/reject-request"];
    if (!token && !publicPaths.some((path) => location.pathname.startsWith(path))) {
      setUserRole(null);
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Home />} />
      <Route
        path="/add-student"
        element={userRole === "admin" ? <AddStudent /> : <Login />}
      />
      <Route
        path="/edit-student/:id"
        element={userRole === "admin" ? <EditStudent /> : <Login />}
      />
      <Route
        path="/add-admin"
        element={userRole === "admin" ? <AddAdmin /> : <Login />}
      />
      <Route path="/my-requests" element={<MyRequests />} />
      <Route path="/accept-request/:requestId" element={<AcceptRequest />} />
      <Route path="/reject-request/:requestId" element={<RejectRequest />} />
    </Routes>
  );
}

export default App;