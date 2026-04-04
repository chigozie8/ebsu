// Shared event types — kept separate so lightweight widgets can import without
// pulling in the entire AdminEventsManager page bundle.

export type EventType = "exam" | "lecture" | "meeting" | "social" | "deadline";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: EventType;
  description?: string;
  location?: string;
  lumaUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}
