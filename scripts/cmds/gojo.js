const axios = require('axios');

module.exports = {
  config: {
    name: "gojo",
    aliases: ["sensei", "gogo"],
    author: "IRFAN X KAIZ",
    credits: "IRFAN X KAIZ",
    category: "AI",
    description: "Interact with Gojo AI with image understanding",
    usage: "[question] or reply to an image"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, senderID, attachments, messageReply } = event;
    const question = args.join(" ").trim();

    // Validate input
    if (!question && !(attachments?.[0]?.type === "photo") && 
        !(messageReply?.attachments?.[0]?.type === "photo")) {
      return api.sendMessage(
        "❌ Please provide a question or attach/reply to an image.", 
        threadID, 
        messageID
      );
    }

    // Get image URL
    let imageUrl = "";
    if (attachments?.[0]?.type === "photo") {
      imageUrl = attachments[0].url;
    } else if (messageReply?.attachments?.[0]?.type === "photo") {
      imageUrl = messageReply.attachments[0].url;
    }

    try {
      const processingMsg = await api.sendMessage("🌀 Gojo-sensei is thinking...", threadID);
      
      // Prepare API parameters
      const params = {
        ask: question,
        uid: senderID,
        apikey: '92dfd003-fe2d-4c30-9f0b-cc4532177838'
      };
      
      if (imageUrl) {
        params.imageUrl = imageUrl;
      }

      // Send GET request
      const response = await axios.get('https://kaiz-apis.gleeze.com/api/gojo', {
        params,
        timeout: 30000  // 30 seconds timeout
      });

      // Handle response
      const aiResponse = response.data?.response || "I couldn't process that request.";
      
      // Edit processing message with response
      api.editMessage(aiResponse, processingMsg.messageID);

    } catch (error) {
      console.error("Gojo API Error:", error);
      
      let errorMsg = "❌ Domain expansion failed! ";
      if (error.response) {
        // Handle specific HTTP errors
        switch (error.response.status) {
          case 404:
            errorMsg += "API endpoint not found.";
            break;
          case 401:
            errorMsg += "Invalid API key.";
            break;
          case 400:
            errorMsg += "Bad request. Check your input.";
            break;
          default:
            errorMsg += `Server responded with ${error.response.status}`;
        }
      } else if (error.request) {
        errorMsg += "No response from server.";
      } else {
        errorMsg += error.message;
      }
      
      api.sendMessage(errorMsg, threadID, messageID);
    }
  }
};
