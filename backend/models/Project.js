const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String },
  githubUrl: { type: String },
  liveUrl: { type: String }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  email: { type: String, required: true },
  
  // Legacy fields (optional)
  projectTitle: { type: String },
  projectDescription: { type: String },
  githubUrl: { type: String },
  liveUrl: { type: String },
  techStack: { type: String },

  // Multi-Task structure
  task1: { type: taskSchema, required: true },
  task2: { type: taskSchema },
  task3: { type: taskSchema },

  monthNumber: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String, enum: ['A+', 'A', 'B', 'C', 'Pending'], default: 'Pending' },
  feedback: { type: String, default: 'No feedback yet' }
});

module.exports = mongoose.model('Project', projectSchema);
