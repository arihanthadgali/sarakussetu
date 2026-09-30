import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { getAdminProfile, type AdminProfile } from "../settings/settingsApi";

export default function AdminSettings() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setLoading(true); setError(""); setProfile(await getAdminProfile()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load account information."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <section className="panel settings-panel"><div className="panel-heading"><div><h2>Account settings</h2><p>Authenticated administrator account information.</p></div><button type="button" className="ghost-button" disabled={loading} onClick={() => void load()}>↻ Refresh</button></div>{error && <div className="error-box notification-error">{error} <button type="button" className="retry-link" onClick={() => void load()}>Retry</button></div>}{loading ? <div className="empty-state">Loading account…</div> : profile === null ? <div className="empty-state">Account information is unavailable.</div> : <div className="settings-details"><div><span>Name</span><strong>{profile.name}</strong></div><div><span>Phone</span><strong>{profile.phoneNumber}</strong></div><div><span>Account ID</span><strong>#{profile.id}</strong></div><div><span>Account created</span><strong>{new Date(profile.createdAt).toLocaleDateString("en-IN")}</strong></div><button type="button" className="secondary-button" onClick={logout}>Log out</button></div>}</section>;
}
