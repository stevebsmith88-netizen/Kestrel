# Kestrel Eye Care Jobs

The eyecarejobs.ca website. Today it's the coming soon page and waitlist; it grows into the full job board.

## First time setup (about an hour)

You'll need: Node.js 20 or newer, the Claude desktop app with Claude Code, and these accounts on your Kestrel email address (not your Eye Recommend email).

1. **Unzip this folder** somewhere on your own computer, for example Documents/kestrel-app.
2. **Open it in Claude Code** and say: "Read CLAUDE.md, then help me finish the first time setup in README.md." Claude can run the commands below for you and explain each one.
3. **Install and preview locally:** `npm install`, then `npm run dev`, then open http://localhost:3000. The form will say the waitlist isn't connected yet; that's expected until step 5.
4. **GitHub:** under your existing GitHub login, create a free organisation (for example kestrel-eyecare) and a private repository called kestrel-app inside it. Then push this folder to it.
5. **Supabase:** create an account, then a project in the Canadian region. Open the SQL editor, paste in supabase/migrations/0001_waitlist.sql and run it. From Project Settings > API, copy the Project URL and the service role key.
6. **Local keys:** copy .env.example to .env.local and paste in the 2 Supabase values. Restart `npm run dev` and test the form. Your test sign up appears in Supabase under Table Editor > waitlist.
7. **Vercel:** create an account, choose "Add New Project", import the GitHub repository, and add the same 3 values from .env.local under Environment Variables (set NEXT_PUBLIC_SITE_URL to your Vercel address for now). Deploy. You'll get a live link ending in vercel.app.
8. **Domain (later):** once eyecarejobs.ca is registered, add it in Vercel under Settings > Domains and follow the DNS instructions it gives you.

## Everyday commands

- `npm run dev`: run the site on your computer
- `npm run build`: check everything builds before pushing
- `npm run typecheck`: check the code for type errors

## Where things live

- app/page.tsx: the coming soon page
- app/globals.css: colours, fonts and layout
- components/WaitlistForm.tsx: the form
- lib/waitlist.ts: form fields, wording and validation rules
- app/api/waitlist/route.ts: saves sign ups to Supabase
- supabase/migrations: database setup
- public/brand: all logo files
- docs/PLAN.md: the business plan summary
- CLAUDE.md: everything Claude needs to know about the project
