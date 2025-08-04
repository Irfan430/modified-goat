const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "flux",
    author: "IRFAN X KAIZ",
    credits: "IRFAN X KAIZ",
    category: "IMAGE",
    description: "Generate images using the Flux AI model",
    usage: "[text prompt]"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    if (!query) return api.sendMessage("⚠️ Please provide a text prompt!", threadID, messageID);

    try {
      api.sendMessage("⏳ Generating image, please wait...", threadID, messageID);

      const cacheDir = path.join(__dirname, "flux_cache"); // Changed directory name
      const fileName = `flux_${Date.now()}.png`;
      const imagePath = path.join(cacheDir, fileName);

      // Handle directory creation safely
      if (await fs.pathExists(cacheDir)) {
        const stat = await fs.stat(cacheDir);
        if (!stat.isDirectory()) {
          await fs.remove(cacheDir);
          await fs.mkdir(cacheDir);
        }
      } else {
        await fs.mkdir(cacheDir, { recursive: true });
      }

      // Encode user prompt
      const encodedPrompt = encodeURIComponent(query);
      const apiUrl = `https://kaiz-apis.gleeze.com/api/flux?prompt=${encodedPrompt}&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`;

      // Fetch image with timeout
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'arraybuffer',
        timeout: 60000 // Increased timeout to 60 seconds
      });

      // Validate response
      if (response.status !== 200 || !/^image\//.test(response.headers['content-type'])) {
        throw new Error(`Invalid API response: ${response.status} ${response.headers['content-type']}`);
      }

      // Save image
      await fs.writeFile(imagePath, response.data);

      // Send image
      api.sendMessage({
        body: "✨ Here's your Flux-generated image!",
        attachment: fs.createReadStream(imagePath)
      }, threadID, async () => {
        try {
          await fs.unlink(imagePath); // Cleanup after send
        } catch (cleanupError) {
          console.error("⚠️ Cleanup error:", cleanupError.message);
        }
      }, messageID);

    } catch (error) {
      console.error("❌ Error:", error.message);
      api.sendMessage(`❌ Image generation failed: ${error.message || 'Server overloaded'}\nPlease try again later.`, threadID, messageID);
    }
  }
};
