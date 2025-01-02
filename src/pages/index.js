import {useEffect, useState} from "react";
import {ethers} from "ethers";
import BuyMeACoffeeABI from '../constants/BuyMeACoffee.json';
import styles from "../styles/App.module.css";
import Popup from "./Popup";

export default function Home() {

    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [amount, setAmount] = useState("");
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [memos, setMemos] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const connectWallet = async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            console.error("MetaMask not detected");
            showMessage("MetaMask is not installed. Please install it to use this feature.");
            return;
        }

        try {
            const accounts = await window.ethereum.request({method: "eth_requestAccounts"});
            if (accounts && accounts.length > 0) {
                console.log("Wallet connected:", accounts[0]);
                setIsWalletConnected(true);
            } else {
                console.warn("No accounts found");
                showMessage("No accounts found. Please try again.");
            }
        } catch (error) {
            if (error.code === 4001) {
                console.warn("User rejected the connection request");
                showMessage("Connection request rejected by the user.");
            } else {
                console.error("Error connecting to wallet:", error);
                showMessage("An error occurred while connecting to the wallet. Please try again.");
            }
        }
    };

    const buyCoffee = async () => {
        setIsLoading(true);
        if (!isWalletConnected) {
            await connectWallet();
        }
        if (!name || !message || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
            showMessage("Please enter valid values");
            setIsLoading(false);
            return;
        }

        try {
            const contract = await getContract();
            if (contract) {
                const tx = await contract.BuyACoffee(name, message, {value: ethers.parseEther(amount)});
                await tx.wait();
                console.log('Coffee purchased!');
                setIsLoading(false);
                showMessage("Successfully bought coffee!!");
            }
        } catch (error) {
            console.error('Error purchasing coffee:', error);
            setIsLoading(false);
        }
    }

    const sendMoneyToOwner = async () => {
        try {
            const contract = await getContract();
            const tx = await contract.withdrawTips();
            await tx.wait();
            showMessage('Funds sent to owner!');
        } catch (error) {
            console.error('Error sending funds to owner :', error);
        }
    }

    const getContract = async () => {
        if (!window.ethereum) {
            console.error("Ethereum object not found, install MetaMask.");
            return;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractAddress = "0xD6c45474873fC6f8eD29307F261A6514346Eb615";
        return new ethers.Contract(contractAddress, BuyMeACoffeeABI.abi, signer);
    }

    const fetchMemos = async () => {
        try {
            const contract = await getContract();
            if (contract) {
                const memos = await contract.getMemos();
                setMemos(memos.map(memo => ({
                    from: memo.from,
                    timestamp: new Date(Number(memo.timestamp) * 1000).toLocaleString(),
                    name: memo.name,
                    message: memo.message
                })));
            }
        } catch (error) {
            console.error('Error fetching memos:', error);
        }
    };

    const setupEventListener = async () => {
        try {
            const contract = await getContract();
            if (contract) {
                await contract.on("NewMemo", (from, timestamp, name, message) => {
                    console.log("New Memo event received:", {from, timestamp, name, message});
                    setMemos(prevMemos => [
                        ...prevMemos,
                        {
                            from,
                            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
                            name,
                            message
                        }
                    ]);
                });

                console.log("Event listener set up!");
            }
        } catch (error) {
            console.error("Error setting up event listener:", error);
        }
    };

    const showMessage = (message) => {
        setPopupMessage(message);
        setShowPopup(true);
    }

    const closePopup = () => {
        setShowPopup(false); // This will hide the popup
    };

    useEffect(async () => {
        await connectWallet();
        await fetchMemos();
        setupEventListener(); // Set up the event listener
    }, []);

    return (
        <div className={styles.container}>
            <button className={styles.connectButton} onClick={connectWallet}>
                Connect Wallet
            </button>

            <div className={styles.content}>
                <div className={styles.form}>
                    {/* Image Placeholder */}
                    <div className={styles.imagePlaceholder}>
                        <img src="../images/coffee.jpg" alt=""/>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Message:</label>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Amount (ETH):</label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <button onClick={buyCoffee} className={styles.buyButton}>
                        {isLoading ? "Buying..." : "Buy Coffee"}
                    </button>
                </div>

                <div className={styles.memos}>
                    <h2>Memos</h2>
                    <div className={styles.chat}>
                        {memos.slice().reverse().map((memo, index) => (
                            <div key={index} className={styles.chatBubble}>
                                <strong>{memo.name}:</strong>
                                <p>{memo.message}</p>
                                <span>{memo.timestamp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={sendMoneyToOwner}
                className={styles.bottomButton}
            >
                Send Money from Contract to Owner Yourself !!
            </button>

            {showPopup && <Popup message={popupMessage} onClose={closePopup}/>}
        </div>
    );
}
