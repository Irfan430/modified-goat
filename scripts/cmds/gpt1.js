const axios = require('axios');

module.exports = {
  config: {
    name: "gpt1",
    aliases: ["ai1", "gpt4.1"],
    author: "IRFAN X KAIZ",
    credits: "IRFAN X KAIZ",
    category: "AI",
    description: "GPT-4.1 with image understanding",
    usage: "[question] or reply to image"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, senderID, attachments, messageReply } = event;
    const question = args.join(" ").trim();

    // Validate input
    if (!question && !attachments?.[0]?.type === "photo" && 
        !messageReply?.attachments?.[0]?.type === "photo") {
      return api.sendMessage("❌ Please provide text or attach an image", threadID, messageID);
    }

    // Get image URL
    let imageUrl = "";
    const targetAttachments = attachments.length ? attachments : 
                            (messageReply?.attachments || []);
    
    if (targetAttachments[0]?.type === "photo") {
      imageUrl = targetAttachments[0].url;
    }

    try {
      const processingMsg = await api.sendMessage("🧠 Processing your request...", threadID);
      
      // API parameters - using GET with query params
      const params = {
        ask: question,
        uid: senderID,
        apikey: '92dfd003-fe2d-4c30-9f0b-cc4532177838'
      };
      
      if (imageUrl) params.imageUrl = imageUrl;

      // Send GET request (as per API example)
      const response = await axios.get(
        'https://kaiz-apis.gleeze.com/api/gpt-4.1',
        { params }
      );

      // Handle response
      let aiResponse = response.data.response || "No response from AI";
      api.editMessage(aiResponse, processingMsg.messageID);

    } catch (error) {
      console.error("GPT-4.1 API Error:", error);
      
      // User-friendly error messages
      let errorMsg = "❌ Failed to get response from AI service. ";
      
      if (error.response) {
        errorMsg += `[Status: ${error.response.status}]`;
        if (error.response.status === 404) {
          errorMsg += "\n⚠️ API endpoint not found. Please check the URL";
        }
      } else {
        errorMsg += error.message;
      }
      
      api.sendMessage(errorMsg, threadID, messageID);
    }
  }
};
