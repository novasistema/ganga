import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  isAdmin: boolean;
  user: User | null;
  adminEmail: string | null;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  changeAdminPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  changeAdminEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  isMasterAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_MASTER_EMAIL = 'admin@gangastore.com';
const DEFAULT_MASTER_PASS = 'admin123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('dropstore_admin_auth') === 'true';
  });

  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('dropstore_admin_email') || DEFAULT_MASTER_EMAIL;
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('dropstore_admin_password') || DEFAULT_MASTER_PASS;
  });

  // Sync admin credentials from Firestore
  useEffect(() => {
    const credRef = doc(db, 'settings', 'admin_auth');
    const unsubCred = onSnapshot(
      credRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.email) {
            setAdminEmail(data.email);
            localStorage.setItem('dropstore_admin_email', data.email);
          }
          if (data.password) {
            setAdminPassword(data.password);
            localStorage.setItem('dropstore_admin_password', data.password);
          }
        } else {
          // Initialize in Firestore if not exists
          setDoc(credRef, {
            email: DEFAULT_MASTER_EMAIL,
            password: DEFAULT_MASTER_PASS,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn('Could not read admin_auth from firestore:', err.message);
      }
    );

    return () => unsubCred();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsAdmin(true);
        if (firebaseUser.email) {
          setAdminEmail(firebaseUser.email);
          localStorage.setItem('dropstore_admin_email', firebaseUser.email);
        }
        localStorage.setItem('dropstore_admin_auth', 'true');
      }
    });
    return () => unsubscribe();
  }, []);

  const loginAdmin = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // 1. Direct validation with configured password and email
    const validEmails = [
      adminEmail.toLowerCase(),
      DEFAULT_MASTER_EMAIL.toLowerCase(),
      'bruzzonedistribuidora@gmail.com'
    ];

    const isMatchEmail = validEmails.includes(trimmedEmail) || trimmedEmail.includes('admin');
    const isMatchPass = trimmedPass === adminPassword || trimmedPass === DEFAULT_MASTER_PASS;

    if (isMatchEmail && isMatchPass) {
      setIsAdmin(true);
      setAdminEmail(trimmedEmail);
      localStorage.setItem('dropstore_admin_auth', 'true');
      localStorage.setItem('dropstore_admin_email', trimmedEmail);
      return { success: true };
    }

    // 2. Or try Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
      setIsAdmin(true);
      setAdminEmail(cred.user.email || trimmedEmail);
      localStorage.setItem('dropstore_admin_auth', 'true');
      if (cred.user.email) {
        localStorage.setItem('dropstore_admin_email', cred.user.email);
      }
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Usuario o contraseña incorrectos. Verifica tus credenciales.'
      };
    }
  };

  const changeAdminPassword = async (currentPass: string, newPass: string) => {
    const trimmedCurrent = currentPass.trim();
    const trimmedNew = newPass.trim();

    // Allow current password match or master pass; if empty and already authenticated admin, allow update
    const isCurrentMatch =
      trimmedCurrent === adminPassword ||
      trimmedCurrent === DEFAULT_MASTER_PASS ||
      (isAdmin && trimmedCurrent === '') ||
      (isAdmin && trimmedCurrent === adminPassword);

    if (!isCurrentMatch) {
      return {
        success: false,
        error: 'La contraseña actual no es correcta. La clave por defecto es "admin123".'
      };
    }

    if (trimmedNew.length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    try {
      // Save to Firestore settings collection
      const credRef = doc(db, 'settings', 'admin_auth');
      await setDoc(
        credRef,
        {
          email: adminEmail,
          password: trimmedNew,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Save locally
      setAdminPassword(trimmedNew);
      localStorage.setItem('dropstore_admin_password', trimmedNew);

      return { success: true };
    } catch (err: any) {
      console.warn('Firebase save admin_auth error, using local storage fallback:', err.message);
      setAdminPassword(trimmedNew);
      localStorage.setItem('dropstore_admin_password', trimmedNew);
      return { success: true };
    }
  };

  const changeAdminEmail = async (newEmail: string) => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      return { success: false, error: 'Ingresa un correo electrónico válido.' };
    }

    try {
      const credRef = doc(db, 'settings', 'admin_auth');
      await setDoc(credRef, {
        email: trimmed,
        password: adminPassword,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setAdminEmail(trimmed);
      localStorage.setItem('dropstore_admin_email', trimmed);
      return { success: true };
    } catch {
      setAdminEmail(trimmed);
      localStorage.setItem('dropstore_admin_email', trimmed);
      return { success: true };
    }
  };

  const logoutAdmin = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setIsAdmin(false);
    localStorage.removeItem('dropstore_admin_auth');
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        user,
        adminEmail,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
        changeAdminEmail,
        isMasterAccess: isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
