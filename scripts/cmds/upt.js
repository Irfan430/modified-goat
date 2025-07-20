const os = require("os");
const { createCanvas } = require("canvas");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const pidusage = require("pidusage");

// Get bot name from config
let botName = "GoatBot";
try {
  const configPath = path.join(__dirname, "../../config.dev.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.nickNameBot) botName = config.nickNameBot;
} catch (e) {
  console.warn("⚠️ Bot name not found in config. Using default.");
}

// Keep track of bot start time
const botStartTime = Date.now();

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "status"],
    version: "3.1",
    author: "ChatGPT x Irfan",
    role: 0,
    shortDescription: "Stylish uptime status (image + text)",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const uptime = process.uptime();
      const sysUptime = os.uptime();
      const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(1);
      const usedMemMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const cpuInfo = os.cpus()[0]?.model || "Unknown CPU";
      const cpuCores = os.cpus().length;
      const arch = os.arch();
      const hostname = os.hostname();
      const platform = os.platform();
      const pid = process.pid;
      const nodeVersion = process.version;
      const loadAvg = os.loadavg()[0].toFixed(2);
      const now = moment();
      const bootTime = now.clone().subtract(uptime, 'seconds').format("YYYY-MM-DD HH:mm:ss");

      const usage = await pidusage(pid);

      // Format uptime
      function formatDuration(s) {
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return `${d}d ${h}h ${m}m ${sec}s`;
      }

      const formattedUptime = formatDuration(uptime);
      const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

      // ASCII Text Box Style Status
      const asciiBox = `
┏━ ${botName} - Uptime ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ⏱️ Start Time     : ${bootTime}
┃ 🤖 Uptime         : ${formattedUptime}
┃
┃ 🧠 CPU            : ${cpuInfo} (${cpuCores} cores)
┃ 💾 RAM Usage      : ${usedMemMB} / ${totalMemMB} MB
┃ 📈 CPU Usage      : ${usage.cpu.toFixed(1)}%
┃ 💻 Platform       : ${platform} ${arch}
┃ 🖧 Hostname       : ${hostname}
┃ 📟 Node.js        : ${nodeVersion}
┃ 📉 Load Average   : ${loadAvg}
┃ 📅 Current Time   : ${currentTime}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      // Create image using canvas
      const canvas = createCanvas(750, 600);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#0f172a"; // Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#22d3ee"; // Title color
      ctx.font = "bold 30px Arial";
      ctx.fillText(`🤖 ${botName} - Status`, 30, 50);

      const data = [
        { label: "Uptime", value: formattedUptime },
        { label: "System Uptime", value: formatDuration(sysUptime) },
        { label: "RAM", value: `${usedMemMB} / ${totalMemMB} MB` },
        { label: "CPU", value: `${cpuInfo} (${cpuCores} cores)` },
        { label: "CPU Usage", value: `${usage.cpu.toFixed(1)}%` },
        { label: "Platform", value: `${platform} (${arch})` },
        { label: "Hostname", value: hostname },
        { label: "Node.js", value: nodeVersion },
        { label: "Load Avg", value: loadAvg },
        { label: "Start Time", value: bootTime },
        { label: "Now", value: currentTime }
      ];

      let y = 90;
      for (const item of data) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(30, y, 690, 40);
        ctx.strokeStyle = "#22d3ee";
        ctx.strokeRect(30, y, 690, 40);

        ctx.fillStyle = "#22d3ee";
        ctx.font = "bold 18px Arial";
        ctx.fillText(`${item.label}:`, 40, y + 25);

        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(item.value, 250, y + 25);

        y += 50;
      }

      const imagePath = path.join(__dirname, "uptime_status.png");
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imagePath, buffer);

      // Send both image and text
      api.sendMessage({
        body: asciiBox,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => fs.unlinkSync(imagePath), event.messageID);

    } catch (err) {
      console.error("❌ Uptime error:", err);
      return api.sendMessage("❌ An error occurred while running the uptime command.", event.threadID, event.messageID);
    }
  }
};
