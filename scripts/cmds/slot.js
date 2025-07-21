module.exports = {
  config: {
    name: "slot",
    aliases: ["slots", "casino"],
    version: "1.0",
    author: "ChatGPT VIP",
    role: 0,
    cooldown: 10,
    description: "🎰 Try your luck with the slot machine!",
    category: "games",
    guide: {
      en: `Use: {pn} <bet>\nExample: {pn} 1000`
    }
  },

  onStart: async function({ message, event, args, usersData }) {
    const adminUIDs = ["100054167013531"];
    const senderID = event.senderID;
    const bet = parseInt(args[0]);

    if (!bet || bet <= 0) return message.reply("❌ Please enter a valid bet amount.");

    const userData = await usersData.get(senderID);
    const isAdmin = adminUIDs.includes(senderID);

    if (!isAdmin && userData.money < bet) return message.reply("💸 Insufficient balance to bet.");

    const emojis = ["🍒", "🍋", "🍊", "🍉", "⭐", "7️⃣"];
    const spin = [
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)],
    ];

    let multiplier = 0;
    if (spin[0] === spin[1] && spin[1] === spin[2]) multiplier = 5; // Jackpot!
    else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) multiplier = 2;

    let resultMsg = `🎰 *Slot Machine* 🎰\n━━━━━━━━━━━━━━━━━━\n` +
      `| ${spin.join(" | ")} |\n━━━━━━━━━━━━━━━━━━\n`;

    if (multiplier > 0) {
      const winAmount = bet * multiplier;
      await usersData.set(senderID, { money: userData.money + winAmount });
      resultMsg += `🎉 Congratulations! You won *$${winAmount.toLocaleString()}* (x${multiplier}) 🎉\n`;
    } else {
      if (!isAdmin) {
        await usersData.set(senderID, { money: userData.money - bet });
      }
      resultMsg += `😢 Sorry, no match. You lost *$${bet.toLocaleString()}*.\n`;
    }

    const balance = isAdmin ? "$9999999999999M+" : `$${(await usersData.get(senderID, "money")).toLocaleString()}`;
    resultMsg += `\n💰 Your Balance: ${balance}\n━━━━━━━━━━━━━━━━━━\nType \`slot <bet>\` to play again!`;

    return message.reply(resultMsg);
  }
};
