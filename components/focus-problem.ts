// After a form is sent and comes back with a mistake, keyboard and screen reader users need to land on the problem,
// not at the top of the page. This finds the first thing that needs attention: a field marked invalid, otherwise the
// form level message.
export function firstProblem(form: Pick<ParentNode, "querySelector">): HTMLElement | null {
  return (
    form.querySelector<HTMLElement>('[aria-invalid="true"]') ??
    form.querySelector<HTMLElement>(".invalid input, .invalid select, .invalid textarea") ??
    form.querySelector<HTMLElement>(".form-err")
  );
}

export function focusFirstProblem(form: Pick<ParentNode, "querySelector">) {
  const target = firstProblem(form);
  if (!target) return false;
  // A message is not normally focusable, so allow it to take focus without joining the tab order.
  if (!/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName) && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus();
  target.scrollIntoView?.({ block: "center" });
  return true;
}
