"use client";

import { useEffect } from "react";
import { saveFirstTouch } from "@/lib/attribution";

// Remembers how this visit began, for the waitlist form to send if the person joins. Shows nothing.
export default function AttributionCapture() {
  useEffect(() => {
    saveFirstTouch();
  }, []);
  return null;
}
