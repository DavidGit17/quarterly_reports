interface SendCampaignEmailOptions {
  to: string;
  username: string;
  cycleName: string;
  projectName: string;
  formUrl: string;
  campaignType: "cycle-start" | "reminder" | "manual";
  scheduledAt?: string;
}

export const sendCampaignEmail = async (
  options: SendCampaignEmailOptions,
): Promise<void> => {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();

  if (!apiKey) {
    const errorMsg =
      "[CAMPAIGN EMAIL] BREVO_API_KEY is not configured in environment variables. Email could not be sent.";
    console.error(errorMsg);
    console.error(
      `[CAMPAIGN EMAIL] Failed to send to ${options.to}: Missing API key`,
    );
    throw new Error("BREVO_API_KEY not configured");
  }

  try {
    const { default: axios } = await import("axios");

    const senderEmail =
      process.env.BREVO_SENDER_EMAIL?.trim() || "noreply@example.com";

    const payload: Record<string, unknown> = {
      sender: {
        email: senderEmail,
        name: "Quarterly Reports",
      },
      to: [{ email: options.to }],
      subject: getSubject(options),
      htmlContent: getHtmlContent(options),
    };
    if (options.scheduledAt) {
      payload.scheduledAt = options.scheduledAt;
    }

    await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log(
      `[CAMPAIGN EMAIL] Sent to ${options.to} for campaign "${options.cycleName}"`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[CAMPAIGN EMAIL] Failed to send to ${options.to}: ${message}`,
    );
    throw new Error(message);
  }
};

function getSubject(options: SendCampaignEmailOptions): string {
  switch (options.campaignType) {
    case "reminder":
      return `Reminder: Submit your ${options.cycleName} report for ${options.projectName}`;
    case "cycle-start":
      return `Reporting period started: ${options.cycleName} — ${options.projectName}`;
    default:
      return `Report submission requested: ${options.cycleName} — ${options.projectName}`;
  }
}

function getHtmlContent(options: SendCampaignEmailOptions): string {
  const roleLabel =
    options.campaignType === "reminder" ? "reminder" : "notification";

  const messages: Record<string, string> = {
    "cycle-start": `The reporting period <strong>${options.cycleName}</strong> has started for <strong>${options.projectName}</strong>. Please submit your report at your earliest convenience.`,
    reminder: `This is a reminder to submit your <strong>${options.cycleName}</strong> report for <strong>${options.projectName}</strong>. The deadline is approaching.`,
    manual: `You have been requested to submit your <strong>${options.cycleName}</strong> report for <strong>${options.projectName}</strong>.`,
  };

  const message = messages[options.campaignType] || messages["manual"];

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4b6358; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Quarterly Reports</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px;">Hi ${options.username},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.formUrl}"
             style="background: #4b6358; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Open Report Form
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">
          If you have already submitted your report, please ignore this ${roleLabel}.
        </p>
      </div>
    </div>
  `;
}
