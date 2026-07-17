import { getDb } from "../db";
import {
  opsProjects, opsScheduleItems, opsMeetingNotes,
} from "../../drizzle/schema";
import { sql } from "drizzle-orm";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  type: "schedule" | "meeting" | "deadline" | "project_start" | "project_end";
  projectId: number;
  projectName: string;
  status?: string;
  progress?: number;
  color?: string;
}

export async function getCalendarEvents(startRange: string, endRange: string): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const events: CalendarEvent[] = [];

  // 1. Project start/end dates
  const projects = await db.select().from(opsProjects);
  for (const p of projects) {
    const startDate = p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : null;
    const endDate = p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : null;

    if (startDate && startDate >= startRange && startDate <= endRange) {
      events.push({
        id: `proj-start-${p.id}`,
        title: `[착공] ${p.name}`,
        date: startDate,
        type: "project_start",
        projectId: p.id,
        projectName: p.name,
        status: p.status ?? undefined,
        color: "#3b82f6",
      });
    }
    if (endDate && endDate >= startRange && endDate <= endRange) {
      events.push({
        id: `proj-end-${p.id}`,
        title: `[준공] ${p.name}`,
        date: endDate,
        type: "project_end",
        projectId: p.id,
        projectName: p.name,
        status: p.status ?? undefined,
        color: "#ef4444",
      });
    }
  }

  // 2. Schedule items (공정표)
  for (const p of projects) {
    const schedules = await db.select().from(opsScheduleItems)
      .where(sql`${opsScheduleItems.projectId} = ${p.id}`);
    for (const s of schedules) {
      const sDate = s.startDate ?? "";
      const eDate = s.endDate ?? "";
      if (sDate && sDate >= startRange && sDate <= endRange) {
        events.push({
          id: `sched-${s.id}`,
          title: s.name,
          date: sDate,
          endDate: eDate || undefined,
          type: "schedule",
          projectId: p.id,
          projectName: p.name,
          status: s.status ?? undefined,
          progress: s.progress ?? 0,
          color: "#f59e0b",
        });
      }
    }
  }

  // 3. Meeting notes
  for (const p of projects) {
    const meetings = await db.select().from(opsMeetingNotes)
      .where(sql`${opsMeetingNotes.projectId} = ${p.id}`);
    for (const m of meetings) {
      const mDate = m.meetingDate ?? "";
      if (mDate && mDate >= startRange && mDate <= endRange) {
        events.push({
          id: `meet-${m.id}`,
          title: m.title,
          date: mDate,
          type: "meeting",
          projectId: p.id,
          projectName: p.name,
          color: "#8b5cf6",
        });
      }
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
