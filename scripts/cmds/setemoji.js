module.exports = {
  config: {
    name: "setemoji",
    aliases: ["emoji"],
    version: "1.0",
    author: "IRFAN X KAIZ",
    countDown: 5,
    role: 1, // Group admin only
    shortDescription: {
      en: "Set group emoji"
    },
    longDescription: {
      en: "Change the group chat emoji to your desired one"
    },
    category: "group",
    guide: {
      en: "{pn} [emoji]\n\nExample:\n{pn} 😎"
    }
  },

  onStart: async function ({ api, event, message, args }) {
    const emoji = args[0];

    if (!emoji) {
      return message.reply("❌ Please provide an emoji.\n\nExample:\nsetemoji 😎");
    }

    try {
      await api.changeThreadEmoji(emoji, event.threadID);
      return message.reply(`✅ Group emoji has been set to: ${emoji}`);
    } catch (err) {
      console.log("setemoji error:", err);
      return message.reply("❌ Failed to set emoji. The bot might not have permission.");
    }
  }
};
