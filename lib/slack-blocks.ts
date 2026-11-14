import type { SlackButton } from "./slack-approvals.ts";

// The message Slack shows: the alert text, then (when there are buttons) a row of buttons. `text` stays as the plain version that appears in phone
// notifications. Each button asks "Are you sure?" first, so a stray tap does nothing.
export function alertMessage(text: string, buttons: SlackButton[] = []) {
  if (buttons.length === 0) return { text };
  return {
    text,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text } },
      {
        type: "actions",
        elements: buttons.map((b) => ({
          type: "button",
          style: "primary",
          text: { type: "plain_text", text: b.label },
          action_id: b.actionId,
          value: b.value,
          confirm: {
            title: { type: "plain_text", text: b.confirmTitle },
            text: { type: "mrkdwn", text: b.confirmText },
            confirm: { type: "plain_text", text: "Approve" },
            deny: { type: "plain_text", text: "Cancel" },
          },
        })),
      },
    ],
  };
}

// What replaces the message once a button has been pressed: the original text, with the buttons gone and the result in their place.
export function resultMessage(originalText: string, result: string) {
  return { replace_original: true, text: `${originalText}\n${result}`, blocks: [{ type: "section", text: { type: "mrkdwn", text: `${originalText}\n*${result}*` } }] };
}

export const ephemeral = (text: string) => ({ response_type: "ephemeral", replace_original: false, text });
