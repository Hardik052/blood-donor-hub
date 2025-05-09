// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"] 
  },
  bloodGroup: { 
    type: String, 
    required: true, 
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] // Restrict to valid blood groups
  },
  trade: { 
    type: String,
    enum: ["Mechanical Engineering", "Computer Science Engineering (CSE)", "Civil Engineering", "Electrical Engineering", "Electronics and Communication Engineering (ECE)", "Information Technology (IT)", "Bachelor of Computer Applications (BCA)", "Master of Computer Applications (MCA)", "Artificial Intelligence & Data Science", "Chemical Engineering"], default: "Mechanical Engineering", 
    required: true

  }
});

module.exports = mongoose.model("Student", studentSchema);