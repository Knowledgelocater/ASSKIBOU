const express = require('express');
const cors = require('cors');
require('dotenv').config();


const tenderRoutes = require('./routes/tenderRoutes');
const authRoutes = require('./routes/authRoutes');
const companiesRoutes = require('./routes/companies'); // ✅ Use correct file name
const applicationRoutes = require('./routes/applicationRoutes');


const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes); // ✅ Use this
app.use('/api/tenders', tenderRoutes);
app.use('/api/applications', applicationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
