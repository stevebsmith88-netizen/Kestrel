"use client";

import { useRef, useState } from "react";
import { deleteSelected, markAllRead, markOneRead, markSelectedRead, openMessage } from "@/lib/notification-actions";

type Item = { id: string; title: string; body: string | null; href: string | null; read: boolean; when: string };

// The message list with tick boxes (Steve, 15th November 2026): tick some, then Mark as read or Delete, or tick Select all. It works with plain
// form posts, so it still works if scripts are off. Deleting asks first, since it cannot be undone.
export default function InboxList({ items }: { items: Item[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const allPicked = picked.size === items.length && items.length > 0;
  const unread = items.filter((i) => !i.read).length;
  const toggle = (id: string) => setPicked((p) => {
    const next = new Set(p);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return (
    <form ref={form} className="inboxform">
      <div className="inboxbar">
        <label className="choice">
          <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(items.map((i) => i.id)))} />
          <span>{picked.size ? `${picked.size} selected` : "Select all"}</span>
        </label>
        <span className="inboxbtns">
          <button type="submit" formAction={markSelectedRead} className="btn sm ghost" disabled={!picked.size}>Mark as read</button>
          <button
            type="submit"
            formAction={deleteSelected}
            className="btn sm ghost"
            disabled={!picked.size}
            onClick={(ev) => {
              if (!window.confirm(`Delete ${picked.size === 1 ? "this message" : `these ${picked.size} messages`}? This cannot be undone.`)) ev.preventDefault();
            }}
          >
            Delete
          </button>
          {unread > 0 && <button type="submit" formAction={markAllRead} className="btn sm ghost">Mark all as read</button>}
        </span>
      </div>
      <ul className="inboxlist">
        {items.map((n) => (
          <li key={n.id} className={n.read ? undefined : "unread"}>
            <label className="inboxpick">
              <input type="checkbox" name="ids" value={n.id} checked={picked.has(n.id)} onChange={() => toggle(n.id)} />
              <span className="sr">Select: {n.title}</span>
            </label>
            <h2>{n.title}</h2>
            <span className="when">{n.when}</span>
            {n.body && <p>{n.body}</p>}
            {(n.href || !n.read) && (
              <span className="actions">
                {n.href && <button type="submit" formAction={openMessage} name="id" value={n.id} className="btn sm ghost">Open</button>}
                {!n.read && <button type="submit" formAction={markOneRead} name="id" value={n.id} className="btn sm ghost">Mark as read</button>}
              </span>
            )}
          </li>
        ))}
      </ul>
    </form>
  );
}
