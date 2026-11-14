"use client";

import { useServerForm } from "@/components/useServerForm";
import { cancelInvite, changeTeamLevel, inviteTeamMember, joinWithCode, makeOwner, removeTeamMember, resendInvite, type TeamState } from "@/lib/team-actions";
import { LEVELS } from "@/lib/team";

function Result({ state }: { state: TeamState }) {
  return (
    <>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && (
        <p className="ok-msg" role="status">
          {state.message}
          {state.code && <> If it does not arrive, give them this code to use when they sign up: <strong className="teamcode">{state.code}</strong></>}
        </p>
      )}
    </>
  );
}

// The owner's invitation form: 3 boxes and a button (Steve, 14th November 2026).
export function InviteForm({ full }: { full: boolean }) {
  const { state, pending, submit } = useServerForm<TeamState>(inviteTeamMember);
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <div className="pair">
        <div className="row">
          <label className="lab" htmlFor="tm-name">Their name</label>
          <input id="tm-name" name="name" type="text" autoComplete="off" maxLength={120} />
        </div>
        <div className="row">
          <label className="lab" htmlFor="tm-email">Their work email</label>
          <input id="tm-email" name="email" type="email" autoComplete="off" maxLength={254} />
        </div>
      </div>
      <fieldset className="row">
        <legend className="lab">What they can do</legend>
        {LEVELS.map((l, i) => (
          <label className="choice" key={l.value}>
            <input type="radio" name="level" value={l.value} defaultChecked={i === 0} />
            <span><strong>{l.label}.</strong> {l.help}</span>
          </label>
        ))}
      </fieldset>
      <Result state={state} />
      <button type="submit" className="btn" disabled={pending || full}>{pending ? "Sending" : "Send invite"}</button>
    </form>
  );
}

function Small({ action, fields, label, className = "linkbtn", confirm }: { action: (prev: TeamState, form: FormData) => Promise<TeamState>; fields: Record<string, string>; label: string; className?: string; confirm?: string }) {
  const { state, pending, submit } = useServerForm<TeamState>(action);
  return (
    <form onSubmit={submit} className="teamact">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {confirm && <label className="consent"><input type="checkbox" name="confirm" value="yes" /><span>{confirm}</span></label>}
      <button type="submit" className={className} disabled={pending}>{pending ? "Working" : label}</button>
      <Result state={state} />
    </form>
  );
}

export const ResendInvite = ({ id }: { id: string }) => <Small action={resendInvite} fields={{ id }} label="Send again" />;
export const CancelInvite = ({ id }: { id: string }) => <Small action={cancelInvite} fields={{ id }} label="Cancel" className="linkbtn warn" />;
export const RemoveMember = ({ userId, name }: { userId: string; name: string }) => <Small action={removeTeamMember} fields={{ userId }} label={`Remove ${name}`} className="linkbtn warn" />;
export const MakeOwner = ({ userId, name }: { userId: string; name: string }) => <Small action={makeOwner} fields={{ userId }} label={`Make ${name} the owner`} confirm={`Yes, hand the clinic to ${name}. I stay on the team and can view and edit.`} />;

export function LevelForm({ userId, level }: { userId: string; level: string }) {
  const { state, pending, submit } = useServerForm<TeamState>(changeTeamLevel);
  return (
    <form onSubmit={submit} className="teamact">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr" htmlFor={`lv-${userId}`}>What they can do</label>
      <select id={`lv-${userId}`} name="level" defaultValue={level}>
        {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
      <button type="submit" className="btn sm ghost" disabled={pending}>{pending ? "Saving" : "Save"}</button>
      <Result state={state} />
    </form>
  );
}

export function JoinForm({ code }: { code: string }) {
  const { state, pending, submit } = useServerForm<TeamState>(joinWithCode);
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <div className="row">
        <label className="lab" htmlFor="jn-code">Invite code</label>
        <input id="jn-code" name="code" type="text" autoComplete="off" defaultValue={code} placeholder="KT-XXXX-XXXX" maxLength={20} />
      </div>
      <Result state={state} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Joining" : "Join the clinic"}</button>
    </form>
  );
}
