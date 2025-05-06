require('dotenv').config();
const { makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');

const sessionId = process.env.SESSION_ID;
const sessionPath = './auth_info.json';

if (!sessionId) {
    console.error('SESSION_ID not found in environment.');
    process.exit(1);
}

fs.writeFileSync(sessionPath, sessionId);

const { state, saveState } = useSingleFileAuthState(sessionPath);

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot connected successfully');
        }
    });

    sock.ev.on('messages.update', m => {
        for (let msg of m) {
            if (msg.update && msg.update.status === 'server') {
                console.log('Status read from:', msg.key.remoteJid);
            }
        }
    });
}

startBot();