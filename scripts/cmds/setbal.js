module.exports = {
  config: {
    name: "setbal",
    aliases: ["setbalance", "setmoney"],
    version: "1.1",
    author: "ChatGPT",
    countDown: 3,
    role: 2, // Admin/Owner only
    description: "🎯 Set a user's balance manually with style!",
    category: "economy",
    guide: {
      en: `╔═════ ✦ Set Balance Guide ✦ ═════╗
║ ➤ {pn} amount — Set your own balance
║ ➤ {pn} @user amount — Set someone else's
║ ➤ {pn} [reply] amount — Set replied user's balance
╚════════════════════════════╝`
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;

    // 🪙 Parse the amount
    const amount = parseFloat(args[args.length - 1]);
    if (isNaN(amount) || amount < 0) {
      return message.reply(
        `❌ Invalid amount provided!\n\n➤ Example: setbal @user 10000`
      );
    }

    // 🧍 Determine the target user
    let targetID;
    if (messageReply?.senderID) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args.length === 1) {
      targetID = senderID; // Self
    } else {
      return message.reply(
        `❗ Please mention a user, reply to a user, or just provide amount to set your own balance.`
      );
    }

    // 💰 Set the balance
    await usersData.set(targetID, { money: amount });
    const name = await usersData.getName(targetID);

    return message.reply(
      `✨ Balance Updated!\n\n👤 User: ${name}\n💰 New Balance: $${amount.toLocaleString()}`
    );
  }
};
