// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  whatsapp: { type: String, required: true, unique: true }, // sender number
  currentStep: { type: String, default: "start" }, // tracks the current flow step
  selectedService: { type: String }, // "medicine_delivery", "care_at_home", "lab_test_home"
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  age: { type: Number },
  prescriptionPhoto: { type: String }, // URL from WhatsApp media API
  requestedTests: { type: String }, // text if user typed test names
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update 'updatedAt' automatically
userSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
