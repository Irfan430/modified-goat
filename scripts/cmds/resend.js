module.exports = {
  config: {
    name: "resend",
    version: "5.0",
    author: "Irfan",
    countDown: 1,
    role: 2,
    shortDescription: {
      en: "Enable/Disable Anti unsend mode"
    },
    longDescription: {
      en: "Anti unsend mode. Works with audio, video and images"
    },
    category: "Admins",
    guide: {
      en: "{pn} on or off\nex: {pn} on"
    },
    envConfig: {
      deltaNext: 5
    }
  },

  onStart: async function ({ api, message, event, threadsData, args }) {
    const mode = args[0]?.toLowerCase();

    if (!["on", "off"].includes(mode))
      return message.reply("❌ Usage: resend on/off");

    // থ্রেড ডাটাতে সেটিং সেভ করা
    await threadsData.set(event.threadID, mode === "on", "settings.reSend");

    if (mode === "on") {
      if (!global.reSend) global.reSend = {};
      // থ্রেডের সর্বশেষ ১০০ মেসেজ সংরক্ষণ করে রাখবে
      global.reSend[event.threadID] = await api.getThreadHistory(event.threadID, 100, undefined);
    } else {
      // অফ করলে মেমোরি থেকে মুছে ফেলো
      if (global.reSend && global.reSend[event.threadID]) {
        delete global.reSend[event.threadID];
      }
    }

    return message.reply(`✅ Anti-unsend mode has been ${mode === "on" ? "enabled" : "disabled"}!`);
  },

  onChat: async function ({ api, threadsData, usersData, event, message }) {
    // প্রথমে চেক করো এই থ্রেডে resend mode চালু আছে কি না
    const resend = await threadsData.get(event.threadID, "settings.reSend");
    if (!resend) return;

    // global.reSend অবজেক্ট ইনিশিয়ালাইজ করো যদি না থাকে
    if (!global.reSend) global.reSend = {};
    if (!global.reSend[event.threadID]) global.reSend[event.threadID] = [];

    // মেসেজ আনসেন্ড হলে
    if (event.type === "message_unsend") {
      // আনসেন্ড করা মেসেজ খুঁজে বের করো
      const unsentMsg = global.reSend[event.threadID].find(msg => msg.messageID === event.messageID);
      if (unsentMsg) {
        const senderName = await usersData.getName(event.senderID);
        return message.reply(`🕵️‍♂️ ${senderName} unsent a message:\n\n${unsentMsg.body || "[non-text message]"}`);
      }
      return;
    }

    // অন্য মেসেজ গুলো তালিকায় যোগ করো
    global.reSend[event.threadID].push(event);

    // ৫০ এর বেশি হলে পুরনো মেসেজ বাদ দাও মেমোরি বাঁচাতে
    if (global.reSend[event.threadID].length > 50) {
      global.reSend[event.threadID].shift();
    }
  }
};
