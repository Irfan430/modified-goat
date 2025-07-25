const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "x18",
    aliases: [],
    version: "4.0",
    author: "IRFAN X KAIZ",
    countDown: 5,
    role: 1, // Admin only
    shortDescription: { en: "18+ video browser" },
    longDescription: { en: "Browse and download 18+ videos with page & select system" },
    category: "nsfw",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ message }) {
    message.reply("🔢 Please reply with page number to view videos.", (err, info) => {
      global.GoatBot.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        type: "selectPage",
        page: 1,
        author: message.senderID
      });
    });
  },

  onReply: async function ({ message, event, Reply, args }) {
    const { type, author, page } = Reply;
    if (event.senderID !== author) return;

    const input = message.body.trim().toLowerCase();

    if (type === "selectPage") {
      if (isNaN(input)) return message.reply("❌ Please send a valid page number.");
      const pageNum = parseInt(input);
      const res = await axios.get(`https://kaiz-apis.gleeze.com/api/xvideos?page=${pageNum}&limit=5&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`);
      const videos = res.data.videos;

      if (!videos || videos.length === 0) return message.reply("❌ No videos found on this page.");

      let msg = `📄 Page ${pageNum} — Select a video:\n\n`;
      videos.forEach((v, i) => {
        msg += `[${i + 1}] ${v.title} (${v.duration})\n`;
      });
      msg += `\n➡️ Reply with number (1-${videos.length}) to get video\n➡️ Or type 'next' to view next page`;

      message.reply(msg, (err, info) => {
        global.GoatBot.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          type: "selectVideo",
          author: event.senderID,
          videos,
          page: pageNum
        });
      });

    } else if (type === "selectVideo") {
      const { videos, page } = Reply;

      if (input === "next") {
        const nextPage = page + 1;
        const res = await axios.get(`https://kaiz-apis.gleeze.com/api/xvideos?page=${nextPage}&limit=5&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`);
        const videos = res.data.videos;

        if (!videos || videos.length === 0) return message.reply("❌ No more videos found.");

        let msg = `📄 Page ${nextPage} — Select a video:\n\n`;
        videos.forEach((v, i) => {
          msg += `[${i + 1}] ${v.title} (${v.duration})\n`;
        });
        msg += `\n➡️ Reply with number (1-${videos.length}) to get video\n➡️ Or type 'next' to view next page`;

        message.reply(msg, (err, info) => {
          global.GoatBot.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            type: "selectVideo",
            author: event.senderID,
            videos,
            page: nextPage
          });
        });

      } else if (!isNaN(input)) {
        const index = parseInt(input) - 1;
        if (index < 0 || index >= videos.length) return message.reply("❌ Invalid selection.");

        const video = videos[index];
        const videoPath = path.join(__dirname, `x18_temp_${Date.now()}.mp4`);
        const writer = fs.createWriteStream(videoPath);

        const vidStream = await axios({
          method: "GET",
          url: video.mp4url,
          responseType: "stream"
        });

        vidStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        await message.send({
          body: `🔞 Title: ${video.title}\n🕒 Duration: ${video.duration}`,
          attachment: fs.createReadStream(videoPath)
        });

        fs.unlinkSync(videoPath);
      } else {
        return message.reply("❌ Please reply with a valid number or 'next'");
      }
    }
  }
};
