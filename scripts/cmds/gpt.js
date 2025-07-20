const axios = require('axios');

module.exports = {
  config: {
    name: "gpt",
    aliases: ["bot"], // Added aliases for case-insensitive usage
    author: "IRFAN X KAIZ",
    credits: "IRFAN X KAIZ",
    category: "AI",
    description: "Chat with GPT-4o Pro AI (remembers users by UID)",
    usage: "[question] or reply to an image"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, senderID, attachments, messageReply } = event;
    
    let imageUrl = "";
    let question = args.join(" ").trim();

    // Check for image in the current message
    if (attachments && attachments.length > 0 && attachments[0].type === "photo") {
      imageUrl = attachments[0].url;
    }
    // Check for image in the replied message
    else if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
      const repliedAttachment = messageReply.attachments[0];
      if (repliedAttachment.type === "photo") {
        imageUrl = repliedAttachment.url;
      }
    }

    if (!question && !imageUrl) {
      return api.sendMessage("❌ Please provide a question or reply to an image with your query.", threadID, messageID);
    }

    try {
      const processingMsg = await api.sendMessage("💭 Processing your request...", threadID);
      
      const response = await axios.get("https://kaiz-apis.gleeze.com/api/gpt-4o-pro", {
        params: {
          ask: question,
          uid: senderID, // Using UID to remember the user
          imageUrl: imageUrl,
          apikey: "92dfd003-fe2d-4c30-9f0b-cc4532177838"
        }
      });

      const aiResponse = response.data.response;
      api.editMessage(aiResponse, processingMsg.messageID);
      
    } catch (error) {
      console.error("GPT API Error:", error);
      let errorMsg = "❌ An error occurred while processing your request.";
      
      if (error.response?.data) {
        errorMsg += `\n${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMsg += `\n${error.message}`;
      }
      
      api.sendMessage(errorMsg, threadID, messageID);
    }
  }
};
