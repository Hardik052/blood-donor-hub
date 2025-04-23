import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 3; // Number of requests per page
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/my-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load requests");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login");
        }
      }
    };
    fetchRequests();
  }, [navigate]);

  // Calculate pagination
  const totalPages = Math.ceil(requests.length / requestsPerPage);
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle Previous/Next
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers (show limited range for better UX)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-red-700 tracking-tight flex items-center">
          <svg className="w-10 h-10 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2c-1.5 0-3 1.5-4 3.5C5 7.5 3 10 3 12a7 7 0 0014 0c0-2-2-4.5-3-6.5-1-2-2.5-3.5-4-3.5z" />
          </svg>
          My Blood Requests
        </h1>
        <button
          onClick={() => navigate("/")}
          className="btn-danger mt-4 sm:mt-0"
        >
          Back to Home
        </button>
      </header>

      <div className="max-w-3xl mx-auto">
        {error && (
          <p className="alert bg-red-100 text-red-700 animate-fade-in mb-6">
            {error}
          </p>
        )}
        {requests.length > 0 ? (
          <>
            <div className="space-y-6">
              {currentRequests.map((request) => (
                <div
                  key={request._id}
                  className="card animate-fade-in"
                >
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Blood Group:</span>{" "}
                    <span className="text-red-600 font-semibold">{request.bloodGroup}</span>
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={
                        request.status === "accepted"
                          ? "text-green-600 font-semibold"
                          : request.status === "rejected"
                          ? "text-red-600 font-semibold"
                          : "text-yellow-600 font-semibold"
                      }
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </p>
                  {request.donor && (
                    <>
                      <p className="text-gray-600 text-sm mb-2">
                        <span className="font-medium">Donor:</span> {request.donor.name}
                      </p>
                      <p className="text-gray-600 text-sm mb-2">
                        <span className="font-medium">Donor Email:</span> {request.donor.email}
                      </p>
                    </>
                  )}
                  <p className="text-gray-500 text-xs mt-3">
                    Requested on: {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`btn-danger px-4 py-2 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
              </button>
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`btn-pagination ${
                    currentPage === pageNumber ? "bg-red-600 text-white border-red-600 hover:bg-red-700" : ""
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`btn-danger px-4 py-2 ${
                  currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-lg italic text-center animate-fade-in">
            No blood requests made yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default MyRequests;