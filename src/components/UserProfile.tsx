import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { calculateTotalXP, getCurrentLevel } from '@/lib/gamification-utils';
import { useHabits } from '@/hooks/useHabits';
import { LogOut, User, Mail, Save, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/contexts/ToastContext';

export function UserProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { habits } = useHabits();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Edit state
  const [name, setName] = useState(profile?.name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isSaving, setIsSaving] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state if profile changes
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  if (!profile || !user) return null;

  const xp = calculateTotalXP(habits);
  const { current } = getCurrentLevel(xp);

  const getBadgeColor = (levelName: string) => {
    switch (levelName) {
      case "Beginner": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Consistent": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Pro": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Elite": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "Master": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  }

  const handleSaveProfile = async () => {
    if (!name.trim() || !username.trim()) return;
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      
      // Add an artificial timeout to prevent infinite spinning if the network drops
      const timeoutPromise = new Promise<{ error: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 8000)
      );
      
      const updatePromise = supabase.from('users').update({
        name: name.trim(),
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        avatar_url: avatarUrl
      }).eq('id', user.id);

      const { error } = await Promise.race([updatePromise, timeoutPromise]);

      if (error) {
        if (error.code === '23505') toast("Username is already taken.", "error");
        else toast("Failed to update profile. Try again.", "error");
      } else {
        await refreshProfile();
        toast("Profile updated successfully ✅", "success");
        setIsOpen(false);
      }
    } catch (e: any) {
      console.error(e);
      toast(e.message === "Request timed out" ? "Network timeout. Try again." : "A network error occurred.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const generateNewAvatar = () => {
    if (isSaving) return;
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`);
  };

  return (
    <>
      <div className="relative" ref={popoverRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn("flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-muted/50 transition-colors", isOpen && "bg-muted")}
        >
          <div className="flex flex-col items-end hidden sm:flex">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold leading-none">{profile.name}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border font-bold uppercase tracking-wider", getBadgeColor(current.name))}>
                {current.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground mr-1">@{profile.username}</span>
          </div>
          <img src={profile.avatar_url} alt="Avatar" className="size-10 rounded-full bg-muted border-2 border-white/20 dark:border-white/10 shadow-sm" />
        </div>

        {/* Profile Popover */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-80 bg-background/98 supports-[backdrop-filter]:bg-background/95 backdrop-blur-3xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.4)] rounded-2xl p-5 z-[100] flex flex-col gap-5 origin-top-right"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold tracking-tight">Profile Settings</h3>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* Avatar Uploader / Editor */}
              <div className={cn("flex flex-col items-center gap-2", isSaving && "opacity-50 pointer-events-none")}>
                <div className="relative group cursor-pointer" onClick={generateNewAvatar}>
                  <img src={avatarUrl} alt="Avatar" className="size-20 rounded-full bg-muted border-4 border-background shadow-md transition-opacity group-hover:opacity-75" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white rounded-full p-2 backdrop-blur-sm">
                      <RefreshCw size={16} />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tap to randomize</span>
              </div>

              <div className="flex flex-col gap-3">
                {/* Email (Read Only) */}
                <div className={cn("flex flex-col gap-1", isSaving && "opacity-50 pointer-events-none")}>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">Email</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl border border-border/50 text-sm text-muted-foreground cursor-not-allowed">
                    <Mail size={14} />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* Name */}
                <div className={cn("flex flex-col gap-1", isSaving && "opacity-70 pointer-events-none")}>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">Full Name</label>
                  <div className="flex items-center gap-2 px-3 py-0 border border-border/60 hover:border-border/80 focus-within:border-indigo-500 rounded-xl bg-transparent transition-all">
                    <User size={14} className="text-muted-foreground" />
                    <input
                      type="text"
                      disabled={isSaving}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent py-2.5 text-sm focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className={cn("flex flex-col gap-1", isSaving && "opacity-70 pointer-events-none")}>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">Username</label>
                  <div className="flex items-center gap-2 px-3 py-0 border border-border/60 hover:border-border/80 focus-within:border-indigo-500 rounded-xl bg-transparent transition-all">
                    <span className="text-muted-foreground font-medium text-sm">@</span>
                    <input
                      type="text"
                      disabled={isSaving}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full bg-transparent py-2.5 text-sm focus:outline-none lowercase disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 pt-4 border-t border-border/50">
                <button
                  onClick={() => setShowLogout(true)}
                  className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || (name === profile.name && username === profile.username && avatarUrl === profile.avatar_url)}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? (
                    <div className="size-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-card w-full max-w-sm rounded-2xl border shadow-xl p-6 text-center"
            >
              <div className="size-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Are you sure you want to log out?</h2>
              <p className="text-muted-foreground text-sm mb-6">You will need to receive a magic link to sign back in.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 bg-foreground text-background py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-sm"
                >
                  No, Keep tracking
                </button>
                <button
                  onClick={() => { setShowLogout(false); signOut(); }}
                  className="flex-1 bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-muted/80 transition-all border border-border/50"
                >
                  Yes, Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
