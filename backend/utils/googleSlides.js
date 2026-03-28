const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../config/google-credentials.json');
const TEMPLATE_ID = process.env.GOOGLE_TEMPLATE_ID;

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
  ],
});

/**
 * Generates a certificate from a Google Slides template
 * @param {Object} studentData { fullName, studentId, preferredDomain, preferredDuration, date }
 * @param {boolean} returnStream Whether to return the raw PDF stream or upload to Cloudinary
 * @returns {Promise<any>} Cloudinary data or raw Stream
 */
exports.generateCertificate = async (studentData, returnStream = false) => {
  const drive = google.drive({ version: 'v3', auth });
  const slides = google.slides({ version: 'v1', auth });

  try {
    console.log(`[GOOGLE] Generating certificate for: ${studentData.fullName} (Return Stream: ${returnStream})`);

    // 1. Copy the template
    const copyTitle = `Cert_${studentData.studentId.replace(/\//g, '_')}`;
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_ID,
      requestBody: { name: copyTitle },
    });
    const presentationId = copyResponse.data.id;

    // 2. Replace placeholders
    const requests = [
      { replaceAllText: { replaceText: studentData.fullName, containsText: { text: '{{NAME}}', matchCase: false } } },
      { replaceAllText: { replaceText: studentData.studentId, containsText: { text: '{{ID}}', matchCase: false } } },
      { replaceAllText: { replaceText: studentData.preferredDomain, containsText: { text: '{{DOMAIN}}', matchCase: false } } },
      { replaceAllText: { replaceText: studentData.preferredDuration, containsText: { text: '{{DURATION}}', matchCase: false } } },
      { replaceAllText: { replaceText: studentData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), containsText: { text: '{{DATE}}', matchCase: false } } },
    ];

    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });

    // 3. Export as PDF
    const exportResponse = await drive.files.export({
      fileId: presentationId,
      mimeType: 'application/pdf',
    }, { responseType: 'stream' });

    if (returnStream) {
        // We can't delete the slide yet because streaming is async. 
        // We'll let the slide stay for a bit or handle cleanup differently. 
        // BUT for on-demand download, we MUST pipe it now.
        // To ensure cleanup, we might need a small delay or a 'finish' listener.
        // Handle streaming errors
        exportResponse.data.on('error', (err) => {
            console.error('[GOOGLE STREAM ERROR]', err);
        });

        exportResponse.data.on('end', async () => {
            try {
                await drive.files.delete({ fileId: presentationId });
                console.log(`[GOOGLE] Temporary slide ${presentationId} deleted after streaming.`);
            } catch (delErr) {
                console.error('[GOOGLE DELETE ERROR]', delErr);
            }
        });
        return exportResponse.data;
    }

    const { cloudinary } = require('../config/cloudinary');
    
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: 'raw', 
          folder: 'issued_certificates',
          public_id: copyTitle,
          format: 'pdf'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      exportResponse.data.pipe(uploadStream);
    });

    // 4. Cleanup: Delete the temporary slide record from Drive
    await drive.files.delete({ fileId: presentationId });

    console.log(`[GOOGLE] Certificate uploaded to Cloudinary: ${uploadResult.secure_url}`);
    
    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  } catch (error) {
    console.error('[GOOGLE SLIDES ERROR]', error);
    throw error;
  }
};
