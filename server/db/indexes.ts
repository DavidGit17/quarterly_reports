import { Db } from "mongodb";

export async function createAllIndexes(db: Db): Promise<void> {
  const operations = [
    db.collection("users").createIndexes([
      { key: { usernameLower: 1 }, name: "users_username_lower_idx" },
      { key: { emailLower: 1 }, name: "users_email_lower_idx" },
      {
        key: { role: 1, status: 1, project: 1 },
        name: "users_role_status_project_idx",
      },
    ]),
    db.collection("rate_limits").createIndexes([
      {
        key: { key: 1, expiresAt: 1 },
        name: "rate_limits_key_expires_at_idx",
      },
      {
        key: { expiresAt: 1 },
        name: "rate_limits_expires_at_ttl_idx",
        expireAfterSeconds: 0,
      },
    ]),
    db.collection("otp_verification").createIndexes([
      { key: { email: 1 }, name: "otp_email_idx" },
    ]),
    db.collection("form_configs").createIndexes([
      {
        key: { key: 1 },
        name: "form_configs_key_idx",
        unique: true,
      },
    ]),
    db.collection("reports").createIndexes([
      { key: { createdAt: -1 }, name: "reports_created_at_desc_idx" },
      {
        key: { createdBy: 1, createdAt: -1 },
        name: "reports_created_by_created_at_desc_idx",
      },
      {
        key: { projectName: 1, createdAt: -1 },
        name: "reports_project_name_created_at_idx",
      },
      {
        key: { status: 1, createdAt: -1 },
        name: "reports_status_created_at_idx",
      },
      { key: { cycleId: 1 }, name: "reports_cycle_id_idx" },
    ]),
    db.collection("reporting_cycles").createIndexes([
      {
        key: { status: 1, linkedProjects: 1 },
        name: "cycles_status_linked_projects_idx",
      },
      { key: { createdAt: -1 }, name: "cycles_created_at_desc_idx" },
    ]),
    db.collection("form_distribution_rules").createIndexes([
      {
        key: { status: 1, nextSendAt: 1 },
        name: "rules_status_next_send_idx",
      },
      { key: { createdAt: -1 }, name: "rules_created_at_desc_idx" },
      {
        key: { processingStartedAt: 1 },
        name: "rules_processing_started_at_idx",
      },
    ]),
    db.collection("form_distribution_send_history").createIndexes([
      {
        key: { ruleId: 1, sentAt: -1 },
        name: "send_history_rule_id_sent_at_idx",
      },
      { key: { sentAt: -1 }, name: "send_history_sent_at_desc_idx" },
      {
        key: { recipientEmail: 1, sentAt: -1 },
        name: "send_history_recipient_email_sent_at_idx",
      },
    ]),
    db.collection("email_campaigns").createIndexes([
      {
        key: { status: 1, scheduledAt: 1 },
        name: "campaigns_status_scheduled_at_idx",
      },
      { key: { cycleId: 1 }, name: "campaigns_cycle_id_idx" },
      { key: { createdAt: -1 }, name: "campaigns_created_at_desc_idx" },
    ]),
  ];

  await Promise.allSettled(operations);
}
