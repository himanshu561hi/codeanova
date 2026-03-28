const cron = require('node-cron');
const User = require('../models/User');
const Project = require('../models/Project');
const { sendEmail } = require('./emailService');

// Run every day at 10:00 AM server time
cron.schedule('0 10 * * *', async () => {
  console.log('Running daily cron job for task & submission link reminders...');
  try {
    // Find active users (received offer letter, but not yet got certificate)
    const users = await User.find({ offerLetterSent: true, certificateSent: false });
    
    for (const user of users) {
      const maxProjects = parseInt(user.preferredDuration.split(" ")[0]);
      const projectsCount = await Project.countDocuments({ email: user.email });

      if (projectsCount < maxProjects) {
          const startDate = new Date(user.internshipStartDate);
          const now = new Date();
          const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
          
          let allowedProjectNum = 1;
          if (daysSinceStart >= 60) allowedProjectNum = 3;
          else if (daysSinceStart >= 30) allowedProjectNum = 2;

          // If the student is allowed to submit their next project, and they haven't yet
          if (allowedProjectNum > projectsCount) {
               await sendEmail(
                   user.email,
                   `Nova Internship: Task & Submission Link for Project #${projectsCount + 1}`,
                   `<div style="font-family: Arial, sans-serif; color: #333;">
                      <h2>Hello ${user.fullName},</h2>
                      <p>Your timeline for <strong>Project #${projectsCount + 1}</strong> is active.</p>
                      <p>Please check your assigned tasks and build out the features. Once complete, you must submit your GitHub repository (and live link if applicable) on the Nova portal.</p>
                      <p><strong>Submission Link:</strong> <a href="http://localhost:5173/submit-project" style="color: #2563eb; text-decoration: none; font-weight: bold;">Submit Your Project Here</a></p>
                      <br/>
                      <p>Best regards,<br/>The Nova Team</p>
                    </div>`
               );
          }
      }
    }
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});
