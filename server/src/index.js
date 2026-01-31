import dotenv from 'dotenv';
import {createServer} from 'http';
import {connectToDatabase, connectToNgrok} from './connection/index.js';
import app from './app.js';
import initializeSocket from './sockets/index.js';
import registerSockets from './sockets/socket.js';
import {startIssueCron} from './cron/issue.cron.js';
import {startSevereIssueAlertCron} from './cron/emailAlert.cron.js';
import {startScraperCron} from './cron/scrapper.cron.js';

dotenv.config({
    path: `./.env`,
});

const port = process.env.PORT || 8000;
const httpServer = createServer(app);

const io = initializeSocket(httpServer);
registerSockets(io);

connectToDatabase().then(() => {
    httpServer.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);

        //! Starting all the CRON Jobs
        startIssueCron();
        startSevereIssueAlertCron();
        startScraperCron();
    });
});

// connectToNgrok(port).then((listener) => {
//     console.log('Public Server URL:', listener.url());
// });
