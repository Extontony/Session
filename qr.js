const express = require("express");
const pino = require("pino");
const { toBuffer } = require("qrcode");
const fs = require("fs-extra");
const path = require('path');
const { Boom } = require("@hapi/boom");
const { makeid } = require('./id');

// CRITICAL FIX: Use the updated Baileys package
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, DisconnectReason } = require("@whiskeysockets/baileys");

// CRITICAL FIX: Make this a Router, not a standalone app, so it works with your main Itxxwasi.js server
let router = express.Router();

router.get("/", async (req, res) => {
    // CRITICAL FIX: Create a unique session ID for every single person who requests a QR code
    // This prevents users from overwriting each other's session files
    const id = makeid(); 
    const tempDir = path.join(__dirname, 'temp', `qr_${id}`);

    async function DEVTRIX_QR() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        
        try {
            let Devtrix_Socket = makeWASocket({
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                // CRITICAL FIX: Use macOS desktop signature to bypass WhatsApp bans
                browser: Browsers.macOS('Desktop'),
                auth: state
            });

            Devtrix_Socket.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                
                if (qr) {
                    if (!res.headersSent) {
                        res.setHeader('Content-Type', 'image/png');
                        res.end(await toBuffer(qr));
                    }
                }

                if (connection == "open") {
                    await delay(3000);
                    let user = Devtrix_Socket.user.id;

                    // Read credentials and convert to base64
                    let CREDS = fs.readFileSync(path.join(tempDir, 'creds.json'));
                    let Scan_Id = Buffer.from(CREDS).toString('base64');
                    
                    // Prepend the Devtrix identifier
                    let sessionPrefix = "DEVTRIX~" + Scan_Id;

                    let sessionMsg = await Devtrix_Socket.sendMessage(user, { text: sessionPrefix });
                    
                    let DEVTRIX_TEXT = `
*_QR Code Scanned Successfully by Devtrix TECH_*
*_Made With 🤍_*
______________________________________
╔════◇
║ *『 WOW YOU'VE CHOSEN Devtrix 』*
║ _You Have Completed the First Step to Deploy a Whatsapp Bot._
╚════════════════════════╝
╔═════◇
║  『••• 𝗩𝗶𝘀𝗶𝘁 𝗙𝗼𝗿 𝗛𝗲𝗹𝗽 •••』
║❒ *Owner:* _https://wa.me/263781206152_
║❒ *Repo:* _https://github.com/extontony/devtrix_
║❒ *WChannel:* _https://whatsapp.com/channel/0029VaDK8ZUDjiOhwFS1cP2j_
╚════════════════════════╝
_____________________________________
`;
                    await Devtrix_Socket.sendMessage(user, { text: DEVTRIX_TEXT }, { quoted: sessionMsg });
                    
                    await delay(1000);
                    await Devtrix_Socket.ws.close();
                    try { await fs.emptyDirSync(tempDir); } catch (e) { console.error("Cleanup error:", e); }
                }

                Devtrix_Socket.ev.on('creds.update', saveCreds);

                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (
                        reason === DisconnectReason.connectionClosed || 
                        reason === DisconnectReason.connectionLost || 
                        reason === DisconnectReason.restartRequired || 
                        reason === DisconnectReason.timedOut
                    ) {
                        DEVTRIX_QR().catch(err => console.log("Reconnect error:", err));
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        try { await fs.emptyDirSync(tempDir); } catch (e) {}
                    }
                }
            });
        } catch (err) {
            console.log(err);
            try { await fs.emptyDirSync(tempDir); } catch (e) {}
        }
    }

    DEVTRIX_QR().catch(async (err) => {
        console.log(err);
        try { await fs.emptyDirSync(tempDir); } catch (e) {}
    });
});

module.exports = router;
