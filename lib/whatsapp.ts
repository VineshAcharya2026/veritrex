import twilio from "twilio";
import { formatCurrency } from "@/lib/utils";

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendWhatsApp(to: string, message: string) {
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!client || !from) {
    console.log(`[whatsapp stub] To: ${to} | ${message}`);
    return;
  }
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  await client.messages.create({ from, to: formattedTo, body: message });
}

export async function notifyReferrerHired(
  phone: string,
  candidateName: string,
  amount: number
) {
  await sendWhatsApp(
    phone,
    `Veritrex: ${candidateName} was hired! Reward of ${formatCurrency(amount)} is now locked.`
  );
}

export async function notifyReferrerRewardReleased(phone: string, amount: number) {
  await sendWhatsApp(phone, `Veritrex: ${formatCurrency(amount)} has been released to your account.`);
}

export async function notifyEmployerMilestone(
  phone: string,
  candidateName: string,
  dayMark: number
) {
  await sendWhatsApp(
    phone,
    `Veritrex: Please confirm Day ${dayMark} retention for ${candidateName}.`
  );
}
