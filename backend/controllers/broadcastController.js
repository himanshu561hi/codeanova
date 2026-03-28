const Broadcast = require('../models/Broadcast');

exports.createBroadcast = async (req, res) => {
  try {
    const { message } = req.body;
    // Deactivate old broadcasts
    await Broadcast.updateMany({ active: true }, { active: false });
    
    const newBroadcast = new Broadcast({ message });
    await newBroadcast.save();
    
    res.status(201).json({ success: true, message: "Broadcast created successfully", data: newBroadcast });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getLatestBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: broadcast });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.deleteBroadcast = async (req, res) => {
  try {
    await Broadcast.updateMany({ active: true }, { active: false });
    res.status(200).json({ success: true, message: "Broadcast cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
