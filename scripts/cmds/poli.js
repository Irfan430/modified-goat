const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "poli",
    author: "IRFAN",
    credits: "IRFAN",
    category: "IMAGE",
    description: "Generate images using the Poli AI model",
    usage: "[text prompt]"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    
    if (!query) {
      return api.sendMessage("⚠️ Please provide a text prompt!", threadID, messageID);
    }

    try {
      api.sendMessage("⏳ Generating your Poli image, please wait...", threadID, messageID);

      // Create unique cache directory
      const cacheDir = path.join(__dirname, "poli_cache");
      const fileName = `poli_${Date.now()}.png`;
      const imagePath = path.join(cacheDir, fileName);

      // Ensure cache directory exists and is a directory
      if (await fs.pathExists(cacheDir)) {
        const stat = await fs.stat(cacheDir);
        if (!stat.isDirectory()) {
          await fs.remove(cacheDir);
          await fs.mkdir(cacheDir, { recursive: true });
        }
      } else {
        await fs.mkdir(cacheDir, { recursive: true });
      }

      // Encode prompt and construct API URL
      const encodedPrompt = encodeURIComponent(query);
      const apiUrl = `https://kaiz-apis.gleeze.com/api/poli?prompt=${encodedPrompt}&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`;

      // Fetch image from API with timeout
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'arraybuffer',
        timeout: 60000 // 60 seconds timeout
      });

      // Validate API response
      if (response.status !== 200 || !/^image\//.test(response.headers['content-type'])) {
        throw new Error(`Invalid API response: ${response.status} ${response.headers['content-type']}`);
      }

      // Save image to cache
      await fs.writeFile(imagePath, Buffer.from(response.data, 'binary'));

      // Send image to user
      api.sendMessage({
        body: "✨ Here's your Poli-generated image!",
        attachment: fs.createReadStream(imagePath)
      }, threadID, async () => {
        try {
          await fs.unlink(imagePath); // Cleanup after sending
        } catch (cleanupError) {
          console.error("⚠️ File cleanup error:", cleanupError.message);
        }
      }, messageID);

    } catch (error) {
      console.error("❌ Poli Error:", error.message);
      const errorMessage = error.message.includes('timeout') 
        ? "🚫 Request timed out. Please try again with a simpler prompt." 
        : "❌ Image generation failed. Please try again later.";
      
      api.sendMessage(errorMessage, threadID, messageID);
    }
  }
};
