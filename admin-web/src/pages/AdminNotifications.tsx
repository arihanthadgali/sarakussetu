import { useCallback, useEffect, useMemo, useState } from "react";

import { getNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "../notifications/notificationApi";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setLoading(true); setError(""); setNotifications(await getNotifications()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load notifications."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);
  const markRead = async (id: string) => { try { setSaving(id); setError(""); await markNotificationRead(id); setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, isRead: true } : notification)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update notification."); } finally { setSaving(null); } };
  const markAllRead = async () => { try { setSaving("all"); setError(""); await markAllNotificationsRead(); setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true }))); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update notifications."); } finally { setSaving(null); } };
  return <section className="panel notifications-panel"><div className="panel-heading"><div><h2>Notifications {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}</h2><p>Updates from orders and delivery operations.</p></div><div className="notification-actions"><button type="button" className="ghost-button" disabled={unreadCount === 0 || saving !== null} onClick={() => void markAllRead()}>{saving === "all" ? "Saving…" : "Mark all read"}</button><button type="button" className="ghost-button" disabled={loading || saving !== null} onClick={() => void load()}>↻ Refresh</button></div></div>{error && <div className="error-box notification-error">{error} <button type="button" className="retry-link" onClick={() => void load()}>Retry</button></div>}{loading ? <div className="empty-state">Loading notifications…</div> : notifications.length === 0 ? <div className="empty-state">You have no notifications.</div> : <div className="notification-list">{notifications.map((notification) => <article key={notification.id} className={notification.isRead ? "notification-item" : "notification-item unread"}><div><h3>{notification.title}</h3><p>{notification.message}</p><time>{formatDate(notification.createdAt)}</time></div>{!notification.isRead && <button type="button" className="ghost-button compact" disabled={saving !== null} onClick={() => void markRead(notification.id)}>{saving === notification.id ? "Saving…" : "Mark read"}</button>}</article>)}</div>}</section>;
}
