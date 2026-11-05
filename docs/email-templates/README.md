# Supabase email templates

These are the 3 sign in emails Supabase sends, in the Kestrel look (navy header with the logo, chestnut button). Paste each into Supabase, Authentication, Emails, Templates, in the **source** tab, and put the subject (the first line of each file) in the subject box.

| Template in Supabase | File |
| --- | --- |
| Confirm sign up | `confirm-signup.html` |
| Reset password | `reset-password.html` |
| Change email address | `change-email.html` |

Leave out the first line of the file, which is only a note of the subject. Keep "Secure email change" switched on under Authentication, Sign In / Providers, Email. The change email template is sent twice, once to the old address and once to the new one.

Email the app itself sends (applications, alerts, confirmations) is built in `lib/email-layout.ts` and looks the same.

## The automatic reply to messages sent to hello@ (`auto-reply.html` and `auto-reply.txt`)

This one is not for Supabase. It is a reply for the shared inbox (hello@eyecarejobs.ca), saying a person will answer within 3 business days. Change the number of days in both files if you want a different promise.

How to try it in Google Workspace: in Gmail, Settings, See all settings, General, Vacation responder (the "out of office" box). That box takes formatted text, not raw HTML, so the steps are:
1. Open `auto-reply.html` in a web browser so it displays like an email.
2. Select everything on the page and copy it.
3. Paste it into the vacation responder message box. Check how it looks. Links and bold text usually carry over, and the logo and coloured boxes may not.
4. If it looks wrong, use `auto-reply.txt` instead, which is plain text. Set the start date and leave the end date open, and tick "Only send a response to people in my Contacts" only if you want to.

Send yourself a test from another address to see the real result. If the formatting matters to you later, the app can send this reply itself through Resend, which would keep the full design. That is a small build.
