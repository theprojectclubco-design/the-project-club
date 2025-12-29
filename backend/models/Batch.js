const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  duration: { type: String, required: true }, // e.g., "6 weeks"
  mode: { type: String, enum: ['online', 'offline'], default: 'online' },
  fee: { type: Number, required: true }, // in rupees
  maxSeats: { type: Number, required: true },
  registeredCount: { type: Number, default: 0 },
  technologies: [String], // ["React", "Node.js", "MongoDB"]
  projects: [String], // ["Todo App", "E-commerce"]
  schedule: { type: String }, // e.g., "Mon-Wed-Fri 7-8 PM"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Batch', batchSchema);
