"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function redactAnalyticsUrl(event: BeforeSendEvent): BeforeSendEvent {
  try {
    const url = new URL(event.url);
    url.search = "";
    url.hash = "";

    return { ...event, url: url.toString() };
  } catch {
    return event;
  }
}

export function WebAnalytics() {
  return <Analytics beforeSend={redactAnalyticsUrl} />;
}
