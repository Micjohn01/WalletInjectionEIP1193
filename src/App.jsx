import React, { useState, useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";

const App = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(null); // State to store the balance

  useEffect(() => {
    // Detect the Ethereum provider (MetaMask)
    const setup = async () => {
      const detectedProvider = await detectEthereumProvider();
      
      if (detectedProvider && detectedProvider === window.ethereum) {
        console.log("MetaMask is available!");
        setProvider(detectedProvider);

        const initialChainId = await window.ethereum.request({ method: "eth_chainId" });
        setChainId(initialChainId);

        handleAccountsChanged(await window.ethereum.request({ method: "eth_accounts" }));

        // Handle chain changes
        window.ethereum.on("chainChanged", handleChainChanged);

        // Handle account changes
        window.ethereum.on("accountsChanged", handleAccountsChanged);

        // Handle disconnect event
        window.ethereum.on("disconnect", handleDisconnect);
      } else {
        console.log("Please install MetaMask!");
      }
    };

    setup();

    // Clean up event listeners when component unmounts
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  // Handle chain change
  const handleChainChanged = (_chainId) => {
    console.log(`Chain changed to: ${_chainId}`);
    setChainId(_chainId);
    window.location.reload(); // reload to handle the new network
  };

  // Handle account change
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      console.log("Please connect to MetaMask.");
      setAccount(null);
      setIsConnected(false);
      setBalance(null); // Reset balance if no account is connected
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      setIsConnected(true);
      await fetchBalance(accounts[0]); // Fetch the balance when the account changes
    }
  };

  // Handle disconnect
  const handleDisconnect = (error) => {
    console.log("Disconnected from MetaMask", error);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setBalance(null); // Reset balance on disconnect
  };

  // Fetch the balance of the connected account
  const fetchBalance = async (account) => {
    try {
      const balanceWei = await window.ethereum.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      console.log("Balance: ", balanceWei);
      
      const balanceInEth = parseInt(balanceWei) / parseInt("1000000000000000000").toFixed(2); // Convert balance from Wei to Ether
      setBalance(balanceInEth);
    } catch (error) {
      console.error("Error fetching balance: ", error);
    }
  };

  // Handle MetaMask connection request
  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      handleAccountsChanged(accounts);
    } catch (error) {
      if (error.code === 4001) {
        console.log("User rejected the connection request.");
      } else {
        console.error(error);
      }
    }
  };

  return (
    <div className="App">
      <h1>Wallet Injection</h1>
      
      <div>
        {isConnected ? (
          <>
            <p>Connected Account: {account}</p>
            <p>Network Chain ID: {chainId}</p>
            <p>Account Balance: {balance ? `${balance} ETH` : "Fetching balance..."}</p>
            <input value={address} onChange={(e) => setAddress(e.target.value)}/>
            <button onClick={() => fetchBalance(address)}>Fetch Balance</button>
          </>
        ) : (
          <p>Please connect your MetaMask wallet.</p>
        )}
      </div>
      
      <button onClick={connectWallet}>
        {isConnected ? "Wallet Connected" : "Connect Wallet"}
      </button>
    </div>
  );
};

export default App;
