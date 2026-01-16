
import { supabase } from '../services/supabase';

/**
 * Vercel Serverless Function for Telegram Webhook
 * Handles commands: /start, /balance, /claim
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const text = message.text.toLowerCase();
  const telegramUser = message.from.username || `user_${chatId}`;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8552243007:AAGW5kSZ9UnXY1o6B6oq2xYr_v9xPFXt9GU";

  const sendMessage = async (msg: string) => {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
    });
  };

  try {
    // 1. Check if user exists in Supabase by Telegram ID or Username
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('username', telegramUser.toUpperCase())
      .maybeSingle();

    if (text === '/start') {
      const welcomeMsg = user 
        ? `Welcome back, *${telegramUser}*! 🚀\n\nYour current node is active.\nUse /balance to check your $WOS earnings.` 
        : `Welcome to *WealthOS Quantum Ecosystem*! 🌐\n\nTo start earning, register on our web portal with the username: *${telegramUser.toUpperCase()}*\n\nYour node is currently: *DISCONNECTED*`;
      await sendMessage(welcomeMsg);
    } 
    
    else if (text === '/balance') {
      if (!user) return sendMessage("❌ User not found. Please login to the web portal first using your Telegram username.");
      await sendMessage(`💎 *WealthOS Balance*\n\nUser: \`${user.username}\`\nBalance: *${user.earnings.toFixed(2)} WOS*\nStatus: *Node Active* ✅`);
    }

    else if (text === '/claim') {
      if (!user) return sendMessage("❌ Register on the portal first.");
      
      // Daily claim logic (fake coins/engagement)
      const now = new Date();
      const lastClaim = user.last_reset ? new Date(user.last_reset) : new Date(0);
      
      if (now.toDateString() === lastClaim.toDateString() && user.viewed_today >= 21) {
        return sendMessage("⏳ *Daily Limit Reached!*\nCome back tomorrow for more $WOS rewards.");
      }

      const reward = 0.5; // Bonus for bot users
      const newBalance = (user.earnings || 0) + reward;
      
      await supabase.from('users').update({ 
        earnings: newBalance,
        last_reset: now.toISOString()
      }).eq('id', user.id);

      await sendMessage(`🎁 *Reward Claimed!*\n\nYou received *${reward} WOS* for community engagement.\nNew Balance: *${newBalance.toFixed(2)} WOS*`);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(200).send('Internal Error But OK');
  }
}
