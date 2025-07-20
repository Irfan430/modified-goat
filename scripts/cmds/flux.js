const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "flux",
    author: "IRFAN X KAIZ", // Updated author name
    credits: "IRFAN X KAIZ", // Also updated credits
    category: "IMAGE",
    description: "Generate images using the Flux AI model",
    usage: "[text prompt]"
  },

  onStart: async function({ api, event, args }) {
    let { threadID, messageID } = event;
    let query = args.join(" ");
    if (!query) return api.sendMessage("⚠️ Please provide a text prompt!", threadID, messageID);

    api.sendMessage("⏳ Generating image, please wait...", threadID, async (err, info) => {
      if (err) return console.error(err);

      const cacheDir = __dirname + "/cache";
      const imagePath = `${cacheDir}/flux_${Date.now()}.png`;

      try {
        if (!fs.existsSync(cacheDir)) {
          await fs.mkdir(cacheDir, { recursive: true });
        }

        // Using the new Flux API endpoint
        const response = await axios.get(`https://kaiz-apis.gleeze.com/api/flux`, {
          params: {
            prompt: query,
            apikey: "92dfd003-fe2d-4c30-9f0b-cc4532177838"
          },
          responseType: "arraybuffer"
        });

        await fs.writeFile(imagePath, Buffer.from(response.data, "binary"));

        api.sendMessage({
          body: "✨ Here's your Flux-generated image!",
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
          fs.unlinkSync(imagePath);
        }, messageID);

      } catch (error) {
        console.error("Flux API Error:", error.message);
        api.sendMessage("❌ Image generation failed. Please try again later.", threadID, messageID);
      }
    });
  }
};
