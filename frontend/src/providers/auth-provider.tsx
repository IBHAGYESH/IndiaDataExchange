"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";
import { User } from "@/types";
import config from "@/config";

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const ALGOD_URL = "https://testnet-api.algonode.cloud";

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const peraRef = useRef<PeraWalletConnect | null>(null);
  const initRef = useRef(false);

  const fetchUserData = useCallback(
    async (address: string, token: string) => {
      try {
        const [userRes, usdcRes] = await Promise.all([
          fetch(`${config.apiUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${config.apiUrl}/auth/usdc-status/${address}`),
        ]);

        if (userRes.ok) {
          const body = await userRes.json();
          const freshUser = body.user;
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem("ide_user", JSON.stringify(freshUser));
          }
        }

        if (usdcRes.ok) {
          const body = await usdcRes.json();
          setIsOptedIn(!!body.isOptedIn);
        }
      } catch {
        /* network error — keep stale data */
      }
    },
    []
  );

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const pera = new PeraWalletConnect({ shouldShowSignTxnToast: true });
    peraRef.current = pera;

    const storedJwt = localStorage.getItem("ide_jwt");
    const storedUser = localStorage.getItem("ide_user");
    const storedWallet = localStorage.getItem("ide_wallet");

    if (storedJwt && storedUser && storedWallet) {
      try {
        setJwt(storedJwt);
        setUser(JSON.parse(storedUser));
        setWalletAddress(storedWallet);
        setIsConnected(true);
      } catch {
        localStorage.removeItem("ide_user");
      }

      pera
        .reconnectSession()
        .then((accounts) => {
          if (!accounts?.length) {
            // Pera session expired but we still have JWT — keep the session
            // User can re-sign if they try a wallet-signing action
          }
        })
        .catch(() => {})
        .finally(() => {
          fetchUserData(storedWallet, storedJwt).finally(() =>
            setLoading(false)
          );
        });
    } else {
      pera
        .reconnectSession()
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [fetchUserData]);

  const connectWallet = useCallback(async () => {
    const pera = peraRef.current;
    if (!pera) throw new Error("Pera Wallet not initialized");
    setLoading(true);

    try {
      const accounts = await pera.connect();
      if (!accounts?.length) throw new Error("No accounts returned");
      const address = accounts[0];

      const nonceRes = await fetch(
        `${config.apiUrl}/auth/nonce/${address}`
      );
      if (!nonceRes.ok) throw new Error("Failed to get nonce from server");
      const { nonce } = await nonceRes.json();

      const algodClient = new algosdk.Algodv2("", ALGOD_URL, "");
      const suggestedParams = await algodClient.getTransactionParams().do();

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: address,
        receiver: address,
        amount: 0,
        note: new TextEncoder().encode(`IDE-SIWA:${nonce}`),
        suggestedParams,
      });

      const signedTxns = await pera.signTransaction([[{ txn }]]);
      const signedTxnBase64 = uint8ToBase64(new Uint8Array(signedTxns[0]));

      const verifyRes = await fetch(`${config.apiUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, signedTxnBase64, nonce }),
      });

      if (!verifyRes.ok) {
        const errBody = await verifyRes.json().catch(() => ({}));
        throw new Error(
          (errBody as any).message || "Wallet verification failed"
        );
      }

      const { token, user: verifiedUser } = await verifyRes.json();

      localStorage.setItem("ide_jwt", token);
      localStorage.setItem("ide_user", JSON.stringify(verifiedUser));
      localStorage.setItem("ide_wallet", address);

      setWalletAddress(address);
      setJwt(token);
      setUser(verifiedUser);
      setIsConnected(true);
      setIsOptedIn(verifiedUser?.isUSDCOptedIn ?? false);

      try {
        const usdcRes = await fetch(
          `${config.apiUrl}/auth/usdc-status/${address}`
        );
        if (usdcRes.ok) {
          const body = await usdcRes.json();
          setIsOptedIn(!!body.isOptedIn);
        }
      } catch {
        /* non-critical */
      }
    } catch (err) {
      console.error("Wallet connect error:", err);
      try {
        pera.disconnect();
      } catch {
        /* ignore */
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    try {
      peraRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("ide_jwt");
    localStorage.removeItem("ide_user");
    localStorage.removeItem("ide_wallet");
    setWalletAddress(null);
    setJwt(null);
    setUser(null);
    setIsConnected(false);
    setIsOptedIn(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (walletAddress && jwt) {
      await fetchUserData(walletAddress, jwt);
    }
  }, [walletAddress, jwt, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        walletAddress,
        jwt,
        user,
        isConnected,
        isOptedIn,
        loading,
        peraWallet: peraRef.current,
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
