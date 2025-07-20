const axios = require("axios");

module.exports = {
  config: {
    name: "cat",
    aliases: [],
    version: "1.0",
    author: "Irfan420x",
    countDown: 5,
    role: 0,
    shortDescription: "AI-generated cat image",
    longDescription: "Generates an AI image of a cat using kaiz-apis",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const prompt = "A cat";
      const apiKey = "92dfd003-fe2d-4c30-9f0b-cc4532177838";
      const url = `https://kaiz-apis.gleeze.com/api/poli?prompt=${encodeURIComponent(prompt)}&apikey=${apiKey}`;
      
      const res = await axios.get(url);
      const imageUrl = res.data.url;

      if (!imageUrl) {
        return api.sendMessage("❌ Image not found.", event.threadID, event.messageID);
      }

      const imgRes = await axios.get(imageUrl, { responseType: "stream" });

      return api.sendMessage({
        body: "Here's your AI cat 🐱",
        attachment: imgRes.data
      }, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Something went wrong while generating the cat image.", event.threadID, event.messageID);
    }
  }
};
