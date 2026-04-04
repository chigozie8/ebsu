export interface INotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "announcement" | "update" | "message" | "reply";
  createdAt: string;
  read: boolean;
  link?: string;
  icon?: string;
  /** userId this notification belongs to (or "global" for broadcasts) */
  userId?: string;
}

export type TNotificationType = INotification["type"];
