const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const User = require("./models/User");
const Student = require("./models/Student");
const Request = require("./models/Request");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Middleware to Verify JWT
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to Restrict to Admins
const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can perform this action" });
  }
  next();
};

// Root Route
app.get("/", (req, res) => {
  res.send("Blood Donor API is running");
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const user = new User({
      email,
      password: hashedPassword,
      role: "student",
      otp,
      otpExpires,
    });
    await user.save();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Blood Donor Account",
      text: `Your OTP for verification is: ${otp}. It is valid for 10 minutes.`,
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "User created. Please verify your email with the OTP sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// OTP Verification Route
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Add Admin Route
app.post("/api/add-admin", verifyToken, restrictToAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Prepare confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Blood Donor App - Admin Account Created",
      html: `
        <p>Dear Admin,</p>
        <p>Congratulations! Your admin account for the Blood Donor App has been successfully created.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Role:</strong> Admin</li>
        </ul>
        <p>Please keep your credentials secure and use them to log in to the admin panel.</p>
        <p>Best regards,<br>Blood Donor App Team</p>
      `,
    };

    // Attempt to send confirmation email first
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // Check if the error indicates an invalid email address
      if (emailError.responseCode === 550 || emailError.message.includes("recipient rejected")) {
        return res.status(400).json({ message: "Email does not exist" });
      }
      console.error("Failed to send confirmation email:", emailError);
      return res.status(500).json({ message: "Failed to send confirmation email", error: emailError.message });
    }

    // If email is sent successfully, create the admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });
    await user.save();

    res.status(201).json({ message: "Admin created successfully and confirmation email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Student Routes
app.get("/api/students", verifyToken, async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    let query = {};
    if (bloodGroup) query.bloodGroup = bloodGroup;
    const students = await Student.find(query);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/api/bloodgroup/:bloodGroup", verifyToken, async (req, res) => {
  try {
    const { bloodGroup } = req.params;

    // Blood group compatibility map (recipient => acceptable donors)
    const compatibleDonors = {
      "A+": ["A+", "A-", "O+", "O-"],
      "A-": ["A-", "O-"],
      "B+": ["B+", "B-", "O+", "O-"],
      "B-": ["B-", "O-"],
      "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], // Universal recipient
      "AB-": ["A-", "B-", "AB-", "O-"],
      "O+": ["O+", "O-"],
      "O-": ["O-"], // Universal donor
    };

    const allowedTypes = compatibleDonors[bloodGroup];

    if (!allowedTypes) {
      return res.status(400).json({ message: `Invalid blood group: ${bloodGroup}` });
    }

    // Find students with compatible blood types
    const students = await Student.find({ bloodGroup: { $in: allowedTypes } });

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: `No compatible donors found for blood group ${bloodGroup}` });
    }

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/api/students/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/api/students", verifyToken, restrictToAdmin, async (req, res) => {
  try {
    const { name, email, bloodGroup, trade } = req.body;
    if (!name || !email || !bloodGroup || !trade) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for duplicate email in Student collection
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Email already exists in student records" });
    }

    // Prepare confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Blood Management System",
      html: `
        <p>Dear ${name},</p>
        <p>Congratulations! You have been successfully added to the Blood Management System as a donor.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Blood Group:</strong> ${bloodGroup}</li>
          <li><strong>Branch:</strong> ${trade}</li>
        </ul>
        <p>Thank you for joining our community of lifesavers!</p>
        <p>Best regards,<br>Blood Donor App Team</p>
      `,
    };

    // Attempt to send confirmation email first
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // Check if the error indicates an invalid email address
      if (emailError.responseCode === 550 || emailError.message.includes("recipient rejected")) {
        return res.status(400).json({ message: "Email does not exist" });
      }
      console.error("Failed to send confirmation email:", emailError);
      return res.status(500).json({ message: "Failed to send confirmation email", error: emailError.message });
    }

    // If email is sent successfully, save the student
    const newStudent = new Student({ name, email, bloodGroup, trade });
    await newStudent.save();

    res.status(201).json({ message: "Student added successfully and confirmation email sent", student: newStudent });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/api/students/:id", verifyToken, restrictToAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, bloodGroup, trade } = req.body;
    if (!name || !email || !bloodGroup || !trade) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { name, email, bloodGroup, trade },
      { new: true, runValidators: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(updatedStudent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error", error });
  }
});

app.delete("/api/students/:id", verifyToken, restrictToAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Request Blood Route
app.post("/api/request-blood", verifyToken, async (req, res) => {
  try {
    const { bloodGroup } = req.body;
    if (!bloodGroup) {
      return res.status(400).json({ message: "Blood group is required" });
    }
    const donors = await Student.find({ bloodGroup });
    if (donors.length === 0) {
      return res.status(404).json({ message: `No donors found for blood group ${bloodGroup}` });
    }
    const requester = await User.findById(req.user._id);
    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }
    const requests = [];
    for (const donor of donors) {
      const request = new Request({
        requester: req.user._id,
        donor: donor._id,
        bloodGroup,
        status: "pending",
      });
      await request.save();
      requests.push(request);
      const acceptUrl = `http://localhost:3000/accept-request/${request._id}`;
      const rejectUrl = `http://localhost:3000/reject-request/${request._id}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: donor.email,
        subject: `Blood Donation Request for ${bloodGroup}`,
        html: `
          <p>Dear ${donor.name},</p>
          <p>${requester.email} is in urgent need of ${bloodGroup} blood.</p>
          <p>Please respond to this request:</p>
          <p>
            <a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept</a>
            <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">Reject</a>
          </p>
          <p>Thank you for your support!</p>
        `,
      };
      await transporter.sendMail(mailOptions);
    }
    res.json({ message: `Request sent to ${donors.length} donor(s) for ${bloodGroup}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Accept Request Route
app.get("/api/accept-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }
    request.status = "accepted";
    await request.save();
    res.json({ message: "Request accepted. Check the requester's 'My Requests' page for updates." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Reject Request Route
app.get("/api/reject-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }
    request.status = "rejected";
    await request.save();
    res.json({ message: "Request rejected." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get My Requests Route
app.get("/api/my-requests", verifyToken, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate("donor", "name email blood reisGroup")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});