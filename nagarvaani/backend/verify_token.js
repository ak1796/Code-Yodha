require('dotenv').config();
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token.includes('your_telegram_bot_token_here')) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set correctly in your .env file.');
    process.exit(1);
}

console.log(`🔍 Testing token: ${token.substring(0, 5)}...${token.substring(token.length - 5)}`);

axios.get(`https://api.telegram.org/bot${token}/getMe`)
    .then(res => {
        console.log('✅ Success! Token is valid.');
        console.log('Bot Info:', res.data.result);
    })
    .catch(err => {
        console.error('❌ Token Verification Failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
            if (err.response.status === 401) {
                console.error('\n💡 HINT: This is a 401 Unauthorized error. This means Telegram DOES NOT recognize this token.');
                console.error('Please go to @BotFather, revoke your token, and generate a new one.');
            }
        } else {
            console.error('Error:', err.message);
        }
    });
