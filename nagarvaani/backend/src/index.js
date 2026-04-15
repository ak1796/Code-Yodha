const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', msg: 'NagarVaani backend runs!' }));

// ROUTES
const complaintsRouter = require('./routes/complaints');
const ticketsRouter = require('./routes/tickets');
const adminRouter = require('./routes/admin');
const officersRouter = require('./routes/officers');
const votesRouter = require('./routes/votes');
const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/webhooks/telegram');
const redditRouter = require('./routes/webhooks/reddit');
const voiceRouter = require('./routes/voice');
const bmcRouter = require('./routes/bmc');

app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/officers', officersRouter);
app.use('/api/tickets', votesRouter); 
app.use('/webhooks/telegram', telegramRouter);
app.use('/webhooks/reddit', redditRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/data/bmc', bmcRouter);

// Initialize Cron Jobs
require('./cron/allCrons');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`NagarVaani Backend running on port ${PORT}`);
});
