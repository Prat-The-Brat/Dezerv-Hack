import React, { useState, useEffect } from "react";
import "./trade.css";
import { useNavigate } from "react-router-dom";
import StockChart from "./StockChart";
import axios from "axios";

const Trade = () => {
    const navigate = useNavigate();
    const [selectedStock, setSelectedStock] = useState("");
    const [selectedFund, setSelectedFund] = useState("");
    const [investmentAmount, setInvestmentAmount] = useState("");
    const [buyStatus, setBuyStatus] = useState({ message: "", type: "" });
    const [selectedGroup, setSelectedGroup] = useState("");
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStocks, setUserStocks] = useState([]);

    const stocks = [
        "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK.B", "UNH", "JNJ",
        "XOM", "JPM", "V", "PG", "AVGO", "HD", "MA", "LLY", "CVX", "ABBV",
        "MRK", "PEP", "KO", "COST", "WMT", "MCD", "NFLX", "ADBE", "AMD", "INTC"
    ];

    const mutualFunds = ["Nifty50", "Sensex", "S&P 500", "NiftyBank", "Nasdaq composite"];

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    setBuyStatus({ 
                        message: "User not logged in", 
                        type: "error" 
                    });
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`http://127.0.0.1:8000/game/get_groups/${userId}/`);
                setGroups(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching groups:', error);
                setBuyStatus({ 
                    message: "Failed to load groups. Please try again.", 
                    type: "error" 
                });
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    useEffect(() => {
        const fetchUserStocks = async () => {
            if (!selectedGroup || !selectedStock) return;
            
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) return;

                const response = await axios.get(`http://127.0.0.1:8000/api/stocks/portfolio/?user_id=${userId}&group_id=${selectedGroup}`);
                setUserStocks(response.data);
            } catch (error) {
                console.error('Error fetching user stocks:', error);
            }
        };

        fetchUserStocks();
    }, [selectedGroup, selectedStock]);

    const handleBuy = async () => {
        if (!selectedStock || !investmentAmount || !selectedGroup) {
            setBuyStatus({ 
                message: "Please select a stock, enter an amount, and choose a group", 
                type: "error" 
            });
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setBuyStatus({ 
                    message: "User not logged in", 
                    type: "error" 
                });
                return;
            }

            const response = await axios.post('http://127.0.0.1:8000/api/stocks/buy/', {
                ticker: selectedStock,
                quantity: parseInt(investmentAmount),
                user_id: userId,
                group_id: selectedGroup,
                timestamp: Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
            });

            setBuyStatus({ message: "Stock purchased successfully!", type: "success" });
            setInvestmentAmount(""); // Clear the input after successful purchase
        } catch (error) {
            setBuyStatus({ 
                message: error.response?.data?.error || "Failed to purchase stock", 
                type: "error" 
            });
        }
    };

    const handleSell = async () => {
        if (!selectedStock || !investmentAmount || !selectedGroup) {
            setBuyStatus({ 
                message: "Please select a stock, enter an amount, and choose a group", 
                type: "error" 
            });
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setBuyStatus({ 
                    message: "User not logged in", 
                    type: "error" 
                });
                return;
            }

            // Check if user has enough stocks to sell
            const stockHolding = userStocks.find(stock => stock.ticker === selectedStock);
            if (!stockHolding || stockHolding.quantity < parseInt(investmentAmount)) {
                setBuyStatus({ 
                    message: `Insufficient stocks. You have ${stockHolding ? stockHolding.quantity : 0} stocks of ${selectedStock}`, 
                    type: "error" 
                });
                return;
            }

            const response = await axios.post('http://127.0.0.1:8000/api/stocks/sell/', {
                ticker: selectedStock,
                quantity: parseInt(investmentAmount),
                user_id: userId,
                group_id: selectedGroup,
                timestamp: Math.floor(Date.now() / 1000)
            });

            setBuyStatus({ message: "Stock sold successfully!", type: "success" });
            setInvestmentAmount(""); // Clear the input after successful sale
            
            // Refresh user stocks
            const stocksResponse = await axios.get(`http://127.0.0.1:8000/api/stocks/portfolio/?user_id=${userId}&group_id=${selectedGroup}`);
            setUserStocks(stocksResponse.data);
        } catch (error) {
            setBuyStatus({ 
                message: error.response?.data?.error || "Failed to sell stock", 
                type: "error" 
            });
        }
    };

    return (
        <div className="invest-container">
            <div className="sidebar">
                <h2>SmartInvest</h2>
                <ul>
                    <li>Home</li>
                    <li>Portfolio</li>
                    <li>Trade</li>
                    <li>Settings</li>
                </ul>
            </div>

            <div className="main-content">
                <h1>Where I'll Invest</h1>

                <div className="invest-options">
                    <div className="option">
                        <h2>Stocks</h2>
                        <select
                            className="dropdown"
                            value={selectedStock}
                            onChange={(e) => setSelectedStock(e.target.value)}
                        >
                            <option value="" disabled>Select a Stock</option>
                            {stocks.map((stock, index) => (
                                <option key={index} value={stock}>{stock}</option>
                            ))}
                        </select>
                        {selectedStock && (
                            <p className="selected-value">Selected: {selectedStock}</p>
                        )}
                    </div>

                    <div className="option">
                        <h2>Select Group</h2>
                        <select
                            className="dropdown"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            disabled={loading}
                        >
                            <option value="" disabled>Select a Group</option>
                            {groups.map((group) => (
                                <option key={group.group_id} value={group.group_id}>
                                    {group.group_name} (Balance: ₹{group.current_balance.toLocaleString()})
                                </option>
                            ))}
                        </select>
                        {selectedGroup && (
                            <p className="selected-value">
                                Selected: {groups.find(g => g.group_id === selectedGroup)?.group_name}
                            </p>
                        )}
                        {loading && <p className="loading-text">Loading groups...</p>}
                    </div>
                </div>

                {selectedStock && (
                    <div className="chart-section">
                        <StockChart symbol={selectedStock} />
                    </div>
                )}

                <div className="investment-container">
                    <label>Amount:</label>
                    <input
                        type="number"
                        className="amount-box"
                        placeholder="Enter Amount"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                    />
                    <div className="button-container">
                        <button 
                            className="buy-button"
                            onClick={handleBuy}
                            disabled={!selectedStock || !investmentAmount || !selectedGroup}
                        >
                            Buy
                        </button>
                        <button 
                            className="sell-button"
                            onClick={handleSell}
                            disabled={!selectedStock || !investmentAmount || !selectedGroup}
                        >
                            Sell
                        </button>
                    </div>
                </div>

                {selectedStock && (
                    <div className="stock-info">
                        <p>Current Holdings: {userStocks.find(stock => stock.ticker === selectedStock)?.quantity || 0} shares</p>
                    </div>
                )}

                {buyStatus.message && (
                    <div className={`status-message ${buyStatus.type}`}>
                        {buyStatus.message}
                    </div>
                )}

                <button className="back-button" onClick={() => navigate("/grp_dash")}>Back</button>
            </div>
        </div>
    );
};

export default Trade;
