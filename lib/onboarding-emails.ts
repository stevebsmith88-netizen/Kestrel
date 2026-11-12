// The first week emails for new accounts (marketing audit item 14). Up to 3 for each kind of account, on day 1, day 3 and day 7,
// and only when the step still helps: a clinic that has already posted is not told to post. Written as plain functions so the rules
// can be tested on their own (lib/onboarding-emails.test.ts). The sending is in lib/onboarding-run.ts and is off until
// ENABLE_ONBOARDING_EMAILS is "yes". The wording follows the audit's definitions (docs/definitions.md): the aim for a clinic is a
// first application, and for a candidate a first application sent.

import { emailLayout } from "./email-layout.ts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export const ONBOARDING_DAYS = [1, 3, 7] as const;
// A step missed by a day or two (the daily job was off, or the budget ran out) is still sent for this many days, then dropped.
export const CATCH_UP_DAYS = 3;
export const RESPONSE_DAYS = 5;

export type Role = "clinic" | "candidate";
export type ClinicFacts = { role: "clinic"; hasProfile: boolean; hasSubmitted: boolean; hasLive: boolean; applications: number };
export type CandidateFacts = { role: "candidate"; profileReady: boolean; hasAlert: boolean; applications: number };
export type Facts = ClinicFacts | CandidateFacts;

export const stepId = (role: Role, day: number) => `${role}_day${day}`;

// Does this step still help this person? A step that does not is skipped, never sent as a generic note.
function wanted(day: number, facts: Facts): boolean {
  if (facts.role === "clinic") {
    if (facts.applications > 0) return day === 7; // already working: only the reply reminder is useful
    if (day === 1) return !facts.hasSubmitted;
    return true; // day 3 and day 7 have a version for every other case
  }
  if (facts.applications > 0) return false;
  if (day === 3) return !facts.hasAlert;
  return true;
}

// The next email due for this account, or null. `sent` holds the step ids already sent, so nothing is ever sent twice.
export function dueStep({ createdAt, now, sent, facts }: { createdAt: Date; now: Date; sent: ReadonlySet<string>; facts: Facts }): string | null {
  const ageDays = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  for (const day of ONBOARDING_DAYS) {
    const id = stepId(facts.role, day);
    if (sent.has(id)) continue;
    if (ageDays >= day && ageDays < day + CATCH_UP_DAYS && wanted(day, facts)) return id;
  }
  return null;
}

type Built = { subject: string; heading: string; paragraphs: string[]; buttonText: string; buttonPath: string };

function clinicEmail(day: number, f: ClinicFacts, name: string): Built {
  const hello = `Hello ${name},`;
  if (day === 1) {
    return f.hasProfile
      ? {
          subject: "Your first job post, in about 10 minutes",
          heading: "Post your first job",
          paragraphs: [
            hello,
            "Thanks for registering with Kestrel. If you would like a hand with your first advert, reply to this email and we will help, or post it for you.",
            "Write a few lines about the role and the ad builder gives you a draft to edit. Put the pay range in: candidates on Kestrel see the pay on every job, and a post cannot go live without it.",
            "A person reads each post before it goes live, usually within 1 business day.",
          ],
          buttonText: "Post a job",
          buttonPath: "/clinic/jobs/new",
        }
      : {
          subject: "Set up your clinic profile on Kestrel",
          heading: "One step before your first post",
          paragraphs: [
            hello,
            "Thanks for registering with Kestrel. Your account is ready. The next step is your clinic profile: the clinic's name, where it is and where to send applicant alerts. It takes about 2 minutes.",
            "After that you can post your first job. Every post needs a pay range and 2 yes or no answers, and the form walks you through them.",
          ],
          buttonText: "Create my clinic profile",
          buttonPath: "/clinic/profile",
        };
  }
  if (day === 3) {
    if (!f.hasSubmitted) {
      return {
        subject: "Stuck on your first post? Reply and we will help",
        heading: "Need a hand?",
        paragraphs: [hello, "If something on the post a job form is unclear, reply to this email and tell us what. We can also post a job for you if the form is giving you trouble."],
        buttonText: "Open my dashboard",
        buttonPath: "/clinic",
      };
    }
    if (!f.hasLive) {
      return {
        subject: "Your post is with our team",
        heading: "What happens to your post",
        paragraphs: [hello, "A person reads every post before it goes live, usually within 1 business day. If we ask for a change, the note is in your dashboard and the post goes back to you to edit.", "If it has been longer than 1 business day, reply to this email and we will look at it."],
        buttonText: "See my post",
        buttonPath: "/clinic",
      };
    }
    return {
      subject: "Getting your first applications",
      heading: "Your job is live. Here is what helps",
      paragraphs: [
        hello,
        "Applications can take a few days, especially while Kestrel is new and candidates are still finding it. Three things make a difference.",
        "Check the pay range against what is typical for the role in your province. Share the job link on your clinic's own website and social pages. And put the role in the title the way candidates search for it, such as Optician or Optometric assistant.",
      ],
      buttonText: "Typical pay by province",
      buttonPath: "/resources#pay",
    };
  }
  if (f.applications > 0) {
    return {
      subject: "Reply to your applicants within 5 days",
      heading: "You have applicants waiting",
      paragraphs: [hello, `Candidates are waiting to hear back. A reply within ${RESPONSE_DAYS} days, even a short no, keeps good people from accepting other offers.`, "You can update an applicant's status and add notes in the applicants board."],
      buttonText: "Open my dashboard",
      buttonPath: "/clinic",
    };
  }
  return f.hasLive
    ? {
        subject: "No applications yet? Three things to check",
        heading: "A slow first week is common",
        paragraphs: [
          hello,
          "Kestrel is new, so a post can take a while to be found. Check 3 things: is the pay range in line with the province's typical pay, does the title say the role plainly, and is the post still showing the right city.",
          "Keep posting where you already post, and reply to this email if you would like us to look at it with you.",
        ],
        buttonText: "Open my dashboard",
        buttonPath: "/clinic",
      }
    : {
        subject: "Can we help you post your first job?",
        heading: "Your first post is a few minutes away",
        paragraphs: [hello, "You have an account but have not posted yet. If something got in the way, reply and tell us what, and we will fix it or post the job for you."],
        buttonText: "Post a job",
        buttonPath: "/clinic/jobs/new",
      };
}

