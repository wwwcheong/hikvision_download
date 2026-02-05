const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const nvrRoutes = require('./routes/nvrRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  methods: ['GET', 'POST']
}));
app.use(express.json());

app.use('/api', nvrRoutes);

const healthHandler = (req, res) => {
  res.json({ status: 'ok' });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
  }));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;