import TelegramBot from "node-telegram-bot-api";
import { config } from "../config/secret";
import validator from "validator"; // For URL validation

// Initialize the Telegram bot with polling
const bot = new TelegramBot(config.telegram.botToken, { polling: false });

export const sendMessageToTelegram = async (
  text: string,
  imageUrl: string | null
): Promise<void> => {
  const chatId = config.telegram.chatId;

  try {
    if (imageUrl) {
      // Validate the URL
      if (validator.isURL(imageUrl)) {
        // Send photo with caption
        await bot.sendPhoto(chatId, imageUrl, { caption: text });
        console.log(`Sent photo to ${chatId} with caption: ${text}`);
      } else {
        // If URL is invalid, log an error and send text message only
        console.error(`Invalid image URL: ${imageUrl}`);
        await bot.sendMessage(chatId, text);
        console.log(`Sent text message to ${chatId}: ${text}`);
      }
    } else {
      // Send text message only if imageUrl is not provided
      await bot.sendMessage(chatId, text);
      console.log(`Sent text message to ${chatId}: ${text}`);
    }
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error);
  }
};
//need to check chihav
