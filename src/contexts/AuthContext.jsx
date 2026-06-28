import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { syncUser } from "../services/users";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authenticate with Google
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in!");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        return;
      }
      console.error("Error signing in with Google:", error);
      toast.error("Failed to log in.");
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out.");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to log out.");
    }
  };

  // Listener for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user data in background without blocking the initial render
        syncUser(currentUser).catch(console.error);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
