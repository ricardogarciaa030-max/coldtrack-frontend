/**
 * Contexto de Autenticación
 * 
 * Maneja el estado de autenticación del usuario con Firebase.
 * Proporciona funciones para login, logout y verificación de usuario.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { verifyToken } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await verifyToken(token);
          setUser(response.data.user);
        } catch (error) {
          console.error('Error al verificar usuario:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    const response = await verifyToken(token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    resetPassword,
    isAdmin: user?.rol === 'ADMIN',
    isEncargado: user?.rol === 'ENCARGADO',
    isSubjefe: user?.rol === 'SUBJEFE',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