function candidateEmail(day: number, f: CandidateFacts, name: string): Built {
  const hello = `Hello ${name},`;
  if (day === 1) {
    return f.profileReady
      ? {
          subject: "Jobs that fit you on Kestrel",
          heading: "Your profile is ready",
          paragraphs: [hello, "Your dashboard now suggests jobs from what you told us, with the reasons shown. Every job lists its pay, so you can see what a job pays before you spend time on it."],
          buttonText: "See jobs for me",
          buttonPath: "/candidate",
        }
      : {
          subject: "Thanks for registering with Kestrel",
          heading: "Finish your profile when you have a few minutes",
          paragraphs: [hello, "Thanks for registering with Kestrel. Come back and add your role, your town and your resume, and you can apply to any job in a few clicks. Your profile stays private: a clinic sees only what you send when you apply.", "Or have a look at the jobs that are available now. Every job shows its pay."],
          buttonText: "Complete my profile",
          buttonPath: "/candidate/profile",
        };
  }
  if (day === 3) {
    return {
      subject: "Let new jobs find you",
      heading: "Set a job alert",
      paragraphs: [hello, "Choose a role and a province, and we email you when a matching job appears. You pick how often, daily, weekly or monthly, and you can stop at any time."],
      buttonText: "Set up an alert",
      buttonPath: "/candidate/alerts",
    };
  }
  return {
    subject: "Ready to apply to your first job?",
    heading: "Applying takes a few minutes",
    paragraphs: [hello, f.profileReady ? "Your resume and details are saved, so applying is a short form. You can write a cover letter, save it as a draft, and keep it to reuse on later applications." : "Once your role, town and resume are saved, applying is a short form. You can write a cover letter, save it as a draft, and keep it to reuse on later applications.", "Every job shows its pay, and every post was read by a person before it went live."],
    buttonText: "Find jobs",
    buttonPath: "/jobs",
  };
}

export function onboardingEmail({ step, firstName, facts, unsubscribeUrl }: { step: string; firstName: string; facts: Facts; unsubscribeUrl: string }) {
  const day = Number(step.split("_day")[1]);
  const name = firstName.trim() || "there";
  const built = facts.role === "clinic" ? clinicEmail(day, facts, name) : candidateEmail(day, facts, name);
  return {
    subject: built.subject,
    ...emailLayout({
      heading: built.heading,
      paragraphs: built.paragraphs,
      buttonText: built.buttonText,
      buttonUrl: `${SITE}${built.buttonPath}`,
      unsubscribeUrl,
      reason: "You are receiving this because you created a Kestrel Eye Care Jobs account.",
    }),
  };
}
