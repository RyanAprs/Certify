import { useState, useEffect } from "react";
import { getLocalAccount } from "../lib/viemLocal";

export const useLocalAccount = () => {
  const [privateKey, setPrivateKey] = useState<`0x${string}` | "">("");
  const [account, setAccount] = useState<ReturnType<
    typeof getLocalAccount
  > | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("privateKey");
    if (saved) {
      try {
        const acc = getLocalAccount(saved as `0x${string}`);
        setPrivateKey(saved as `0x${string}`);
        setAccount(acc);
      } catch {
        /* key rusak → bersihkan */
        localStorage.removeItem("privateKey");
      }
    }
  }, []);

  const handleSetPrivateKey = (key: string) => {
    try {
      const acc = getLocalAccount(key as `0x${string}`);
      setPrivateKey(key as `0x${string}`);
      setAccount(acc);
      localStorage.setItem("privateKey", key);
    } catch (e) {
      alert("Invalid private key");
      setAccount(null);
      setPrivateKey("");
      localStorage.removeItem("privateKey");
    }
  };

  return {
    privateKey,
    account,
    address: account?.address,
    handleSetPrivateKey,
  };
};
