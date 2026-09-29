// lib/tools/handlers/sendChannelNotif.ts
// Handler for send_channel_notification tool: dispatches formatted webhook to Discord

import type { SendChannelNotifInput } from "../schemas/sendChannelNotif";

export async function sendChannelNotifHandler(
  args: SendChannelNotifInput,
  workspaceId: string
): Promise<{ success: boolean; delivered: boolean; channel: string; timestamp: string }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "DISCORD_WEBHOOK_URL environment variable is not configured. Please add it to .env.local."
    );
  }

  // Discord embed colors (hex converted to decimal integers)
  const colorMap: Record<string, number> = {
    info: 0x6366f1,    // Indigo / Blurple
    warning: 0xf59e0b, // Amber
    urgent: 0xef4444,  // Red
  };

  const level = args.level || "info";
  const embedColor = colorMap[level] ?? 0x6366f1;

  const discordPayload = {
    embeds: [
      {
        title: args.title || "Workspace Assistant Notification",
        description: args.message,
        color: embedColor,
        fields: [
          {
            name: "Workspace ID",
            value: `\`${workspaceId}\``,
            inline: true,
          },
          {
            name: "Priority",
            value: level.toUpperCase(),
            inline: true,
          },
        ],
        footer: {
          text: "Multi-Workspace Document Assistant (RAG & Tool Calling)",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(discordPayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Discord webhook returned HTTP ${response.status}: ${errorText || "Delivery failed"}`);
  }

  return {
    success: true,
    delivered: true,
    channel: "Discord Channel Webhook",
    timestamp: new Date().toISOString(),
  };
}
