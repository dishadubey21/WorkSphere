import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import emailService from './services/email.service.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    
    // Verify SMTP connection asynchronously in the background
    emailService.verifyConnection();
  });
}).catch((err) => {
  logger.error(`Database connection failed: ${err.message}`);
  process.exit(1);
});
