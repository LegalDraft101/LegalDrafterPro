import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import affidavitRoutes from './routes/affidavit/affidavitRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/affidavits', affidavitRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Legal Drafter Pro API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
