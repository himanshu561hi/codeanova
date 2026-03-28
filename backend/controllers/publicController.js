exports.verifyCertificate = async (req, res) => {
  const Certificate = require('../models/Certificate');
  const Project = require('../models/Project');
  try {
    const { studentId, certificateId } = req.body;
    
    if (!studentId || !certificateId) {
      return res.status(400).json({ success: false, message: "Please provide both Student ID and Certificate ID." });
    }

    // Search in the NEW Certificate Model
    const cert = await Certificate.findOne({ 
      studentId: studentId.trim(), 
      certificateId: certificateId.trim() 
    });
    
    if (!cert) {
      return res.status(404).json({ success: false, message: "Unverified: Certificate record not found." });
    }

    // Fetch projects for this student based on email
    const projects = await Project.find({ email: cert.email }).sort({ monthNumber: 1 });

    // Format data to match old structure so Frontend doesn't break
    res.status(200).json({ 
      success: true, 
      message: "Certificate Verified Successfully!",
      data: { 
        user: {
           studentId: cert.studentId,
           fullName: cert.fullName,
           email: cert.email,
           preferredDomain: cert.domain,
           preferredDuration: cert.duration,
           internshipStartDate: cert.startDate,
           certificateId: cert.certificateId
        }, 
        projects 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const { generateCertificate } = require('../utils/googleSlides');

exports.downloadCertificate = async (req, res) => {
  const Certificate = require('../models/Certificate');
  try {
    // Since we use wildcard in route, the full ID with slashes is in req.params[0]
    const certificateId = req.params[0];
    
    if (!certificateId) {
        return res.status(400).send("No certificate ID provided.");
    }

    // Find certificate record
    const cert = await Certificate.findOne({ certificateId: certificateId.trim() });
    if (!cert) {
        return res.status(404).send("Certificate not found in our registry.");
    }

    console.log(`[PUBLIC] On-demand download requested for: ${cert.fullName} (${certificateId})`);

    // Dynamic generation stream
    const pdfStream = await generateCertificate({
        fullName: cert.fullName,
        studentId: cert.studentId,
        preferredDomain: cert.domain,
        preferredDuration: cert.duration,
        date: cert.startDate // Or use current date if preferred
    }, true);

    // Set headers to force download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.fullName}_Certificate.pdf"`);

    // Pipe the stream to response with error handling
    pdfStream.on('error', (err) => {
        console.error("[STREAM ERROR]", err);
        if (!res.headersSent) {
            res.status(500).send("Error during PDF generation stream.");
        }
    });

    res.on('error', (err) => {
        console.error("[RESPONSE STREAM ERROR]", err);
    });

    pdfStream.pipe(res);

  } catch (error) {
    console.error("[DOWNLOAD ERROR]", error);
    if (!res.headersSent) {
        res.status(500).send("Technical error during certificate generation.");
    }
  }
};
