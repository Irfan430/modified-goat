const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "join",
    aliases: [],
    version: "2.0",
    author: "IRFAN (mod by Kshitiz)",
    countDown: 5,
    role: 2,
    shortDescription: "Join the group that bot is in",
    longDescription: "",
    category: "user",
    guide: {
      en: "{p}{n}",
    },
  },

  onStart: async function ({ api, event }) {
    try {
      const groupList = await api.getThreadList(20, null, ['INBOX']);
      const filteredList = groupList.filter(group => group.isGroup && group.threadName);

      if (filteredList.length === 0) {
        return api.sendMessage('❌ No group chats found.', event.threadID);
      }

      const formattedList = filteredList.map((group, index) =>
        `│${index + 1}. ${group.threadName}\n│🆔: ${group.threadID}`
      );

      const message = `╭── 🎯 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐬𝐭 ──╮\n${formattedList.join("\n")}\n╰───────────ꔪ\n\n📌 Reply with the group number to join.`;

      const sentMessage = await api.sendMessage(message, event.threadID);
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: 'join',
        messageID: sentMessage.messageID,
        author: event.senderID,
        groupList: filteredList
      });
    } catch (error) {
      console.error("Error fetching group list:", error);
      api.sendMessage('❌ An error occurred while fetching the group list.', event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, groupList } = Reply;

    if (event.senderID !== author) return;

    const input = event.body.trim();
    const groupIndex = parseInt(input);

    if (isNaN(groupIndex) || groupIndex < 1 || groupIndex > groupList.length) {
      return api.sendMessage('⚠️ Invalid input. Please enter a valid group number.', event.threadID, event.messageID);
    }

    const selectedGroup = groupList[groupIndex - 1];
    const groupID = selectedGroup.threadID;

    try {
      await api.addUserToGroup(event.senderID, groupID);
      api.sendMessage(`✅ Successfully added you to "${selectedGroup.threadName}".`, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error adding user to group:", error);
      api.sendMessage('❌ Failed to join. The bot might not be an admin or your privacy settings prevent being added.', event.threadID, event.messageID);
    }

    global.GoatBot.onReply.delete(event.messageID);
  },
};					messageID: sentMessage.messageID,
					author: event.senderID,
				});
			}
		} catch (error) {
			console.error("Error listing group chats", error);
		}
	},

	onReply: async function ({ api, event, Reply, args }) {
		const { author, commandName } = Reply;

		if (event.senderID !== author) {
			return;
		}

		const groupIndex = parseInt(args[0], 10);

		if (isNaN(groupIndex) || groupIndex <= 0) {
			api.sendMessage('Invalid input.\nPlease provide a valid number.', event.threadID, event.messageID);
			return;
		}

		try {
			const groupList = await api.getThreadList(10, null, ['INBOX']);
			const filteredList = groupList.filter(group => group.threadName !== null);

			if (groupIndex > filteredList.length) {
				api.sendMessage('Invalid group number.\nPlease choose a number within the range.', event.threadID, event.messageID);
				return;
			}

			const selectedGroup = filteredList[groupIndex - 1];
			const groupID = selectedGroup.threadID;

			await api.addUserToGroup(event.senderID, groupID);
			api.sendMessage(`You have joined the group chat: ${selectedGroup.threadName}`, event.threadID, event.messageID);
		} catch (error) {
			console.error("Error joining group chat", error);
			api.sendMessage('An error occurred while joining the group chat.\nPlease try again later.', event.threadID, event.messageID);
		} finally {
			global.GoatBot.onReply.delete(event.messageID);
		}
	},
};
