const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "fluxr",
    author: "IRFAN",
    credits: "IRFAN",
    category: "IMAGE",
    description: "Generate images using Flux Replicate AI model",
    usage: "[text prompt]"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    
    if (!query) {
      return api.sendMessage("⚠️ Please provide a text prompt!", threadID, messageID);
    }

    try {
      api.sendMessage("⏳ Generating your Flux-Replicate image...", threadID, messageID);

      // Create unique cache directory
      const cacheDir = path.join(__dirname, "fluxr_cache");
      const fileName = `fluxr_${Date.now()}.png`;
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
      const apiUrl = `https://kaiz-apis.gleeze.com/api/flux-replicate?prompt=${encodedPrompt}&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`;

      // Fetch image from API with timeout
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'arraybuffer',
        timeout: 120000 // 120 seconds (2 minutes) timeout
      });

      // Validate API response
      if (response.status !== 200 || !/^image\//.test(response.headers['content-type'])) {
        throw new Error(`Invalid API response: ${response.status} ${response.headers['content-type']}`);
      }

      // Save image to cache
      await fs.writeFile(imagePath, Buffer.from(response.data, 'binary'));

      // Send image to user
      api.sendMessage({
        body: "✨ Here's your Flux-Replicate generated image!",
        attachment: fs.createReadStream(imagePath)
      }, threadID, async () => {
        try {
          await fs.unlink(imagePath); // Cleanup after sending
        } catch (cleanupError) {
          console.error("⚠️ File cleanup error:", cleanupError.message);
        }
      }, messageID);

    } catch (error) {
      console.error("❌ FluxR Error:", error.message);
      
      let errorMessage = "❌ Image generation failed. Please try again later.";
      
      if (error.message.includes('timeout')) {
        errorMessage = "⏱️ Request timed out. The AI is still processing, please try again in a moment.";
      } else if (error.message.includes('Invalid API response')) {
        errorMessage = "⚠️ API returned an invalid response. The server might be busy, try again later.";
      }
      
      api.sendMessage(errorMessage, threadID, messageID);
    }
  }
};
