require('dotenv').config(); // Load environment variables first
console.log("TESTING ENV FILE. URI IS:", process.env.MONGO_URI);
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the DB connection
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));