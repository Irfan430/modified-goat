const os = require("os");
const moment = require("moment-timezone");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// সরাসরি config.dev.json থেকে লোড
const config = require("../../config.dev.json");

module.exports = {
  config: {
    name: "info",
    version: "3.5.1",
    author: "Irfan420x",
    countDown: 5,
    role: 0,
    shortDescription: "📊 বট ইনফো দেখাবে (config থেকে)",
    longDescription: "PREFIX, Bot Name, VERSION, OWNER, Thread সদস্য সংখ্যা সহ দেখাবে",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      // config থেকে তথ্য
      const prefix = config.prefix;
      const botName = config.nickNameBot;
      const version = config.version || "3.5.1";
      const owner = config.developers?.[0] || "Unknown";
      const timeZone = config.timeZone || "Asia/Dhaka";
      const supportLink = "https://www.facebook.com/psychopath.irfan.io";

      // Uptime ও সময়
      const uptime = new Date(process.uptime() * 1000).toISOString().substr(11, 8);
      const now = moment().tz(timeZone).format("dddd, MMMM Do YYYY • hh:mm:ss A");

      // System Info
      const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
      const cpuModel = os.cpus()[0].model;

      // Thread Info
      let threadName = "This Chat";
      let memberCount = null;
      if (event.threadID && api.getThreadInfo) {
        const ti = await api.getThreadInfo(event.threadID);
        threadName = ti.threadName || "Unnamed";
        memberCount = ti.participantIDs.length;
      }

      // Image download
      const imageUrl = "https://i.postimg.cc/zXD6CQw2/06f1e3b2-5b1e-46f2-8ef6-4f871f5f3a3d.jpg";
      const tmpPath = path.join(__dirname, "tmp_info.jpg");
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(tmpPath, Buffer.from(res.data, "binary"));

      // BOT INFO Block
      const botInfo =
`╔════════════════════════════════════╗
║           🤖 BOT INFORMATION           ║
╚════════════════════════════════════╝
📛 Name         : ${botName}
🔖 Prefix       : ${prefix}
🆚 Version      : ${version}
⚙️ Language     : Node.js
🕒 Uptime       : ${uptime}
📊 RAM Usage    : ${usedMem}MB / ${totalMem}MB
🧬 CPU Model    : ${cpuModel}
📅 Time         : ${now}
`;

      // OWNER INFO Block
      const ownerInfo =
`╔════════════════════════════════════╗
║           👑 OWNER INFORMATION        ║
╚════════════════════════════════════╝
🛡️ Owner ID     : ${owner}
🌐 Support Link : ${supportLink}
`;

      // THREAD INFO Block
      let threadBlock = "";
      if (memberCount !== null) {
        threadBlock =
`╔════════════════════════════════════╗
║          💬 THREAD INFORMATION        ║
╚════════════════════════════════════╝
💬 Thread Name  : ${threadName}
👥 Members      : ${memberCount}
🆔 Thread ID    : ${event.threadID}
`;
      }

      const finalMsg = `${botInfo}\n${ownerInfo}\n${threadBlock}`;

      // Send with image
      api.sendMessage({
        body: finalMsg,
        attachment: fs.createReadStream(tmpPath)
      }, event.threadID, () => fs.unlinkSync(tmpPath));

    } catch (err) {
      console.error("❌ Info command error:", err);
      api.sendMessage("❌ বট তথ্য আনতে সমস্যা হয়েছে!", event.threadID);
    }
  }
};
