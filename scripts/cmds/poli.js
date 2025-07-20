const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "poli",
    credits: "IRFAN",
    category: "IMAGE" // Changed from "ai" to "IMAGE"
  },

  onStart: async function({ api, event, args }) {
    let { threadID, messageID } = event;
    let query = args.join(" ");
    if (!query) return api.sendMessage("⚠️ Please provide a text/query!", threadID, messageID);

    api.sendMessage("⏳ Generating image, please wait...", threadID, async (err, info) => {
      if (err) return console.error(err);

      const cacheDir = __dirname + "/cache";
      const imagePath = `${cacheDir}/poli_${Date.now()}.png`;

      try {
        if (!fs.existsSync(cacheDir)) {
          await fs.mkdir(cacheDir, { recursive: true });
        }

        const response = await axios.get(`https://kaiz-apis.gleeze.com/api/poli`, {
          params: {
            prompt: query,
            apikey: "92dfd003-fe2d-4c30-9f0b-cc4532177838"
          },
          responseType: "arraybuffer"
        });

        await fs.writeFile(imagePath, Buffer.from(response.data, "binary"));

        api.sendMessage({
          body: "✅ Here's your generated image!",
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
          fs.unlinkSync(imagePath);
        }, messageID);

      } catch (error) {
        console.error("Error Details:", error.message);
        api.sendMessage("❌ Failed to generate image. Please try again later.", threadID, messageID);
      }
    });
  }
};
