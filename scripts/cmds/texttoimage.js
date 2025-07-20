const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "text2image",
    author: "IRFAN X KAIZ",
    credits: "IRFAN X KAIZ",
    category: "IMAGE",
    description: "Generate images from text prompts",
    usage: "[text prompt]"
  },

  onStart: async function({ api, event, args }) {
    let { threadID, messageID } = event;
    let prompt = args.join(" ");
    
    if (!prompt) {
      return api.sendMessage("⚠️ Please provide a text prompt!", threadID, messageID);
    }

    api.sendMessage("🖌️ Generating image from text...", threadID, async (err, info) => {
      if (err) return console.error(err);

      const cacheDir = __dirname + "/cache";
      const imagePath = `${cacheDir}/text2image_${Date.now()}.png`;

      try {
        if (!fs.existsSync(cacheDir)) {
          await fs.mkdir(cacheDir, { recursive: true });
        }

        // API call to text2image endpoint
        const response = await axios.get(`https://kaiz-apis.gleeze.com/api/text2image`, {
          params: {
            prompt: encodeURIComponent(prompt),
            apikey: "92dfd003-fe2d-4c30-9f0b-cc4532177838"
          },
          responseType: "arraybuffer"
        });

        await fs.writeFile(imagePath, Buffer.from(response.data, "binary"));

        api.sendMessage({
          body: `🎨 Image generated for: "${prompt}"`,
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
          fs.unlinkSync(imagePath);
        }, messageID);

      } catch (error) {
        console.error("Text2Image API Error:", error.message);
        api.sendMessage("❌ Image generation failed. Please try again later.", threadID, messageID);
      }
    });
  }
};
