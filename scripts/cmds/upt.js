const os = require("os");
const { createCanvas } = require("canvas");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const pidusage = require("pidusage");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "status"],
    version: "2.0",
    author: "ChatGPT & Irfan",
    role: 0,
    botName: "MyAwesomeBot",  // <-- এখানে বটের নাম বসাও
    shortDescription: "Stylish uptime status image",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function({ api, event }) {
    try {
      // System Data
      const uptime = process.uptime();
      const sysUptime = os.uptime();
      const cpuInfo = os.cpus()[0]?.model || "Unknown CPU";
      const cpuCores = os.cpus().length || 1;
      const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(1);
      const usedMemMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const platform = os.platform();
      const arch = os.arch();
      const hostname = os.hostname();
      const usage = await pidusage(process.pid);

      // Format seconds to h m s
      function formatTime(s) {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return `${h}h ${m}m ${sec}s`;
      }

      // Canvas setup
      const width = 700;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = "#00ff99";
      ctx.font = "bold 32px Arial";
      ctx.fillText("🤖 Bot Uptime Status", 20, 50);

      // Draw Box function
      function drawBox(x, y, w, h, bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#00ff99";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }

      // Draw Text function
      function drawText(label, value, x, y) {
        ctx.fillStyle = "#00ff99";
        ctx.font = "bold 18px Arial";
        ctx.fillText(label, x, y);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(value, x + 150, y);
      }

      // Box & Text positions
      const boxX = 20;
      let boxY = 90;
      const boxWidth = width - 40;
      const boxHeight = 40;
      const boxGap = 15;

      // Data list to display
      const dataList = [
        { label: "⏱ Bot Uptime", value: formatTime(uptime) },
        { label: "🖥 System Uptime", value: formatTime(sysUptime) },
        { label: "💾 RAM Usage", value: `${usedMemMB} / ${totalMemMB} MB` },
        { label: "⚙ CPU", value: `${cpuInfo} (${cpuCores} cores)` },
        { label: "📈 CPU Usage", value: `${usage.cpu.toFixed(1)}%` },
        { label: "💻 Platform", value: `${platform} (${arch})` },
        { label: "🖧 Hostname", value: hostname },
        { label: "🕓 Time", value: moment().format("YYYY-MM-DD HH:mm:ss") }
      ];

      // Draw boxes and texts
      for (const item of dataList) {
        drawBox(boxX, boxY, boxWidth, boxHeight, "#222831");
        drawText(item.label, item.value, boxX + 15, boxY + 27);
        boxY += boxHeight + boxGap;
      }

      // Save image to buffer & file
      const buffer = canvas.toBuffer("image/png");
      const imagePath = path.join(__dirname, "uptime_stylish.png");
      fs.writeFileSync(imagePath, buffer);

      // Send image and delete after sending
      await api.sendMessage({
        body: `📊 Stylish ${this.config.botName} Status`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => fs.unlinkSync(imagePath), event.messageID);

    } catch (error) {
      console.error("Uptime command error:", error);
      return api.sendMessage("❌ Uptime কমান্ডে সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }
  }
};
