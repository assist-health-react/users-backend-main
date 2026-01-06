const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const mediaRoutes = require('./routes/media');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalHistoryRoutes = require('./routes/medicalHistoryRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const generalRoutes = require('./routes/generalRoutes');
const navigationRoutes = require('./routes/navigatorRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const subprofileRoutes = require('./routes/subprofileRoutes');
const nurseRoutes = require('./routes/nurseRoutes');
const studentRoutes = require('./routes/studentRoutes.js');
const packageRoutes = require('./routes/packageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB using the database configuration
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`/users/api/v1/media`, mediaRoutes);

// Routes
app.use('/users/api/v1/auth', authRoutes);
app.use('/users/api/v1/members', memberRoutes);
app.use('/users/api/v1/subprofiles', subprofileRoutes);
app.use(`/users/api/v1/navigators`, navigationRoutes);
app.use('/users/api/v1/nurses', nurseRoutes);
app.use(`/users/api/v1/students`, studentRoutes);
app.use('/users/api/v1/doctors', doctorRoutes);
app.use('/users/api/v1/appointments', appointmentRoutes);
app.use('/users/api/v1/medical-history', medicalHistoryRoutes);
app.use('/users/api/v1/subscriptions', subscriptionRoutes);
app.use('/users/api/v1/products', productRoutes);
app.use('/users/api/v1/orders', orderRoutes);
app.use('/users/api/v1/packages', packageRoutes);
app.use('/users/api/v1/payments', paymentRoutes);
app.use('/users/api/v1', generalRoutes);
app.use('/payment', paymentRoutes);//new


// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
