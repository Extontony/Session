const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Import route logic
const server = require('./wasiqr.js');
const code = require('./pair.js'); // Assuming your file is pair.js or a folder named pair

// BEST PRACTICE: Middleware must go BEFORE routes so the data is parsed in time
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Prevent memory leak warnings with Baileys
require('events').EventEmitter.defaultMaxListeners = 500;

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

// Start Server
app.listen(PORT, () => {
    console.log(`
⭐ Don't Forget To Give a Star! ⭐
🚀 Server running on http://localhost:${PORT}
    `);
});

module.exports = app;

/**
 * Powered by Devtrix tech team 
 * Join Whatsapp channel for more updates 
 **/
