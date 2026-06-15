const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
const pino = require("pino");

// Import official Baileys library
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay
} = require("@whiskeysockets/baileys");

let router = express.Router();

// Helper to clean up temporary credential files
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join(__dirname, 'temp', id);

    async function DEVTRIX_QR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        
        try {
            let Devtrix_Socket = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                // Bypasses WhatsApp's connection block
                browser: Browsers.macOS("Desktop"),
            });

            Devtrix_Socket.ev.on('creds.update', saveCreds);
            Devtrix_Socket.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                
                if (qr) {
                    if (!res.headersSent) {
                        res.setHeader('Content-Type', 'image/png');
                        await res.end(await QRCode.toBuffer(qr));
                    }
                }
                
                if (connection === "open") {
                    await delay(5000);
                    let data = fs.readFileSync(path.join(tempDir, 'creds.json'));
                    await delay(800);
                    
                    let b64data = Buffer.from(data).toString('base64');
                    // Adding Devtrix Session Prefix
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

                    await delay(100);
                    await Devtrix_Socket.ws.close();
                    return removeFile(tempDir);
                    
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    DEVTRIX_QR_CODE();
                }
            });
        } catch (err) {
            if (!res.headersSent) {
                res.json({ code: "Service is Currently Unavailable" });
            }
            console.log(err);
            removeFile(tempDir);
        }
    }
    
    return await DEVTRIX_QR_CODE();
});

module.exports = router;
