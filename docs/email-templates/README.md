# Supabase email templates

These are the 3 sign in emails Supabase sends, in the Kestrel look (navy header with the logo, chestnut button). Since 14th November 2026 every email header shows only Kestrel and Eye Care Jobs (`public/brand/kestrel-lockup-email-reversed.png`, the full reversed lockup cropped above the maple leaf and the tagline, nothing redrawn), at Steve's request. The live project has the current templates (pasted by Steve, 14th November 2026). The demo project is left on the old ones on purpose: it sends no email and is only for trying features, so it never needs them (Steve, 14th November 2026). Paste each into Supabase, Authentication, Emails, Templates, in the **source** tab, and put the subject (the first line of each file) in the subject box.

| Template in Supabase | File |
| --- | --- |
| Confirm sign up | `confirm-signup.html` |
| Reset password | `reset-password.html` |
| Change email address | `change-email.html` |

Leave out the first line of the file, which is only a note of the subject. Keep "Secure email change" switched on under Authentication, Sign In / Providers, Email. The change email template is sent twice, once to the old address and once to the new one.

Email the app itself sends (applications, alerts, confirmations) is built in `lib/email-layout.ts` and looks the same.

## The automatic reply to messages sent to hello@ (`auto-reply.txt`, and `auto-reply.html` for tools that accept HTML)

This one is not for Supabase. It is a reply for the shared inbox (hello@eyecarejobs.ca), saying a person will answer within 3 business days. Change the number of days if you want a different promise.

Gmail's vacation responder (Settings, See all settings, General, Vacation responder) takes formatted text, not raw HTML. What works:
1. **Subject:** type "We have your message". Gmail puts your subject in front of the original one ("We have your message Re: Great website").
2. **Message:** paste the text from `auto-reply.txt` (without its first "Subject" line). Then turn each of the 3 lines into a proper link: select the words (for example "Browse eye care jobs across Canada"), press the link button (or Ctrl or Cmd with K) and paste the address from the brackets, then delete the bracketed address. This avoids long web addresses wrapping on a phone.
3. **Signature:** Gmail adds your default signature after the reply. Put the logo, "Eye Care Jobs", the web address and the mailing address (6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2) together in the signature, under the logo, so the reply itself stays short. In Gmail: Settings, See all settings, General, Signature.
4. Send yourself a test from another address to see the real result.

If the formatting matters later, the app can send this reply itself through Resend, which would keep the full design (`auto-reply.html`). That is a small build.
