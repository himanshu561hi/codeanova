const User = require('../models/User');
const Project = require('../models/Project');
const AdminProject = require('../models/AdminProject');
const Certificate = require('../models/Certificate');
const { sendEmail } = require('../utils/emailService');
const { generateGoogleDocsPDF } = require('../utils/pdfGenerator');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

exports.loginAdmin = (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'supersecretnova2026', { expiresIn: '8h' });
    return res.status(200).json({ success: true, token, message: "Logged in successfully" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid Admin Credentials" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    
    email = email.toLowerCase().trim();
    console.log(`[DELETE] Attempting to remove: ${email}`);
    
    const deleted = await User.findOneAndDelete({ email });
    if (!deleted) return res.status(404).json({ success: false, message: "User record not found in database." });
    
    console.log(`[DELETE] Successfully removed: ${email}`);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("[DELETE ERROR]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkTogglePayment = async (req, res) => {
  try {
    const { emails, status } = req.body;
    if (!emails || !emails.length) return res.status(400).json({ success: false, message: "No users selected" });
    await User.updateMany({ email: { $in: emails } }, { $set: { paymentStatus: status } });
    res.status(200).json({ success: true, message: `Updated payment status for ${emails.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkToggleOffer = async (req, res) => {
  try {
    const { emails, sent } = req.body;
    if (!emails || !emails.length) return res.status(400).json({ success: false, message: "No users selected" });
    await User.updateMany({ email: { $in: emails } }, { $set: { offerLetterSent: sent } });
    res.status(200).json({ success: true, message: `Updated offer status for ${emails.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignBatch = async (req, res) => {
  try {
    const { email, emails, batch } = req.body;
    const targetEmails = emails || (email ? [email] : []);

    if (targetEmails.length === 0) {
      return res.status(400).json({ success: false, message: "No users provided" });
    }

    await User.updateMany(
      { email: { $in: targetEmails } },
      { $set: { internshipStartDate: batch } }
    );
    
    res.status(200).json({ success: true, message: `Batch assigned to ${targetEmails.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const paidUsers = await User.countDocuments({ paymentStatus: 'Paid' });

    // Fetch all users with their project counts
    const users = await User.find().lean();
    
    // We could optimize this using aggregation, but this is fine for decent loads
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const projects = await Project.find({ email: user.email }).sort({ monthNumber: 1 });
      return {
        ...user,
        projectsCount: projects.length,
        projects,
      };
    }));

    console.log("[ANALYTICS]", { totalUsers, totalProjects, paidUsers });
    res.status(200).json({
      success: true,
      data: {
        analytics: { totalUsers, totalProjects, paidUsers },
        users: usersWithStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.sendOfferLetter = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.offerLetterSent = !user.offerLetterSent;
    await user.save();
    
    res.status(200).json({ success: true, message: `Offer marked as ${user.offerLetterSent ? 'Sent' : 'Pending'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const { generateCertificate } = require('../utils/googleSlides');

exports.sendCertificate = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Validate if they submitted required projects
    const durationStr = user.preferredDuration.split(" ")[0]; 
    const maxProjects = parseInt(durationStr) || 1;
    const projectsCount = await Project.countDocuments({ email: user.email });
    
    if (projectsCount < maxProjects) {
        return res.status(400).json({ success: false, message: `Cannot send certificate. Student requires ${maxProjects} projects, but submitted ${projectsCount}.`});
    }

    // DYNAMIC GENERATION VIA GOOGLE SLIDES
    let certData = null;
    if (process.env.GOOGLE_TEMPLATE_ID) {
      try {
        console.log(`[ADMIN] Triggering dynamic certificate generation (Cloudinary) for ${email}`);
        certData = await generateCertificate({
          fullName: user.fullName,
          studentId: user.studentId,
          preferredDomain: user.preferredDomain,
          preferredDuration: user.preferredDuration,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        });
      } catch (genError) {
        console.error("[CERT GEN ERROR]", genError);
      }
    }

    // EMAIL AUTOMATION
    if (certData && certData.url) {
      const emailHtml = `
        <div style="font-family:sans-serif; max-width:600px; margin:auto; background:#09090b; color:#fff; border:1px solid #27272a; border-radius:24px; overflow:hidden;">
          <div style="padding:40px; background:linear-gradient(135deg, #065f46 0%, #10b981 100%); text-align:center;">
            <h1 style="margin:0; font-size:24px;">Congratulations! 🎓</h1>
            <p style="margin-top:10px; opacity:0.9;">Internship Completed Successfully</p>
          </div>
          <div style="padding:40px; color:#d4d4d8;">
            <p>Hi <b>${user.fullName}</b>,</p>
            <p>We are proud to certify that you have successfully completed your <b>${user.preferredDuration}</b> internship in <b>${user.preferredDomain}</b> at Code-A-Nova.</p>
            <p>Your official digital certificate is attached to this email and has been added to our global verification registry.</p>
            <div style="background:#18181b; padding:20px; border-radius:12px; margin:20px 0; text-align:center;">
               <p style="font-size:12px; color:#71717a; margin-bottom:5px;">Certificate ID</p>
               <p style="font-size:18px; color:#10b981; font-weight:bold; letter-spacing:2px; margin:0;">${user.studentId.replace(/\//g, '_')}</p>
            </div>
            <p style="font-size:13px; color:#71717a;">You can verify your credentials anytime at <a href="https://code-a-nova.online/verify" style="color:#10b981; text-decoration:none;">code-a-nova.online/verify</a></p>
          </div>
        </div>
      `;
      
      const { sendEmail } = require('../utils/emailService');
      await sendEmail(user.email, "Your Internship Certificate is Here! 🎓", emailHtml, [
        { filename: `${user.fullName}_Certificate.pdf`, path: certData.url }
      ]);
      
      // SAVE TO VERIFIED REGISTRY (Certificate Model)
      const Certificate = require('../models/Certificate');
      const certId = user.studentId.replace(/\//g, '_');
      
      // Upsert into Certificate registry
      await Certificate.findOneAndUpdate(
        { certificateId: certId },
        {
          studentId: user.studentId,
          fullName: user.fullName,
          email: user.email,
          domain: user.preferredDomain,
          duration: user.preferredDuration,
          startDate: user.internshipStartDate,
          endDate: new Date().toLocaleDateString('en-GB'), // Or calculate based on duration
          pdfUrl: certData.url, // SAVE THE PERMANENT CLOUDINARY URL
          certificateId: certId
        },
        { upsert: true, new: true }
      );

      console.log(`[ADMIN] Certificate for ${user.fullName} saved to permanent registry with URL: ${certData.url}`);
    }

    user.certificateSent = true;
    user.certificateId = user.studentId.replace(/\//g, '_');
    await user.save();

    res.status(200).json({ success: true, message: `Certificate generated and sent to ${email}` });
  } catch (error) {
    console.error("[SEND CERT ERROR]", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { projectId, grade, feedback } = req.body;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    project.grade = grade;
    project.feedback = feedback;
    await project.save();

    res.status(200).json({ success: true, message: "Project graded successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ── NEW FEATURE 1: Toggle Payment Status ─────────────────────────────────────
exports.togglePayment = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.paymentStatus = user.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    await user.save();

    console.log(`[ADMIN] Payment toggled for ${email}: ${user.paymentStatus}`);
    res.status(200).json({ success: true, message: `Payment marked as ${user.paymentStatus}`, status: user.paymentStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ── NEW FEATURE 2: Save Admin Notes per Student ───────────────────────────────
exports.saveAdminNote = async (req, res) => {
  try {
    const { email, note } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.adminNote = note;
    await user.save();

    res.status(200).json({ success: true, message: "Note saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ── NEW FEATURE 3: Send Custom Email to Any Student ───────────────────────────
exports.sendCustomEmail = async (req, res) => {
  try {
    const { email, subject, body } = req.body;
    if (!email || !subject || !body) {
      return res.status(400).json({ success: false, message: "Email, subject and body are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });

    const emailHtml = `
      <div style="font-family:'Inter',sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden;">
        <div style="padding:24px 32px;background:linear-gradient(135deg,#1e3a5f,#0f172a);border-bottom:1px solid #1e293b;">
          <h1 style="margin:0;font-size:22px;font-weight:300;letter-spacing:0.1em;color:#fff;">Code-A-Nova</h1>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.3em;color:#64748b;">Official Communication</p>
        </div>
        <div style="padding:36px 32px;">
          <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 8px;">Hello,</p>
          <h2 style="margin:0 0 24px;font-size:28px;font-weight:300;color:#fff;">${user.fullName}</h2>
          <div style="background:#1e293b;border-left:3px solid #3b82f6;border-radius:8px;padding:20px 24px;">
            <p style="margin:0;line-height:1.8;color:#cbd5e1;white-space:pre-wrap;">${body}</p>
          </div>
        </div>
        <div style="padding:20px 32px;background:#1e293b;border-top:1px solid #334155;text-align:center;">
          <p style="margin:0;font-size:11px;color:#475569;">&copy; ${new Date().getFullYear()} Code-A-Nova Internship Program — <a href="https://codeanova.online" style="color:#3b82f6;text-decoration:none;">codeanova.online</a></p>
        </div>
      </div>
    `;

    const emailSent = await sendEmail(email, subject, emailHtml);
    if (emailSent) {
      res.status(200).json({ success: true, message: `Custom email sent to ${user.fullName}` });
    } else {
      res.status(500).json({ success: false, message: "Email failed to send" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ── NEW FEATURE 4: Mark Registrations as Downloaded ──────────────────────────
exports.markDownloaded = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || emails.length === 0) return res.status(400).json({ success: false, message: "No emails provided" });

    await User.updateMany(
      { email: { $in: emails } },
      { $set: { isDownloaded: true } }
    );

    res.status(200).json({ success: true, message: "Marked as downloaded" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ── NEW FEATURE 5: Bulk Import Interns from Excel ──────────────────────────────
exports.importInterns = async (req, res) => {
  console.log('[ADMIN] Import Excel Request Received');
  try {
    if (!req.file) {
      console.log('[ADMIN] No file found in request');
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    console.log('[ADMIN] File received:', req.file.originalname, req.file.size, 'bytes');

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // header: 1 returns array of arrays [ [A1, B1, C1...], [A2, B2, C2...] ]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Skip the first row (headers)
    const rows = data.slice(1);
    const results = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // INDEX MAPPING (Screenshot Proof)
        // 0: Student_ID, 1: Student_Name, 2: Email, 3: Domain, 4: Duration, 5: Start_Date
        let studentIdRaw = row[0];
        let fullNameRaw = row[1];
        let emailRaw = row[2];
        let domainRaw = row[3];
        let durationRaw = row[4];
        let startDateRaw = row[5];
        let certNoRaw = row[8];

        // Validation
        if (!emailRaw || !fullNameRaw || !emailRaw.toString().includes('@')) {
           console.log(`[IMPORT SKIP] Row ${i + 2}: Missing Email or Name`);
           results.skipped++;
           continue;
        }

        const emailStr = emailRaw.toString().toLowerCase().trim();
        const finalStudentId = (studentIdRaw || `CAN${Date.now().toString().slice(-4)}${Math.floor(Math.random()*100)}`).toString();

        let parsedBatchDate = 'Unassigned';
        if (startDateRaw) {
          try {
            let jsDate;
            if (typeof startDateRaw === 'number') {
              jsDate = new Date((startDateRaw - 25569) * 86400 * 1000);
            } else {
              const dateStr = startDateRaw.toString().trim();
              const parts = dateStr.split(/[-/.]/);
              if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
                 jsDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              }
              if (!jsDate || isNaN(jsDate.getTime())) jsDate = new Date(dateStr);
              if (isNaN(jsDate.getTime())) {
                const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
                const monParts = dateStr.split(/[- /]/);
                if (monParts.length === 3) {
                  const day = parseInt(monParts[0]);
                  const mon = monParts[1].toLowerCase().substring(0, 3);
                  const year = parseInt(monParts[2]);
                  if (!isNaN(day) && months[mon] !== undefined && !isNaN(year)) jsDate = new Date(year, months[mon], day);
                }
              }
            }
            if (jsDate && !isNaN(jsDate.getTime())) {
              parsedBatchDate = jsDate.toISOString().split('T')[0];
            }
          } catch (e) {}
        }

        const updateData = {
          fullName: fullNameRaw.toString(),
          studentId: finalStudentId,
          preferredDomain: (domainRaw || 'Frontend Development').toString(),
          preferredDuration: (durationRaw || '1 Month').toString(),
          internshipStartDate: parsedBatchDate,
          paymentStatus: 'Pending', // Assuming bulk upload is for active paid interns
          course: 'B.Tech',
          branch: 'General',
          currentYear: '3rd Year',
          collegeName: 'Not Specified',
          state: 'India',
          certificateId: certNoRaw ? certNoRaw.toString().trim() : undefined
        };

        console.log(`[IMPORT] Syncing email: ${emailStr}, Date: ${parsedBatchDate}`);
        await User.findOneAndUpdate(
          { email: emailStr },
          { $set: updateData },
          { upsert: true, new: true, runValidators: true }
        );
        results.imported++;
      } catch (err) {
        console.error(`[IMPORT ROW ERROR]`, err);
        results.errors.push(`Row error: ${err.message}`);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Import complete. Imported: ${results.imported}, Skipped: ${results.skipped}`,
      summary: results 
    });
  } catch (error) {
    console.error('[IMPORT GLOBAL ERROR]', error);
    res.status(500).json({ success: false, message: "Import failed during processing", error: error.message });
  }
};

exports.importCertificates = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const rows = data.slice(1);
    const results = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
       const row = rows[i];
       if (!row || !row[2]) continue; // Skip ONLY if email is missing

       try {
         // Helper for Date Parsing
         const parseExcelDate = (val) => {
            if (!val) return 'Unassigned';
            if (typeof val === 'number') {
               return new Date((val - 25569) * 86400 * 1000).toISOString().split('T')[0];
            }
            return val.toString().trim();
         };

         const startDateStr = parseExcelDate(row[5]);
         let endDateStr = parseExcelDate(row[6]); // Use Column G directly

         // Fallback calculation if G is missing
         if (endDateStr === 'Unassigned' && startDateStr !== 'Unassigned') {
            const s = new Date(startDateStr);
            const dur = parseInt(row[4]) || 1;
            if (!isNaN(s.getTime())) {
               const e = new Date(s);
               e.setMonth(s.getMonth() + dur);
               endDateStr = e.toISOString().split('T')[0];
            }
         }

         const certData = {
           studentId: row[0] ? row[0].toString().trim() : '',
           fullName: row[1] ? row[1].toString().trim() : 'Unknown',
           email: row[2].toString().toLowerCase().trim(),
           domain: row[3] ? row[3].toString().trim() : 'Data Science',
           duration: row[4] ? row[4].toString().trim() : '1 Month',
           startDate: startDateStr,
           endDate: endDateStr,
           certificateId: row[8] ? row[8].toString().trim() : `CERT-PENDING-${Date.now().toString().slice(-4)}${i}`
         };

         await Certificate.findOneAndUpdate(
           { email: certData.email, domain: certData.domain }, // Use Email + Domain as key for syncing
           { $set: certData },
           { upsert: true, new: true }
         );
         results.imported++;
       } catch (err) { 
         console.error(`Row ${i+2} Error:`, err);
         results.errors.push(`Row ${i+2}: ${err.message}`); 
       }
    }

    res.status(200).json({ success: true, summary: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCertificates = async (req, res) => {
  try {
    const list = await Certificate.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching certificates: " + error.message });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.body;
    await Certificate.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Certificate removed from verification registry." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting certificate: " + error.message });
  }
};

// ── ADMIN PROJECT TEMPLATES CRUD ──────────────────────────────────────────
exports.createAdminProject = async (req, res) => {
  console.log("[DEBUG] Creating Admin Project with data:", req.body);
  try {
    const project = new AdminProject(req.body);
    await project.save();
    console.log("[DEBUG] Project Template Created Successfully:", project._id);
    res.status(201).json({ success: true, message: "Project template created", data: project });
  } catch (error) {
    console.error("[DEBUG] Error creating Admin Project:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminProjects = async (req, res) => {
  console.log("[DEBUG] Fetching all Admin Project Templates");
  try {
    const projects = await AdminProject.find().sort({ monthNumber: 1 });
    console.log(`[DEBUG] Found ${projects.length} Admin Project Templates`);
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("[DEBUG] Error fetching Admin Projects:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdminProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await AdminProject.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Project template updated", data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdminProject = async (req, res) => {
  try {
    const { id } = req.params;
    await AdminProject.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Project template deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
