const User = require('../models/User');

exports.registerUser = async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';
    
    // CHECK IF USER ALREADY EXISTS
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Logic: Allow re-application ONLY if previous internship is finished
      if (existingUser.internshipStartDate !== 'Unassigned') {
        const startDate = new Date(existingUser.internshipStartDate);
        const durationMonths = parseInt(existingUser.preferredDuration) || 1;
        const completionDate = new Date(startDate);
        completionDate.setMonth(startDate.getMonth() + durationMonths);

        const today = new Date();
        if (today < completionDate) {
          return res.status(400).json({ 
            success: false, 
            message: `You have an active internship in ${existingUser.preferredDomain} until ${completionDate.toLocaleDateString()}. Please complete it before applying for a new track.` 
          });
        }
      } else {
        // If they exist but were never assigned a batch, they might be trying to re-register before approval
        return res.status(400).json({ success: false, message: "You have already applied. Please wait for admin approval or batch assignment." });
      }

      // IF WE REACH HERE, THEY CAN RE-APPLY (Update existing record)
      console.log(`[AUTH] Re-application detected for ${email}. Resetting for new track.`);
      
      // Update fields for new application
      existingUser.fullName = req.body.fullName || existingUser.fullName;
      existingUser.preferredDomain = req.body.preferredDomain;
      existingUser.preferredDuration = req.body.preferredDuration;
      existingUser.course = req.body.course;
      existingUser.branch = req.body.branch;
      existingUser.currentYear = req.body.currentYear;
      existingUser.collegeName = req.body.collegeName;
      existingUser.state = req.body.state;
      existingUser.whatsapp = req.body.whatsapp || existingUser.whatsapp;
      
      // Reset statuses for new track
      existingUser.appliedAt = Date.now();
      existingUser.paymentStatus = 'Pending';
      existingUser.internshipStartDate = 'Unassigned';
      existingUser.isDownloaded = false;
      existingUser.offerLetterSent = false;
      existingUser.certificateSent = false;
      existingUser.lastProjectNotified = 0;
      existingUser.badges = [];
      
      // Generate NEW Student ID for the new track
      const currentYear = new Date().getFullYear();
      const prefix = `CN/INT/${currentYear}/`;
      const lastUsers = await User.find({ studentId: new RegExp(`^${prefix}`) }).select('studentId').lean();
      
      let newCount = 501;
      if (lastUsers.length > 0) {
        const numericIds = lastUsers.map(u => {
          const parts = u.studentId.split('/');
          return parseInt(parts[parts.length - 1], 10);
        }).filter(n => !isNaN(n));
        if (numericIds.length > 0) newCount = Math.max(...numericIds) + 1;
      }
      
      existingUser.studentId = `${prefix}${newCount}`;
      await existingUser.save();
      
      return res.status(200).json({ 
        success: true, 
        message: "Re-application Successful! Your new track is recorded.", 
        studentId: existingUser.studentId 
      });
    }

    // REGULAR NEW USER REGISTRATION
    const newUser = new User(req.body);
    newUser.email = email;
    const currentYear = new Date().getFullYear();
    const prefix = `CN/INT/${currentYear}/`;
    const lastUsers = await User.find({ studentId: new RegExp(`^${prefix}`) }).select('studentId').lean();

    let newCount = 501;
    if (lastUsers.length > 0) {
      const numericIds = lastUsers.map(u => {
        const parts = u.studentId.split('/');
        return parseInt(parts[parts.length - 1], 10);
      }).filter(n => !isNaN(n));
      if (numericIds.length > 0) newCount = Math.max(...numericIds) + 1;
    }

    newUser.studentId = `${prefix}${newCount}`;
    await newUser.save();
    res.status(201).json({ success: true, message: "Registration Successful", studentId: newUser.studentId });
  } catch (error) {
    console.error("[REGISTRATION ERROR]", error);
    let msg = "Server Error";
    if (error.code === 11000) {
      const isEmail = error.message.includes('email');
      msg = isEmail ? "Email already registered." : "System error in ID generation. Please try again.";
    }
    res.status(500).json({ success: false, message: msg });
  }
};