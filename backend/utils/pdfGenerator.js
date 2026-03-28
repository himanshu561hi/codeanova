const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');

exports.generateGoogleDocsPDF = async (user, docId) => {
  try {
    const url = `https://docs.google.com/document/d/${docId}/export?format=html`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch Google Doc HTML");
    
    let htmlContent = await response.text();

    const start = new Date(user.internshipStartDate || Date.now());
    const durationMonths = parseInt((user.preferredDuration || "1").split(" ")[0]);
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationMonths);

    htmlContent = htmlContent
      .replace(/{{Name}}/g, user.fullName || "Student")
      .replace(/{{StudentID}}/g, user.studentId || "N/A")
      .replace(/{{Domain}}/g, user.preferredDomain || "Internship")
      .replace(/{{StartDate}}/g, start.toLocaleDateString())
      .replace(/{{EndDate}}/g, end.toLocaleDateString())
      .replace(/{{Duration}}/g, user.preferredDuration || "1 Month");

    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' }
    });

    await browser.close();
    
    // Puppeteer sometimes returns a Uint8Array depending on the version. Ensure Buffer.
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating Google Docs PDF:", error);
    throw error;
  }
};

exports.generateOfferLetterPDF = (user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add branding header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('NOVA', { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#64748b')
         .text('INTERNSHIP PROGRAM', { align: 'center' });

      doc.moveDown(2);

      // Add Date and Title
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });

      doc.moveDown(2);

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('OFFER OF INTERNSHIP', { align: 'center', underline: true });

      doc.moveDown(2);

      // Body text
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Dear ${user.fullName},`, { align: 'left' });

      doc.moveDown();

      doc.text(`Congratulations! We are thrilled to offer you an internship position at Nova starting on ${new Date(user.internshipStartDate).toDateString()}.`);
      
      doc.moveDown();

      doc.text(`You will be working in the domain of ${user.preferredDomain} for a duration of ${user.preferredDuration}. During this time, you are expected to complete your designated projects and submit them through the student portal.`);

      doc.moveDown();

      doc.text(`We are excited to welcome you to the team and look forward to working with you.`);

      doc.moveDown(3);

      // Signatures
      doc.text('Sincerely,');
      doc.moveDown(2);
      doc.font('Helvetica-Bold').text('Nova Internship Team');
      doc.font('Helvetica').text('contact@nova.example.com'); // Placeholder or user email later

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
