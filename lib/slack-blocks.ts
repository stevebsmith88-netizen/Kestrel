import type { SlackButton } from "./slack-approvals.ts";

// The message Slack shows: the alert text, then (when there are buttons) a row of buttons. `text` stays as the plain version that appears in phone
// notifications. Each button asks "Are you sure?" first, so a stray tap does nothing.
export function alertMessage(text: string, buttons: SlackButton[] = []) {
  if (buttons.length === 0) return { text };
  return {
    text,
    blocks: [
      // Slack refuses a block over 3,000 characters, which would lose the whole alert, so a very long one is cut.
      { type: "section", text: { type: "mrkdwn", text: text.length > 2900 ? `${text.slice(0, 2900)} ...` : text } },
      {
        type: "actions",
        elements: buttons.map((b) => ({
          type: "button",
          ...(b.style ? { style: b.style } : {}),
          text: { type: "plain_text", text: b.label },
          action_id: b.actionId,
          value: b.value,
          ...(b.confirmTitle && b.confirmText
            ? {
                confirm: {
                  title: { type: "plain_text", text: b.confirmTitle },
                  text: { type: "mrkdwn", text: b.confirmText },
                  confirm: { type: "plain_text", text: "Approve" },
                  deny: { type: "plain_text", text: "Cancel" },
                },
              }
            : {}),
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

// The small form Slack shows for Send back and Decline: a box for the note, which goes to the clinic or the claimant. `metadata` rides along and comes
// back when the form is submitted, so the site knows which job or claim it was for and which message to update.
export function noteModal(args: { callbackId: string; title: string; label: string; submit: string; hint: string; metadata: { id: string; responseUrl: string; original: string } }) {
  return {
    type: "modal",
    callback_id: args.callbackId,
    title: { type: "plain_text", text: args.title.slice(0, 24) },
    submit: { type: "plain_text", text: args.submit.slice(0, 24) },
    close: { type: "plain_text", text: "Cancel" },
    private_metadata: JSON.stringify({ ...args.metadata, original: args.metadata.original.slice(0, 1200) }),
    blocks: [
      {
        type: "input",
        block_id: "note",
        label: { type: "plain_text", text: args.label },
        hint: { type: "plain_text", text: args.hint },
        element: { type: "plain_text_input", action_id: "note_input", multiline: true, max_length: 1000 },
      },
    ],
  };
}
