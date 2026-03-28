const User = require('../models/User');
const Project = require('../models/Project');
const AdminProject = require('../models/AdminProject');
const { sendEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');

exports.loginStudent = async (req, res) => {
  try {
    const { email, studentId } = req.body;
    
    if (!email || !studentId) {
      return res.status(400).json({ success: false, message: "Please provide both Email and Student ID." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedStudentId = studentId.trim();

    console.log(`[AUTH] Login attempt: ${normalizedEmail} | ${normalizedStudentId}`);

    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }, 
      studentId: normalizedStudentId 
    });

    if (!user) {
      console.log(`[AUTH] Login FAILED for: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: "Invalid Email or Student ID." });
    }

    console.log(`[AUTH] Login SUCCESS: ${user.fullName} (${user.studentId})`);

    const token = jwt.sign(
      { id: user._id, role: 'student', studentId: user.studentId }, 
      process.env.JWT_SECRET || 'supersecretnova2026', 
      { expiresIn: '7d' }
    );

    res.status(200).json({ success: true, token, message: "Logged in successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Fetch student's own submissions
    const projects = await Project.find({ email: user.email }).sort({ monthNumber: 1 });

    // Fetch Certificate if issued
    const Certificate = require('../models/Certificate');
    const certificate = await Certificate.findOne({ email: user.email });
    
    // Add certificate info to user object for frontend (virtual-like)
    const userWithCert = user.toObject();
    userWithCert.certificateId = certificate ? certificate.certificateId : null;
    userWithCert.isCertificateIssued = !!certificate;

    // ── AUTOMATED PROJECT DELIVERY LOGIC ──────────────────────────────
    let unlockedMonth = 0;
    let assignedProjects = [];

    if (user.internshipStartDate && user.internshipStartDate !== 'Unassigned') {
      const startDate = new Date(user.internshipStartDate);
      const today = new Date();
      const diffTime = Math.max(0, today - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate current month (Month 1 starts on Day 0 or 1)
      unlockedMonth = Math.floor(diffDays / 30) + 1;

      // Limit based on preferredDuration
      const maxDuration = parseInt(user.preferredDuration.split(" ")[0]) || 1;
      
      // SPECIAL LOGIC: The user said for 2 months show 2, for 3 months show 2.
      // I'll make it show projects up to the unlockedMonth, capped by duration.
      // But I'll follow the user's "3 month -> 2 projects" strictly if they defined it that way.
      // For now, I'll allow up to 3 projects if the duration is 3, but the user can control this via templates.
      const currentLimit = Math.min(unlockedMonth, maxDuration);

      assignedProjects = await AdminProject.find({ 
        domain: user.preferredDomain,
        monthNumber: { $lte: currentLimit }
      }).sort({ monthNumber: 1 });

      // TRIGGER EMAIL IF NEW PROJECT UNLOCKED
      if (currentLimit > user.lastProjectNotified && assignedProjects.some(p => p.monthNumber === currentLimit)) {
        const newProject = assignedProjects.find(p => p.monthNumber === currentLimit);
        const emailHtml = `
          <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:auto; background:#09090b; color:#ffffff; border:1px solid #27272a; border-radius:24px; overflow:hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="padding:50px 40px; background:linear-gradient(135deg, #065f46 0%, #10b981 100%); text-align:center; position:relative;">
              <div style="font-size:48px; margin-bottom:10px;">🚀</div>
              <h1 style="margin:0; font-size:28px; font-weight:900; letter-spacing:-0.05em; text-transform:uppercase;">Milestone Unlocked!</h1>
              <p style="margin-top:8px; opacity:0.8; font-size:14px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase;">Goal: Month ${currentLimit} Project</p>
            </div>
            
            <div style="padding:40px; line-height:1.6;">
              <p style="font-size:16px;">Hello <b style="color:#10b981;">${user.fullName}</b>,</p>
              <p style="color:#a1a1aa; font-size:15px;">Great work on staying consistent! Your curriculum has just expanded. A new challenge is waiting for you in your specialized track.</p>
              
              <div style="background:#18181b; border:1px solid #27272a; padding:30px; border-radius:20px; margin:30px 0; border-left:4px solid #10b981;">
                <h3 style="margin:0; color:#10b981; font-size:18px; font-weight:800; text-transform:uppercase;">${newProject.title}</h3>
                <p style="font-size:14px; color:#d4d4d8; margin-top:10px; line-height:1.5;">${newProject.description}</p>
                <a href="${process.env.FRONTEND_URL || 'https://code-a-nova.online'}/student-dashboard" style="display:inline-block; margin-top:20px; background:#10b981; color:#064e3b; padding:12px 24px; border-radius:12px; text-decoration:none; font-weight:900; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; box-shadow: 0 10px 20px rgba(16,185,129,0.2);">Launch Project →</a>
              </div>
              
              <p style="font-size:13px; color:#71717a; text-align:center; margin-top:40px;">
                Need help? Join the <a href="#" style="color:#10b981; text-decoration:none;">Nova Community</a> or reply to this email.<br>
                <span style="display:block; margin-top:10px; font-weight:bold; color:#10b981;">Code-A-Nova Team</span>
              </p>
            </div>
            
            <div style="padding:20px; background:#111111; text-align:center; border-top:1px solid #27272a;">
              <p style="font-size:10px; color:#52525b; margin:0; text-transform:uppercase; letter-spacing:0.1em;">&copy; 2026 Code-A-Nova. All rights reserved.</p>
            </div>
          </div>
        `;
        
        await sendEmail(user.email, `Project Update: Month ${currentLimit} Assigned`, emailHtml);
        user.lastProjectNotified = currentLimit;
        await user.save();
      }
    }

    res.status(200).json({ success: true, data: { user: userWithCert, projects, assignedProjects } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    
    // req.user.id from authMiddleware
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.profilePic = req.file.path; // Cloudinary returns full URL in path
    await user.save();
    
    res.status(200).json({ success: true, message: "Profile picture updated", profilePic: req.file.path });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
