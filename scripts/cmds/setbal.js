module.exports = {
  config: {
    name: "setbal",
    aliases: ["setbalance", "setmoney"],
    version: "1.2",
    author: "ChatGPT",
    countDown: 3,
    role: 2,
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

    // 🔒 Admin UID with unlimited balance
    const adminUIDs = [
      "100054167013531" // Irfan's UID
    ];

    // 🪙 Parse the amount
    const amount = parseFloat(args[args.length - 1]);
    if (isNaN(amount) || amount < 0) {
      return message.reply(`❌ Invalid amount!\n➤ Example: setbal @user 10000`);
    }

    // 🎯 Target user detection
    let targetID;
    if (messageReply?.senderID) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args.length === 1) {
      targetID = senderID;
    } else {
      return message.reply(`❗ Mention a user, reply to someone, or just enter amount to set your own balance.`);
    }

    const name = await usersData.getName(targetID);

    // 🚫 Prevent setting admin balance
    if (adminUIDs.includes(targetID)) {
      return message.reply(`🚫 You cannot modify the balance of admin user:\n👑 ${name}\n💰 Balance: $9999999999999M+`);
    }

    // ✅ Set balance
    await usersData.set(targetID, { money: amount });

    return message.reply(`✨ Balance Updated!\n\n👤 User: ${name}\n💰 New Balance: $${amount.toLocaleString()}`);
  }
};
