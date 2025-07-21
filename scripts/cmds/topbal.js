const fs = require("fs-extra");

module.exports = {
  config: {
    name: "topbal",
    version: "1.0.0",
    credits: "Irfan + ChatGPT",
    description: "Shows the top users based on balance",
    usage: "[topbal]",
    cooldown: 5,
    permissions: [0],
    category: "economy"
  },

  onStart: async function ({ message, usersData }) {
    try {
      const allUsers = await usersData.getAll();

      const sorted = allUsers
        .filter(user => typeof user.money === "number")
        .sort((a, b) => b.money - a.money)
        .slice(0, 10);

      let rankList = sorted.map((user, index) => {
        const emoji = ["🥇", "🥈", "🥉", "🏅", "🎖️", "🏆", "💰", "📈", "💎", "👑"][index] || "⭐";
        return `${emoji} 𝗥𝗮𝗻𝗸 ${index + 1} → ${user.name}\n💸 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ${user.money.toLocaleString()} 𝙼`;
      }).join("\n\n");

      const finalMessage = `✨ 𝗧𝗢𝗣 𝗕𝗔𝗟𝗔𝗡𝗖𝗘 𝗨𝗦𝗘𝗥𝗦 ✨\n━━━━━━━━━━━━━━━━━━\n\n${rankList}\n\n━━━━━━━━━━━━━━━━━━\n⚡ 𝗞𝗲𝗲𝗽 𝗘𝗮𝗿𝗻𝗶𝗻𝗴 𝗧𝗼 𝗧𝗼𝗽 𝗧𝗵𝗲 𝗥𝗮𝗻𝗸!`;

      message.reply(finalMessage);
    } catch (error) {
      console.error(error);
      message.reply("❌ An error occurred while generating the leaderboard.");
    }
  }
};
