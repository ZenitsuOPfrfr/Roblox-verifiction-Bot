const { spawn } = require('child_process');

function startBot() {
    console.log('Starting verification bot...');
    const bot = spawn('node', ['verification-bot.js']);

    bot.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    bot.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    bot.on('close', (code) => {
        console.log(`Bot exited with code ${code}. Restarting...`);
        setTimeout(startBot, 5000);
    });
}

startBot();

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Verification bot is running!');
});
server.listen(process.env.PORT || 3000);
console.log('Keep-alive server started on port', process.env.PORT || 3000);
```

6. Click **"Commit changes"**

---

### **Step 2: Wait for Render**

Render will auto-deploy in 2-3 minutes and the bot should come online!

---

## 🎯 WHAT HAPPENED:

You copied this:
```
├── verification-bot.js  ✅ (you have this)
