const fs = require("fs");
const path = require("path");
const axios = require("axios");
const os = require("os");

// Load admin UIDs from config.dev.json
const config = require(path.resolve(__dirname, "../../config.dev.json"));
const admins = Array.isArray(config.adminBot) ? config.adminBot : [];

// Database for thread states
const DB = path.resolve(__dirname, "../../database/autolink.json");
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({}), "utf8");

// API key
const API_KEY = "92dfd003-fe2d-4c30-9f0b-cc4532177838";

// Platform ↔ API mapping
const PLATFORMS = [
  { name: "facebook", regex: /facebook\.com/, api: "fbdl-v2" },
  { name: "youtube",  regex: /(youtu\.be|youtube\.com)/, api: "yt-down" },
  { name: "twitter",  regex: /(twitter\.com|x\.com)/, api: "twitter-xdl" },
  { name: "tiktok",   regex: /tiktok\.com/, api: "tiktok-dl" },
  { name: "instagram",regex: /instagram\.com/, api: "insta-dl" },
  { name: "reddit",   regex: /reddit\.com/, api: "reddit-dl" },
  { name: "pinterest",regex: /pinterest\.com/, api: "pinte-dl" },
  { name: "snapchat", regex: /snapchat\.com/, api: "snapchat-dl" },
  { name: "spotify",  regex: /spotify\.com/, api: "spotify-down" },
  { name: "twitch",   regex: /twitch\.tv/, api: "twitch-dl" },
  { name: "capcut",   regex: /capcut\.com/, api: "capcutdl" },
];

module.exports = {
  config: {
    name: "autolink",
    description: "Auto-download media links (admin toggle)",
    usages: "/autolink on | off",
    role: 0,
  },

  onStart: async function({ message, event, args }) {
    const threadID = String(event.threadID);
    const senderID = String(event.senderID);
    const db = JSON.parse(fs.readFileSync(DB, "utf8"));

    if (!admins.includes(senderID)) {
      return message.reply("❌ You are not authorized to use this command.");
    }

    const cmd = args[0]?.toLowerCase();
    if (cmd === "on") {
      db[threadID] = true;
      fs.writeFileSync(DB, JSON.stringify(db, null, 2), "utf8");
      return message.reply("✅ Autolink is now ON for this group.");
    }
    if (cmd === "off") {
      db[threadID] = false;
      fs.writeFileSync(DB, JSON.stringify(db, null, 2), "utf8");
      return message.reply("❌ Autolink is now OFF for this group.");
    }
    return message.reply("⚠️ Use: `/autolink on` or `/autolink off`");
  },

  onChat: async function({ message, event }) {
    const threadID = String(event.threadID);
    const db = JSON.parse(fs.readFileSync(DB, "utf8"));
    if (!db[threadID]) return;
    const text = event.body || "";

    // Find URLs
    const urls = text.match(/https?:\/\/[^\s]+/g);
    if (!urls) return;

    // Find supported platform and first matched link
    const link = urls.find(u => PLATFORMS.some(p => p.regex.test(u)));
    if (!link) return;

    const platform = PLATFORMS.find(p => p.regex.test(link));
    const apiUrl = `https://kaiz-apis.gleeze.com/api/${platform.api}?url=${encodeURIComponent(link)}&apikey=${API_KEY}`;

    try {
      await message.reply("📥 ভিডিও ডাউনলোড হচ্ছে...");

      const { data } = await axios.get(apiUrl);

      // YouTube handling
      if (platform.name === "youtube" && data.response) {
        let videoUrl = null;
        let title = "YouTube Video";

        if (data.response["720p"]?.download_url) {
          videoUrl = data.response["720p"].download_url;
          title = data.response["720p"].title || title;
        } else if (data.response["360p"]?.download_url) {
          videoUrl = data.response["360p"].download_url;
          title = data.response["360p"].title || title;
        }

        if (!videoUrl) return message.reply("❌ ভিডিও ডাউনলোড ব্যর্থ হয়েছে!");

        const tempFilePath = path.join(os.tmpdir(), `${event.messageID}.mp4`);
        const writer = fs.createWriteStream(tempFilePath);

        const response = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream"
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        await message.send({
          body: `✅ ${title}\nOWNER IRFAN`,
          attachment: fs.createReadStream(tempFilePath),
        });

        fs.unlinkSync(tempFilePath);
        return;
      }

      // Instagram handling
      if (platform.name === "instagram" && data.result?.video_url) {
        const streamRes = await axios.get(data.result.video_url, { responseType: "stream" });
        return await message.send({
          body: "✅ Instagram ভিডিও ডাউনলোড সফল হয়েছে!\nOWNER IRFAN",
          attachment: streamRes.data,
        });
      }

      // Other platforms fallback
      const fileUrl =
        data.download_url ||
        (Array.isArray(data.url) ? data.url[0] : data.url) ||
        null;

      if (!fileUrl) return message.reply("❌ ভিডিও ডাউনলোড ব্যর্থ হয়েছে!");

      const streamRes = await axios.get(fileUrl, { responseType: "stream" });
      await message.send({
        body: "✅ ভিডিও ডাউনলোড সফল হয়েছে!\nOWNER IRFAN",
        attachment: streamRes.data,
      });

    } catch (err) {
      console.error("[autolink]", err);
      return message.reply("❌ ভিডিও ডাউনলোড ব্যর্থ হয়েছে!");
    }
  }
};
