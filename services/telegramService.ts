
/**
 * Telegram Notification Service
 * Securely integrated with WealthOS Bot
 */

const BOT_TOKEN = "8552243007:AAGW5kSZ9UnXY1o6B6oq2xYr_v9xPFXt9GU";
const ADMIN_CHAT_ID = "YOUR_CHAT_ID_HERE"; // Still needs admin's personal chat ID for private alerts

export const sendAdminNotification = async (message: string) => {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error("Telegram Notification Failed:", error);
  }
};

/**
 * Sends a message to a specific user via the bot
 */
export const sendUserMessage = async (chatId: string | number, text: string) => {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error("User Message Failed:", e);
  }
};
