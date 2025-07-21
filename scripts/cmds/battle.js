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

    if (mention == senderID)
      return message.reply("🧍 You can't fight yourself, brave warrior.");

    if (cooldown.has(senderID))
      return message.reply("⏳ You're resting from your last battle. Please wait!");

    cooldown.add(senderID);
    setTimeout(() => cooldown.delete(senderID), waitTime);

    const senderName = await usersData.getName(senderID);
    const opponentName = await usersData.getName(mention);

    message.reply({
      body: `⚔️ ${senderName} has challenged ${opponentName} to a battle!\n\n👊 React with any emoji to accept.`,
    }, (err, info) => {
      global.GoatBot.onReaction.set(info.messageID, {
        commandName: "battle",
        author: mention,
        senderID,
        opponentID: mention,
        messageID: info.messageID,
        onReact: async ({ event: reactionEvent }) => {
          if (reactionEvent.userID != mention)
            return;

          let p1HP = 100, p2HP = 100;
          let round = 1;
          let log = `🔥 Battle Start: ${senderName} VS ${opponentName}\n\n`;

          while (p1HP > 0 && p2HP > 0) {
            const p1Attack = Math.floor(Math.random() * 25) + 5;
            const p2Attack = Math.floor(Math.random() * 25) + 5;
            p2HP -= p1Attack;
            p1HP -= p2Attack;

            log += `🎯 Round ${round}:\n`;
            log += `👉 ${senderName} hits ${opponentName} for ${p1Attack} damage!\n`;
            log += `👈 ${opponentName} hits ${senderName} for ${p2Attack} damage!\n`;
            log += `❤️ HP - ${senderName}: ${Math.max(p1HP, 0)} | ${opponentName}: ${Math.max(p2HP, 0)}\n\n`;
            round++;
          }

          let winner = p1HP > p2HP ? senderName : opponentName;
          log += `🏆 Winner: ${winner}`;

          message.reply(log);
        }
      });
    });
  }
};
