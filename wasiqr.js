const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const pino = require("pino");

// Import official Baileys library
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    DisconnectReason
} = require("@whiskeysockets/baileys");

let router = express.Router();

// Helper to clean up temporary credential files
function removeFile(FilePath) {
    try {
        if (fs.existsSync(FilePath)) {
            fs.rmSync(FilePath, { recursive: true, force: true });
        }
    } catch (err) {
        console.log("Error removing file:", err.message);
    }
}

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    const userTempDir = path.join(tempDir, id);

    async function DEVTRIX_QR_CODE() {
        try {
            // Ensure temp directory exists
            await fs.ensureDir(userTempDir);
            
            const { state, saveCreds } = await useMultiFileAuthState(userTempDir);
            
            let Devtrix_Socket = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                syncFullHistory: false,
                markOnlineOnConnect: true
            });

            Devtrix_Socket.ev.on('creds.update', saveCreds);
            
            Devtrix_Socket.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                
                if (qr) {
                    if (!res.headersSent) {
                        try {
                            const qrBuffer = await QRCode.toBuffer(qr);
                            res.setHeader('Content-Type', 'image/png');
                            res.end(qrBuffer);
                        } catch (err) {
                            console.log("QR Code generation error:", err.message);
                            if (!res.headersSent) {
                                res.status(500).json({ error: "Failed to generate QR code" });
                            }
                        }
                    }
                }
                
                if (connection === "open") {
                    try {
                        await delay(3000);
                        let data = await fs.readFile(path.join(userTempDir, 'creds.json'));
                        await delay(500);
                        
                        let b64data = Buffer.from(data).toString('base64');
                        let sessionPrefix = "DEVTRIX~" + b64data;
                        
                        let sessionMsg = await Devtrix_Socket.sendMessage(Devtrix_Socket.user.id, { text: sessionPrefix });

                        let DEVTRIX_TEXT = `
*_QR Code Connected by Devtrix TECH_*
*_Made With 🤍_*
______________________________________
╔════◇
║ *『 WOW YOU'VE CHOSEN Devtrix 』*
║ _You Have Completed the First Step to Deploy a Whatsapp Bot._
╚════════════════════════╝
╔═════◇
║  『••• 𝗩𝗶𝘀𝗶𝘁 𝗙𝗼𝗿 𝗛𝗲𝗹𝗽 •••』
║❒ *Ytube:* _youtube.com/@wasitech1_
║❒ *Owner:* _https://wa.me/263781206152_
║❒ *Repo:* _https://github.com/extontony/devtrix_
║❒ *Youtube:* _@Exton.zw0_
║❒ *WChannel:* _https://whatsapp.com/channel/0029VaDK8ZUDjiOhwFS1cP2j_
║❒ *Plugins:* _https://github.com/extontony/session_
╚════════════════════════╝
_____________________________________

_Don't Forget To Give Star To My Repo_`;
                        
                        await Devtrix_Socket.sendMessage(Devtrix_Socket.user.id, { text: DEVTRIX_TEXT }, { quoted: sessionMsg });

                        await delay(1000);
                        await Devtrix_Socket.ws.close();
                        removeFile(userTempDir);
                    } catch (err) {
                        console.log("Error in connection open:", err.message);
                        removeFile(userTempDir);
                    }
                } else if (connection === "close") {
                    removeFile(userTempDir);
                    if (lastDisconnect?.error?.output?.statusCode !== 401) {
                        // Reconnect
                        await delay(5000);
                        DEVTRIX_QR_CODE();
                    }
                }
            });
        } catch (err) {
            console.log("DEVTRIX_QR_CODE error:", err.message);
            removeFile(userTempDir);
            if (!res.headersSent) {
                res.status(500).json({ error: "Service Unavailable" });
            }
        }
    }
    
    return await DEVTRIX_QR_CODE();
});

module.exports = router;
