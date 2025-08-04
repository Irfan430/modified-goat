const axios = require('axios');

module.exports = {
  config: {
    name: "gpt",
    aliases: ["bot", "ai"],
    author: "IRFAN X KAIZ",
    credits: "IRFAN X KAIZ",
    category: "AI",
    description: "Chat with GPT-4o Pro AI (with reply conversation support)",
    usage: "[question] or reply to an image/message"
  },

  onStart: async function({ api, event, args }) {
    await this.handleGPTRequest({ api, event, args });
  },

  onReply: async function({ api, event, args, Reply }) {
    // Check if the reply is for this command and same author
    if (Reply.author !== event.senderID) {
      return api.sendMessage("❌ You're not the original user of this conversation.", event.threadID);
    }
    
    await this.handleGPTRequest({ 
      api, 
      event, 
      args,
      isReply: true,
      replyMessageID: Reply.messageID
    });
  },

  handleGPTRequest: async function({ 
    api, 
    event, 
    args, 
    isReply = false, 
    replyMessageID = null 
  }) {
    const { threadID, messageID, senderID, attachments, messageReply } = event;
    
    let imageUrl = "";
    let question = isReply ? event.body.trim() : args.join(" ").trim();

    // Handle image attachments
    if (attachments && attachments.some(a => a.type === "photo")) {
      imageUrl = attachments.find(a => a.type === "photo").url;
    }
    // Handle image in replied message
    else if (messageReply && messageReply.attachments) {
      const photoAttachment = messageReply.attachments.find(a => a.type === "photo");
      if (photoAttachment) {
        imageUrl = photoAttachment.url;
      }
    }

    // Validate input
    if (!question && !imageUrl) {
      return api.sendMessage(
        "❌ Please provide a question or attach an image with your query.", 
        threadID, 
        messageID
      );
    }

    try {
      // Send processing message only for new requests
      let processingMsgID = null;
      if (!isReply) {
        processingMsgID = await new Promise(resolve => {
          api.sendMessage("💭 Processing your request...", threadID, (err, info) => {
            resolve(info?.messageID);
          });
        });
      }

      const response = await axios.get("https://kaiz-apis.gleeze.com/api/gpt-4o-pro", {
        params: {
          ask: question,
          uid: senderID,
          imageUrl: imageUrl,
          apikey: "92dfd003-fe2d-4c30-9f0b-cc4532177838"
        },
        timeout: 30000
      });

      const aiResponse = response.data.response;
      
      if (isReply && replyMessageID) {
        // Reply to the original bot message
        await new Promise(resolve => {
          api.sendMessage({
            body: aiResponse,
            replyToMessageID: replyMessageID
          }, threadID, resolve);
        });
      } else {
        // Edit processing message or send new
        if (processingMsgID) {
          await api.unsendMessage(processingMsgID);
        }
        
        const sentMsg = await new Promise(resolve => {
          api.sendMessage(aiResponse, threadID, (err, info) => {
            resolve(info);
          });
        });

        // Set reply event for continuous conversation
        if (sentMsg && sentMsg.messageID) {
          global.GoatBot.onReply.set(sentMsg.messageID, {
            commandName: this.config.name,
            messageID: sentMsg.messageID,
            author: senderID
          });
        }
      }
      
    } catch (error) {
      console.error("GPT API Error:", error);
      let errorMsg = "❌ An error occurred while processing your request.";
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = "⏱️ Request timed out. Please try again with a simpler query.";
      } else if (error.response?.status === 429) {
        errorMsg = "🚫 Too many requests. Please wait a few minutes before trying again.";
      }
      
      api.sendMessage(errorMsg, threadID, messageID);
    }
  }
};
