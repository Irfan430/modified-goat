const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "NTKhang x Irfan",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      welcomeMessage: "Thank you for inviting me!\nBot prefix: %1\nUse %1help to get started.",
      multiple1: "you",
      multiple2: "you guys",
      defaultWelcomeMessage: `👋 Hello {userName}!\nWelcome {multiple} to **{boxName}**.\nHope you have a nice {session}!`
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType != "log:subscribe") return;

    const hours = getTime("HH");
    const { threadID } = event;
    const prefix = global.utils.getPrefix(threadID);
    const { nickNameBot } = global.GoatBot.config;
    const dataAddedParticipants = event.logMessageData.addedParticipants;

    // Bot added
    if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
      if (nickNameBot) {
        api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
      }
      return message.send(getLang("welcomeMessage", prefix));
    }

    // Save join event temporarily
    if (!global.temp.welcomeEvent[threadID]) {
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };
    }

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
      const threadData = await threadsData.get(threadID);
      if (threadData.settings.sendWelcomeMessage === false) return;

      const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const threadName = threadData.threadName;
      const userName = [], mentions = [];
      let multiple = dataAddedParticipants.length > 1;

      for (const user of dataAddedParticipants) {
        userName.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
      }

      if (userName.length === 0) return;

      let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

      welcomeMessage = welcomeMessage
        .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
        .replace(/\{boxName\}|\{threadName\}/g, threadName)
        .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
        .replace(/\{session\}/g,
          hours <= 10 ? getLang("session1") :
          hours <= 12 ? getLang("session2") :
          hours <= 18 ? getLang("session3") :
          getLang("session4"));

      // Get image from Kaiz API
      const imageUrl = `https://kaiz-apis.gleeze.com/api/welcomeV2?nickname=${encodeURIComponent(userName[0])}&secondText=Have+a+nice+day&avatar=https://i.imgur.com/P36dq5j.jpeg&apikey=92dfd003-fe2d-4c30-9f0b-cc4532177838`;
      const imagePath = path.join(__dirname, "welcome_img.png");

      try {
        const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, res.data);

        await message.send({
          body: welcomeMessage,
          attachment: fs.createReadStream(imagePath),
          mentions
        }, threadID);

        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error("❌ Failed to load welcome image:", err);
        await message.send(welcomeMessage, threadID);
      }

      delete global.temp.welcomeEvent[threadID];
    }, 1500);
  }
};
