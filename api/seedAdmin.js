const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb+srv://bhardwajhardik012:hardik4312420052@cluster0.iqnfa6t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(async () => {
    console.log("Connected to MongoDB");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.deleteMany({ email: "admin@example.com" }); // Clear existing admin
    await User.create({
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });
    console.log("Admin created: admin@example.com / admin123");
    mongoose.connection.close();
  })
  .catch((err) => console.error("Error:", err));