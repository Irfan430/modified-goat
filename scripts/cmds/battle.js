const cooldown = new Set();
const waitTime = 60 * 1000; // 1 minute cooldown

module.exports = {
  config: {
    name: "battle",
    version: "2.0",
    author: "VIP Edition by ChatGPT",
    cooldowns: 5,
    role: 0,
    description: "Challenge someone to an epic battle",
    category: "game",
    usages: "[mention]",
  },

  onStart: async function ({ message, event, usersData }) {
    const senderID = event.senderID;
    const mention = Object.keys(event.mentions)[0];

    if (!mention)
      return message.reply("⚔️ Please mention someone to battle!");

    if (mention === senderID)
      return message.reply("🧍 You can't fight yourself, brave warrior.");

    if (cooldown.has(senderID))
      return message.reply("⏳ You're resting from your last battle. Please wait 1 minute!");

    cooldown.add(senderID);
    setTimeout(() => cooldown.delete(senderID), waitTime);

    const senderName = await usersData.getName(senderID);
    const opponentName = await usersData.getName(mention);

    message.reply({
      body: `⚔️ ${senderName} has challenged ${opponentName} to a **VIP BATTLE**!\n\n🌀 ${opponentName}, react to this message with any emoji within **30s** to accept.`,
    }, (err, info) => {
      if (err || !info.messageID) return;

      // Store the battle request
      global.GoatBot.onReaction.set(info.messageID, {
        commandName: "battle",
        author: mention,
        senderID,
        messageID: info.messageID,
        time: Date.now()
      });
    });
  },

  onReaction: async function ({ message, event, usersData, reaction }) {
    const { messageID, userID } = event;
    const battleData = global.GoatBot.onReaction.get(messageID);
    if (!battleData) return;

    if (userID !== battleData.author) return;

    const senderName = await usersData.getName(battleData.senderID);
    const opponentName = await usersData.getName(userID);

    let p1HP = 100, p2HP = 100;
    let round = 1;
    let log = `🔥 VIP Battle Begins: ${senderName} 🆚 ${opponentName}\n\n`;

    while (p1HP > 0 && p2HP > 0) {
      const p1Attack = Math.floor(Math.random() * 30) + 10;
      const p2Attack = Math.floor(Math.random() * 30) + 10;
      p2HP -= p1Attack;
      p1HP -= p2Attack;

      log += `🎯 Round ${round}:\n`;
      log += `🗡️ ${senderName} attacks for ${p1Attack} damage\n`;
      log += `🛡️ ${opponentName} counters for ${p2Attack} damage\n`;
      log += `❤️ HP: ${senderName}: ${Math.max(p1HP, 0)} | ${opponentName}: ${Math.max(p2HP, 0)}\n\n`;
      round++;
    }

    let winner = p1HP > p2HP ? senderName : opponentName;
    log += `🏆 **Winner:** ${winner} - What a legendary fight!`;

    message.reply(log);
    global.GoatBot.onReaction.delete(messageID);
  }
};
