const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require("pino");
const { makeid } = require('./id');

// CRITICAL FIX: Using the official updated Baileys library
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

let router = express.Router();

// Helper to clean up temporary credential files
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    const tempDir = path.join(__dirname, 'temp', id); // Safer path generation

    async function DEVTRIX_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        
        try {
            let Pair_Code_By_Devtrix = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                // CRITICAL FIX: WhatsApp rejects empty browser arrays now. Using macOS desktop bypasses this.
                browser: Browsers.macOS('Desktop')
            });

            if (!Pair_Code_By_Devtrix.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_Devtrix.requestPairingCode(num);
                
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Pair_Code_By_Devtrix.ev.on('creds.update', saveCreds);
            Pair_Code_By_Devtrix.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection == "open") {
                    await delay(5000);
                    const credsPath = path.join(tempDir, 'creds.json');
                    let data = fs.readFileSync(credsPath);
                    await delay(800);
                    
                    let b64data = Buffer.from(data).toString('base64');
                    // Added a branded prefix to your session ID for better bot compatibility
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

                    await delay(100);
                    await Pair_Code_By_Devtrix.ws.close();
                    return removeFile(tempDir);
                    
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    DEVTRIX_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("Service restarted due to error:", err);
            removeFile(tempDir);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }
    
    return await DEVTRIX_PAIR_CODE();
});

module.exports = router;
