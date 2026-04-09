"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import { User } from "@/types";
import config from "@/config";

interface AuthContextType {
  walletAddress: string | null;
  jwt: string | null;
  user: User | null;
  isConnected: boolean;
  isOptedIn: boolean;
  loading: boolean;
  peraWallet: PeraWalletConnect | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setOptedIn: (val: boolean) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);

  useEffect(() => {
    const wallet = new PeraWalletConnect({ shouldShowSignTxnToast: true });
    setPeraWallet(wallet);

    // Restore session from localStorage
    const storedJwt = localStorage.getItem("ide_jwt");
    const storedUser = localStorage.getItem("ide_user");
    const storedWallet = localStorage.getItem("ide_wallet");

    if (storedJwt && storedUser && storedWallet) {
      setJwt(storedJwt);
      setUser(JSON.parse(storedUser));
      setWalletAddress(storedWallet);
      setIsConnected(true);

      // Fetch fresh user + USDC status
      fetchUserAndOptInStatus(storedWallet, storedJwt).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Try to reconnect Pera wallet session
    wallet.reconnectSession().then((accounts) => {
      if (accounts && accounts.length > 0) {
        // Session restored but don't re-auth unless JWT is present
      }
    }).catch(() => {});
  }, []);

  const fetchUserAndOptInStatus = async (address: string, token: string) => {
    try {
      const [userRes, usdcRes] = await Promise.all([
        fetch(`${config.apiUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${config.apiUrl}/auth/usdc-status/${address}`),
      ]);

      if (userRes.ok) {
        const { user: freshUser } = await userRes.json();
        setUser(freshUser);
        localStorage.setItem("ide_user", JSON.stringify(freshUser));
      }

      if (usdcRes.ok) {
        const { isOptedIn: optedIn } = await usdcRes.json();
        setIsOptedIn(optedIn);
      }
    } catch {
      // Silent fail
    }
  };

  const connectWallet = useCallback(async () => {
    if (!peraWallet) return;
    setLoading(true);

    try {
      const accounts = await peraWallet.connect();
      const address = accounts[0];

      // Step 1: Get nonce
      const nonceRes = await fetch(`${config.apiUrl}/auth/nonce/${address}`);
      const { nonce } = await nonceRes.json();

      // Step 2: Sign nonce with Pera
      const encodedNonce = new TextEncoder().encode(nonce);
      const signedNonce = await peraWallet.signData(
        [{ data: encodedNonce, message: `Sign in to India Data Exchange: ${nonce}` }],
        address
      );
      const signature = Buffer.from(signedNonce[0]).toString("base64");

      // Step 3: Verify and get JWT
      const verifyRes = await fetch(`${config.apiUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, signature, nonce }),
      });

      if (!verifyRes.ok) throw new Error("Verification failed");

      const { token, user: verifiedUser } = await verifyRes.json();

      // Persist
      localStorage.setItem("ide_jwt", token);
      localStorage.setItem("ide_user", JSON.stringify(verifiedUser));
      localStorage.setItem("ide_wallet", address);

      setWalletAddress(address);
      setJwt(token);
      setUser(verifiedUser);
      setIsConnected(true);
      setIsOptedIn(verifiedUser.isUSDCOptedIn);

      // Fetch fresh USDC status
      const usdcRes = await fetch(`${config.apiUrl}/auth/usdc-status/${address}`);
      if (usdcRes.ok) {
        const { isOptedIn: optedIn } = await usdcRes.json();
        setIsOptedIn(optedIn);
      }
    } catch (err) {
      console.error("Wallet connect error:", err);
    } finally {
      setLoading(false);
    }
  }, [peraWallet]);

  const disconnectWallet = useCallback(() => {
    peraWallet?.disconnect();
    localStorage.removeItem("ide_jwt");
    localStorage.removeItem("ide_user");
    localStorage.removeItem("ide_wallet");
    setWalletAddress(null);
    setJwt(null);
    setUser(null);
    setIsConnected(false);
    setIsOptedIn(false);
  }, [peraWallet]);

  const refreshUser = useCallback(async () => {
    if (walletAddress && jwt) {
      await fetchUserAndOptInStatus(walletAddress, jwt);
    }
  }, [walletAddress, jwt]);

  return (
    <AuthContext.Provider
      value={{
        walletAddress,
        jwt,
        user,
        isConnected,
        isOptedIn,
        loading,
        peraWallet,
        connectWallet,
        disconnectWallet,
        setOptedIn: setIsOptedIn,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
