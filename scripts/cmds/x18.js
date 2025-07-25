const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "x18",
    aliases: [],
    version: "4.1",
    author: "IRFAN X KAIZ",
    countDown: 10,
    role: 1, // ✅ Admin only
    shortDescription: {
      en: "Send 18+ videos using page and limit"
    },
    longDescription: {
      en: "Example: x18 1 2 → get 2 videos from page 1"
    },
    category: "nsfw",
    guide: {
      en: "{pn} <page> <limit>\n\nExample:\n{pn} 1 3"
    }
  },

  onStart: async function ({ message, args }) {
    const page = parseInt(args[0]) || 1;
    const limit = parseInt(args[1]) || 1;

    if (limit > 10) return message.reply("⚠️ You can request maximum 10 videos at once.");

    try {
      const apiURL = `https://kaiz-apis.gleeze.com/api/xvideos?page=${page}&limit=${limit}&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`;
      const res = await axios.get(apiURL);
      const videos = res.data.videos;

      if (!videos || videos.length === 0) {
        return message.reply("❌ No videos found for this page.");
      }

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const fileName = `x18_${Date.now()}_${i}.mp4`;
        const filePath = path.join(__dirname, fileName);
        const writer = fs.createWriteStream(filePath);

        const videoStream = await axios({
          method: "GET",
          url: video.mp4url,
          responseType: "stream"
        });

        videoStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const caption = `🔞 Title: ${video.title}\n🕒 Duration: ${video.duration}\n🗓️ Uploaded: ${new Date(video.uploadDate).toLocaleString()}`;
        await message.send({
          body: caption,
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath); // ✅ Clean after sending
      }
    } catch (err) {
      console.error("❌ Error:", err.message);
      message.reply("🚨 Failed to fetch or send videos. Try again later.");
    }
  }
};
