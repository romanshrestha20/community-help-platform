import app from './app.js';
import { prisma } from './lib/prisma.js';
import http from "http";
import { initSocketServer } from "./lib/socket.js";
import { registerSocketHandlers } from "./sockets/registerSocketHandlers.js";
import { getEmailServiceStatus } from "./services/email.service.js";
import { getSmsServiceStatus } from "./services/sms.service.js";



(async () => {
  try {
    await prisma.$connect();
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);

  }
})();

const httpServer = http.createServer(app);
const io = initSocketServer(httpServer);

registerSocketHandlers(io);

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';

const emailStatus = getEmailServiceStatus();
if (!emailStatus.configured) {
  console.warn(
    `[email] ${emailStatus.mode} mode is not fully configured. Missing: ${emailStatus.missing.join(", ")}`
  );
}

const smsStatus = getSmsServiceStatus();
if (!smsStatus.configured) {
  console.warn(
    `[sms] ${smsStatus.mode} mode is not fully configured. Missing: ${smsStatus.missing.join(", ")}`
  );
}

httpServer.listen(PORT, HOST, () => {
  const publicHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Server is running on http://${publicHost}:${PORT}`);
}); 
