const Project = require('../models/Project');
const User = require('../models/User');
const axios = require('axios');
const Razorpay = require('razorpay');
const crypto = require('crypto');

exports.submitProject = async (req, res) => {
  try {
    const { email, studentId, preferredDomain } = req.body;
    
    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    if (user.studentId !== studentId || user.preferredDomain !== preferredDomain) {
      return res.status(400).json({ success: false, message: "Student ID or Domain does not match our records." });
    }

    // Count existing projects
    const projectsCount = await Project.countDocuments({ email });
    const durationStr = user.preferredDuration.split(" ")[0]; // "1 Month" -> "1"
    const maxProjects = parseInt(durationStr);

    if (projectsCount >= maxProjects) {
      return res.status(400).json({ success: false, message: `You have already submitted all ${maxProjects} required projects.` });
    }

    // Time-lock logic
    if (user.internshipStartDate === 'Unassigned') {
      return res.status(403).json({ success: false, message: "Your internship has not started yet. Please wait for the Admin to assign your batch." });
    }

    const startDate = new Date(user.internshipStartDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

    let allowedProjectNum = 1;
    if (daysSinceStart >= 60) allowedProjectNum = 3;
    else if (daysSinceStart >= 30) allowedProjectNum = 2;

    const attemptingProjectNum = projectsCount + 1;
    if (attemptingProjectNum > allowedProjectNum) {
      const waitDays = ((attemptingProjectNum - 1) * 30) - daysSinceStart;
      return res.status(403).json({ 
        success: false, 
        message: `Project locked. You can submit Project #${attemptingProjectNum} in ${waitDays} day(s).` 
      });
    }

    // --- AUTOMATED GITHUB VERIFICATION (AI-ISH TECH) ---
    // Check Task 1 GitHub URL
    if (req.body.task1 && req.body.task1.githubUrl) {
      try {
        const repoUrl = req.body.task1.githubUrl;
        const parts = repoUrl.replace('https://github.com/', '').split('/');
        if (parts.length >= 2) {
          const [owner, repo] = parts;
          const githubRes = await axios.get(`https://api.github.com/repos/${owner}/${repo.split('?')[0]}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
          });
          
          if (githubRes.data.size === 0) {
            return res.status(400).json({ success: false, message: "Verification Failed: GitHub repository is empty. Please upload code first." });
          }
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: "Verification Failed: Invalid GitHub URL or Private Repository." });
      }
    }

    // Save
    const projectData = { ...req.body, monthNumber: attemptingProjectNum };
    const newProject = new Project(projectData);
    await newProject.save();

    // --- GAMIFICATION: AWARD BADGES ---
    if (attemptingProjectNum === 1) {
      const start = new Date(user.internshipStartDate);
      const diffTime = Math.abs(new Date() - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        if (!user.badges.includes("Early Bird ⚡")) {
          user.badges.push("Early Bird ⚡");
          await user.save();
        }
      }
    }

    const showPaymentGateway = (attemptingProjectNum === maxProjects && user.paymentStatus !== 'Paid');

    res.status(201).json({ 
      success: true, 
      message: `Project #${attemptingProjectNum} Submitted Successfully!`, 
      showPaymentGateway 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_YourGenericTestKey",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "YourGenericTestSecret",
    });

    const options = {
      amount: 149900, // Represents Rs 1499 in paise
      currency: "INR",
      receipt: `receipt_${user._id}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, message: "Razorpay order creation failed" });
    }

    res.status(200).json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "YourGenericTestSecret";
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Cryptographically verified, update metadata
      const user = await User.findOne({ email });
      if (user) {
        user.paymentStatus = 'Paid';
        await user.save();
        return res.status(200).json({ success: true, message: "Payment verified cryptographically." });
      }
      return res.status(404).json({ success: false, message: "User not found." });
    } else {
      return res.status(400).json({ success: false, message: "Payment spoofing detected. Invalid signature." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
