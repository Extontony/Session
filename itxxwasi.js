const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Import route logic
const server = require('./wasiqr.js');
const code = require('./pair.js');

// BEST PRACTICE: Middleware must go BEFORE routes so the data is parsed in time
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Prevent memory leak warnings with Baileys
require('events').EventEmitter.defaultMaxListeners = 500;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/wasiqr', server);
app.use('/code', code);

// HTML Page Routes
app.use('/pair', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'pair.html'));
});

app.use('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
⭐ Don't Forget To Give a Star! ⭐
🚀 Server running on http://localhost:${PORT}
📝 Health check: http://localhost:${PORT}/health
🔗 Pair Page: http://localhost:${PORT}/pair
    `);
});

module.exports = app;

/**
 * Powered by Devtrix tech team 
 * Join Whatsapp channel for more updates 
 **/
