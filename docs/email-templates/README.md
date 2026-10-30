# Supabase email templates

These are the 3 sign in emails Supabase sends, in the Kestrel look (navy header with the logo, chestnut button). Paste each into Supabase, Authentication, Emails, Templates, in the **source** tab, and put the subject (the first line of each file) in the subject box.

| Template in Supabase | File |
| --- | --- |
| Confirm sign up | `confirm-signup.html` |
| Reset password | `reset-password.html` |
| Change email address | `change-email.html` |

Leave out the first line of the file, which is only a note of the subject. Keep "Secure email change" switched on under Authentication, Sign In / Providers, Email. The change email template is sent twice, once to the old address and once to the new one.

Email the app itself sends (applications, alerts, confirmations) is built in `lib/email-layout.ts` and looks the same.
