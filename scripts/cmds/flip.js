module.exports = {
  config: {
    name: "flip",
    aliases: ["coinflip", "toss"],
    version: "1.0",
    author: "ChatGPT",
    countDown: 5,
    role: 0,
    description: "🎲 Flip a coin to win or lose money",
    category: "games",
    guide: {
      en: `Use: {pn} heads/tails amount\nExample: {pn} heads 500`
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;

    // ✅ Admin UID - unlimited balance
    const adminUIDs = [
      "100054167013531"
    ];

    const choice = args[0]?.toLowerCase();
    const amount = parseFloat(args[1]);

    if (!["heads", "tails"].includes(choice) || isNaN(amount) || amount <= 0) {
      return message.reply(
        `❌ Invalid usage!\n\n➤ Example: flip heads 500`
      );
    }

    const userData = await usersData.get(senderID);

    if (!adminUIDs.includes(senderID) && userData.money < amount) {
      return message.reply(`💸 You don't have enough balance to place this bet.`);
    }

    // 🎲 Coin flip
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = choice === result;
    const reward = amount * 2;

    // 💰 Update balance
    if (won) {
      await usersData.set(senderID, {
        money: userData.money + reward
      });
      return message.reply(
        `🪙 The coin landed on **${result.toUpperCase()}**\n🎉 You won! +$${reward.toLocaleString()}`
      );
    } else {
      if (!adminUIDs.includes(senderID)) {
        await usersData.set(senderID, {
          money: userData.money - amount
        });
      }
      return message.reply(
        `🪙 The coin landed on **${result.toUpperCase()}**\n😢 You lost! -$${amount.toLocaleString()}`
      );
    }
  }
};
