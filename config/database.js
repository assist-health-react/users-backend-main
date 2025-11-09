const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable or fallback to the working connection string
    const mongoURI = process.env.MONGODB_URI || `mongodb+srv://developer:fY1M9JnsW9wtErRZ@assisthealth.lo9s6km.mongodb.net/production?retryWrites=true&w=majority&appName=assisthealth`;
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Don't exit the process, let the server continue running
    console.log('Server will continue running without database connection');
  }
};

module.exports = connectDB;
