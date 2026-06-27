import React from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { LogIn, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveUserOnLogin, checkIsAdmin } from '../services/firebaseService';
import AdminDashboard from './AdminDashboard';

export default function Auth() {
  const [user, setUser] = React.useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showAdminPanel, setShowAdminPanel] = React.useState(false);

  React.useEffect(() => {
    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await saveUserOnLogin(u);
        const adminStatus = await checkIsAdmin(u.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      
      if (isNative) {
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Login failed because this domain is not authorized in Firebase.\n\nSince you deployed to Netlify (or are using a new preview link), you must go to your Firebase Console -> Authentication -> Settings -> Authorized Domains, and add the domain to the list.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Your browser blocked the login popup because we are inside a preview window!\n\nPlease click the 'Open App' arrow icon in the top right of the preview header to open Swara in a full window, then try logging in again.");
      } else {
        alert("Login failed: " + error.message + "\n\nIf you are in the preview tab, try opening the app in a new window using the top-right button.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (user) {
    return (
      <>
        <div className="flex items-center gap-2 sm:gap-3 glass rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-lg">
          {isAdmin && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="p-1 sm:p-1.5 rounded-full hover:bg-peacock/20 text-marigold transition-colors shrink-0"
              title="Admin Dashboard"
            >
              <Shield size={14} className="sm:w-[14px] sm:h-[14px] w-[12px] h-[12px]" />
            </button>
          )}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-marigold/30 shrink-0">
            <img src={user.photoURL || ''} alt={user.displayName || ''} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-serif font-medium text-cream/70 hidden sm:inline">{user.displayName?.split(' ')[0]}</span>
          <button 
            onClick={handleLogout}
            className="p-1 sm:p-1.5 rounded-full hover:bg-terracotta/20 text-cream/40 hover:text-terracotta transition-colors shrink-0"
            title="Logout"
          >
            <LogOut size={14} className="sm:w-[14px] sm:h-[14px] w-[12px] h-[12px]" />
          </button>
        </div>

        <AnimatePresence>
          {showAdminPanel && (
            <AdminDashboard onClose={() => setShowAdminPanel(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogin}
      className="flex items-center gap-2 glass border-marigold/30 text-marigold text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg hover:bg-marigold/10 transition-all shrink-0"
    >
      <LogIn size={14} />
      <span className="hidden sm:inline">Cloud Sync</span>
    </motion.button>
  );
}
