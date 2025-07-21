module.exports = {
  config: {
    name: "guessnumber",
    aliases: ["guess", "numbergame"],
    version: "1.1",
    author: "ChatGPT VIP",
    role: 0,
    cooldown: 10,
    description: "🎲 Guess the number between 1-10 and win money!",
    category: "games",
    guide: {
      en: `Use: {pn} <number between 1-10> <bet>\nExample: {pn} 7 1000`
    }
  },

  onStart: async function({ message, event, args, usersData }) {
    const adminUIDs = ["100054167013531"];
    const senderID = event.senderID;

    if (args.length < 2) {
      return message.reply(
        `❌ Usage: guessnumber <number between 1-10> <bet amount>\n` +
        `💡 Example: guessnumber 7 1000`
      );
    }

    const guess = parseInt(args[0]);
    const bet = parseFloat(args[1]);

    if (isNaN(guess) || guess < 1 || guess > 10) {
      // Number outside 1-10 means automatic lose for user
      if (!adminUIDs.includes(senderID)) {
        const userData = await usersData.get(senderID);
        if (userData.money >= bet) {
          await usersData.set(senderID, { money: userData.money - bet });
        }
      }
      return message.reply(
        `⚠️ Your guess must be between 1 and 10!\n` +
        `❌ You lost $${bet.toLocaleString()} for invalid guess.\n` +
        `🔄 Try again with a valid number!`
      );
    }

    if (isNaN(bet) || bet <= 0) {
      return message.reply("❌ Bet amount must be a positive number.");
    }

    const userData = await usersData.get(senderID);
    const isAdmin = adminUIDs.includes(senderID);

    if (!isAdmin && userData.money < bet) {
      return message.reply("💸 You don't have enough balance to bet that amount.");
    }

    // Random number between 1 and 10
    const secretNumber = Math.floor(Math.random() * 10) + 1;

    let response = `🎲✨ *GUESS THE NUMBER (1-10)* ✨🎲\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔢 Your Guess: *${guess}*\n` +
      `🤫 Secret Number: *${secretNumber}*\n\n`;

    if (guess === secretNumber) {
      const reward = bet * 5;
      await usersData.set(senderID, { money: userData.money + reward });
      response +=
        `🎉🥳 *CONGRATULATIONS!* 🥳🎉\n` +
        `💰 You won: 💵 $${reward.toLocaleString()}\n` +
        `🏆 You're a genius! Keep it up! 🚀\n`;
    } else {
      if (!isAdmin) {
        await usersData.set(senderID, { money: userData.money - bet });
      }
      response +=
        `😢❌ *OOPS! WRONG GUESS!* ❌😢\n` +
        `💸 You lost: $${bet.toLocaleString()}\n` +
        `🤞 Try again and beat the odds! 🍀\n`;
    }

    const finalBalance = isAdmin
      ? "$9999999999999M+"
      : "$" + (await usersData.get(senderID, "money")).toLocaleString();

    response +=
      `\n💼 Your Current Balance: *${finalBalance}* 💼\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎮 Type \`guessnumber <1-10> <bet>\` to play again!`;

    return message.reply(response);
  }
};
