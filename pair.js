const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const pino = require("pino");
const { makeid } = require('./id');

// Using both Baileys libraries for better compatibility
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
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
    let num = req.query.number;
    const userTempDir = path.join(tempDir, id);

    if (!num) {
        return res.status(400).json({ code: "Phone number is required" });
    }

    async function DEVTRIX_PAIR_CODE() {
        try {
            // Ensure temp directory exists
            await fs.ensureDir(userTempDir);
            
            const { state, saveCreds } = await useMultiFileAuthState(userTempDir);
            
            let Pair_Code_By_Devtrix = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS('Desktop'),
                syncFullHistory: false,
                markOnlineOnConnect: true
            });

            // Handle creds update
            Pair_Code_By_Devtrix.ev.on('creds.update', saveCreds);

            // Handle connection update
            Pair_Code_By_Devtrix.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (connection === "connecting") {
                    // Still connecting, do nothing
                } else if (connection === "open") {
                    try {
                        await delay(3000);
                        const credsPath = path.join(userTempDir, 'creds.json');
                        
                        if (fs.existsSync(credsPath)) {
                            let data = await fs.readFile(credsPath);
                            let b64data = Buffer.from(data).toString('base64');
                            let sessionPrefix = "DEVTRIX~" + b64data;

                            let sessionMsg = await Pair_Code_By_Devtrix.sendMessage(Pair_Code_By_Devtrix.user.id, { text: sessionPrefix });

                            let DEVTRIX_TEXT = `
*_Pair Code Connected by Devtrix TECH_*
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

                            await Pair_Code_By_Devtrix.sendMessage(Pair_Code_By_Devtrix.user.id, { text: DEVTRIX_TEXT }, { quoted: sessionMsg });
                        }

                        await delay(1000);
                        await Pair_Code_By_Devtrix.ws.close();
                        removeFile(userTempDir);
                    } catch (err) {
                        console.log("Error in connection open:", err.message);
                        removeFile(userTempDir);
                    }
                } else if (connection === "close") {
                    removeFile(userTempDir);
                    if (!res.headersSent) {
                        if (lastDisconnect?.error?.output?.statusCode !== 401) {
                            await DEVTRIX_PAIR_CODE();
                        }
                    }
                }
            });

            // Request pairing code
            if (!Pair_Code_By_Devtrix.authState.creds.registered) {
                await delay(1000);
                num = num.replace(/[^0-9]/g, '');
                
                try {
                    const code = await Pair_Code_By_Devtrix.requestPairingCode(num);
                    
                    if (!res.headersSent) {
                        res.json({ code: code });
                    }
                } catch (err) {
                    console.log("Pairing code error:", err.message);
                    if (!res.headersSent) {
                        res.status(500).json({ code: "Failed to generate pairing code" });
                    }
                    removeFile(userTempDir);
                    await Pair_Code_By_Devtrix.ws.close();
                }
            }
        } catch (err) {
            console.log("DEVTRIX_PAIR_CODE error:", err.message);
            removeFile(userTempDir);
            if (!res.headersSent) {
                res.status(500).json({ code: "Service Unavailable" });
            }
        }
    }

    return await DEVTRIX_PAIR_CODE();
});

module.exports = router;
