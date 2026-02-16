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

// Keep-alive server
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Verification bot is running!');
});
server.listen(process.env.PORT || 3000);
```

4. Click **"Commit new file"**

---

### **Step 3: Check Your Files**

Your repo should now have:
```
Roblox-verifiction-Bot/
├── verification-bot.js  ✅ (you have this)
├── package.json         ✅ (just added)
└── start.js             ✅ (just added)
```

---

### **Step 4: Render Will Auto-Deploy**

1. Render will detect the changes
2. Wait 2-3 minutes
3. Check Render logs for:
```
   ✅ Verification Bot Ready
