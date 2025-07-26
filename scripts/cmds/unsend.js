module.exports = {
  config: {
    name: "unsend",
    aliases: ["uns"],
    version: "1.2",
    author: "IRFAN",
    countDown: 5,
    role: 0,
    description: {
      en: "Unsend bot's message",
      bn: "বটের পাঠানো মেসেজ ডিলিট করুন"
    },
    category: "box chat",
    guide: {
      en: "Reply the message you want to unsend and use the command {pn}",
      bn: "যে মেসেজটি ডিলিট করতে চান সেটিতে রিপ্লাই দিয়ে {pn} কমান্ড দিন"
    }
  },

  langs: {
    en: {
      syntaxError: "⚠️ Please reply to the bot's message that you want to unsend.",
      failed: "❌ Failed to unsend the message."
    },
    bn: {
      syntaxError: "⚠️ দয়া করে বটের পাঠানো যে মেসেজটি ডিলিট করতে চান সেটিতে রিপ্লাই দিন।",
      failed: "❌ মেসেজটি ডিলিট করা সম্ভব হয়নি।"
    }
  },

  onStart: async function ({ message, event, api, getLang }) {
    const reply = event.messageReply;
    const botID = api.getCurrentUserID();

    if (!reply || reply.senderID != botID)
      return message.reply(getLang("syntaxError"));

    try {
      await message.unsend(reply.messageID);
    } catch (err) {
      message.reply(getLang("failed"));
    }
  }
};
