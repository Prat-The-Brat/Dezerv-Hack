import React, { useState } from "react";
import "./trade.css";
import { useNavigate } from "react-router-dom";
import StockChart from "./StockChart";

const Trade = () => {
    const navigate = useNavigate();
    const [selectedStock, setSelectedStock] = useState("");
    const [selectedFund, setSelectedFund] = useState("");
    const [investmentAmount, setInvestmentAmount] = useState("");

    const stocks = [
        "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK.B", "UNH", "JNJ",
        "XOM", "JPM", "V", "PG", "AVGO", "HD", "MA", "LLY", "CVX", "ABBV",
        "MRK", "PEP", "KO", "COST", "WMT", "MCD", "NFLX", "ADBE", "AMD", "INTC"
    ];

    const mutualFunds = ["Nifty50", "Sensex", "S&P 500", "NiftyBank", "Nasdaq composite"];

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
                        <h2>Mutual Funds</h2>
                        <select
                            className="dropdown"
                            value={selectedFund}
                            onChange={(e) => setSelectedFund(e.target.value)}
                        >
                            <option value="" disabled>Select a Mutual Fund</option>
                            {mutualFunds.map((fund, index) => (
                                <option key={index} value={fund}>{fund}</option>
                            ))}
                        </select>
                        {selectedFund && (
                            <p className="selected-value">Selected: {selectedFund}</p>
                        )}
                    </div>
                </div>

                {selectedStock && (
                    <div className="chart-section">
                        <StockChart symbol={selectedStock} />
                    </div>
                )}

                <div className="investment-container">
                    <label>Invest:</label>
                    <input
                        type="number"
                        className="amount-box"
                        placeholder="Enter Amount"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                    />
                </div>

                <button className="back-button" onClick={() => navigate("/grp_dash")}>Back</button>
            </div>
        </div>
    );
};

export default Trade;
