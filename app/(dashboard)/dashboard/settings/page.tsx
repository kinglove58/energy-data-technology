'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';

type ToggleProps = { enabled: boolean; onToggle: () => void };
const Toggle = ({ enabled, onToggle }: ToggleProps) => (
  <button
    onClick={onToggle}
    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
      enabled ? 'bg-primary' : 'bg-surface-active'
    }`}
  >
    <div
      className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
        enabled ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

const Settings: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(theme === 'dark');
  const [threshold, setThreshold] = useState(85);
  const [apiKey, setApiKey] = useState('************************');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const avatar = user?.imageUrl || 'https://placehold.co/80x80';

  useEffect(() => {
    if (!isLoaded || !user) return;
    setFullName(user.fullName || user.username || 'User');
    setEmail(user.primaryEmailAddress?.emailAddress || '');
    setRole((user.publicMetadata?.role as string) || 'Member');
  }, [isLoaded, user]);

  useEffect(() => {
    setDarkMode(theme === 'dark');
  }, [theme]);

  const handleDarkToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    setTheme(next ? 'dark' : 'light');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const [firstName, ...rest] = fullName.trim().split(' ');
      const lastName = rest.join(' ');
      await user.update({
        firstName: firstName || user.firstName || undefined,
        lastName: lastName || user.lastName || undefined,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          displayEmail: email,
          displayName: fullName.trim(),
        },
      });
      await user.reload?.();
      setFullName(user.fullName || [firstName, lastName].filter(Boolean).join(' ') || 'User');
      setSaveMessage('Profile saved.');
    } catch (err) {
      console.error('Save profile failed', err);
      setSaveMessage('Unable to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-text-muted text-sm mt-1">
            Configure your profile and daily preferences. Integrations are shown for reference.
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span> Profile Settings
          </h3>
          <div className="flex items-start gap-6">
            <img
              src={avatar}
              alt="Profile"
              className="w-20 h-20 rounded-full border-2 border-primary object-cover"
            />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Role</label>
                <input
                  type="text"
                  value={role}
                  disabled
                  className="w-full bg-black/20 border border-border-dark rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !isLoaded}
                  className={`bg-primary text-black font-bold py-2 px-4 rounded-lg text-sm transition-colors ${
                    isSaving || !isLoaded ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-hover'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              {saveMessage && (
                <div className="md:col-span-2 text-xs text-text-muted">
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span> Preferences
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-white">Theft Confidence Threshold</label>
                <span className="text-primary font-bold">{threshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-text-muted mt-2">
                Alerts below this confidence level will be flagged for manual review instead of auto-dispatch.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Dark Mode</p>
                <p className="text-xs text-text-muted">Enable dark theme for the dashboard</p>
              </div>
              <Toggle enabled={darkMode} onToggle={handleDarkToggle} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Daily Digest</p>
                <p className="text-xs text-text-muted">Receive a daily summary of high-priority alerts</p>
              </div>
              <Toggle enabled={notifications} onToggle={() => setNotifications(!notifications)} />
            </div>
          </div>
        </div>

        {/* Integrations (display only) */}
        <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">integration_instructions</span> Integrations
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Google Gemini API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
                <button className="px-3 py-2 bg-surface-active hover:bg-white/10 border border-border-dark rounded-lg text-white">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                </button>
              </div>
              <p className="text-[10px] text-text-muted">Used for Executive Overview insights and Report Generation.</p>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Vapi Voice AI</p>
                  <p className="text-xs text-green-500">Connected</p>
                </div>
              </div>
              <button className="text-xs font-bold text-text-muted hover:text-white">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
