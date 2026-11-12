// The getting started checklists on the clinic and candidate home pages (marketing audit item 15). Each step is done or not from facts
// the home page already has, and the list goes away once every step is done. The last step is the same aha moment as
// docs/definitions.md: a clinic's first application received, a candidate's first application sent.

export type Step = { label: string; detail: string; href: string; cta: string; done: boolean };

export function clinicSteps(f: { hasProfile: boolean; submitted: number; live: number; applications: number }): Step[] {
  return [
    { label: "Set up your clinic profile", detail: "Your clinic's name, where it is and where to send applicant alerts. About 2 minutes.", href: "/clinic/profile", cta: "Create my profile", done: f.hasProfile },
    { label: "Post your first job", detail: "Write a few lines and the ad builder drafts the rest. Include the pay range.", href: "/clinic/jobs/new", cta: "Post a job", done: f.submitted > 0 },
    { label: "Get it live", detail: "A person reads each post, usually within 1 business day, and then it goes live.", href: "/clinic", cta: "See my jobs", done: f.live > 0 },
    { label: "Receive your first application", detail: "Share the job link on your clinic's own pages to help it along.", href: "/resources#pay", cta: "Check typical pay", done: f.applications > 0 },
  ];
}

export function candidateSteps(f: { profileReady: boolean; lookingFor: boolean; hasAlert: boolean; applications: number }): Step[] {
  return [
    { label: "Add your role and save your resume", detail: "Then you can apply to any job in a few clicks.", href: "/candidate/profile", cta: "Complete my profile", done: f.profileReady },
    { label: "Say what you are looking for", detail: "Your town or provinces, and the pay you need, so the suggestions fit.", href: "/candidate/profile#looking-for", cta: "Add what I want", done: f.lookingFor },
    { label: "Set a job alert", detail: "We email you when a job matches. Daily, weekly or monthly.", href: "/candidate/alerts", cta: "Set an alert", done: f.hasAlert },
    { label: "Send your first application", detail: "Every job shows its pay. Kestrel can draft a cover letter for you to edit.", href: "/jobs", cta: "Find jobs", done: f.applications > 0 },
  ];
}

// The first step still to do, so the list can point at it.
export const nextStep = (steps: Step[]) => steps.find((s) => !s.done) ?? null;
export const allDone = (steps: Step[]) => steps.every((s) => s.done);
