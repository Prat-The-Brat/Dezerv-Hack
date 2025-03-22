import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import "./grp_dash.css";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
 
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastTrades, setLastTrades] = useState([]);
  const {group_name} = useParams();

  // Define a more extensive color palette for user lines
  const colorPalette = [
    "#0088FE", // Blue
    "#00C49F", // Teal
    "#FFBB28", // Yellow
    "#FF8042", // Orange
    "#A020F0", // Purple
    "#FF1493", // Deep Pink
    "#32CD32", // Lime Green
    "#1E90FF", // Dodger Blue
    "#8B4513", // Saddle Brown
    "#FF6347"  // Tomato
  ];

  const transformTradesData = (trades) => {
    if (!Array.isArray(trades)) return [];
    
    let tradeMap = {};

    // Organize trades by timestamp
    trades.forEach((trade) => {
      const formattedTime = new Date(trade.timestamp).toLocaleString();
      
      if (!tradeMap[formattedTime]) {
        tradeMap[formattedTime] = { date: formattedTime };
      }

      tradeMap[formattedTime][trade.user] = trade.total_price;
    });

    // Convert to array & sort by time
    return Object.values(tradeMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-5);
  };
  
  // Example usage:
  const investmentData = transformTradesData(lastTrades);
  
  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/game/leaderboard/${group_name}`);
      setLeaderboard(response.data);
      transformTradesData(response.data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  const getLast5Trades = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/game/last_5_trades/${group_name}`);
      setLastTrades(response.data);
      console.log(response.data);
    }
    catch(err) {
      console.error("Error fetching last 5 trades:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLeaderboardData();  // Fetch leaderboard
      await getLast5Trades();  // Fetch last 5 trades
    };
    fetchData();
  }, [group_name]);

  // Leaderboard Data (Sorted by Profit)
  const leaderboardData = leaderboard
    .slice() // Create a shallow copy to avoid mutating state
    .sort((a, b) => b.total_value - a.total_value);
  
  const COLORS = ["#0088FE", "#FFBB28"]; // Blue for main, yellow for remaining

  const totalPortfolioValue = leaderboardData.reduce((sum, user) => sum + user.portfolio_value, 0);
  const totalAssetValue = leaderboardData.reduce((sum, user) => sum + user.asset_value, 0);

  // Portfolio Share Data (Each user's percentage of total portfolio)
  const portfolioShareData = leaderboardData.map((user, index) => ({
    name: user.user,
    value: (user.portfolio_value / totalPortfolioValue) * 100, // Percentage
    fill: COLORS[index % COLORS.length],
  }));

  // Asset Share Data (Each user's percentage of total asset value)
  const assetShareData = leaderboardData.map((user, index) => ({
    name: user.user,
    value: (user.asset_value / totalAssetValue) * 100, // Percentage
    fill: COLORS[index % COLORS.length],
  }));
  
  // Generate a user-to-color mapping for consistent colors across the app
  const generateUserColorMap = () => {
    if (!Array.isArray(lastTrades)) return {};
    
    const uniqueUsers = lastTrades
      .map(trade => trade.user)
      .filter((v, i, a) => a.indexOf(v) === i); // Get unique users
    
    const userColorMap = {};
    uniqueUsers.forEach((user, index) => {
      userColorMap[user] = colorPalette[index % colorPalette.length];
    });
    
    return userColorMap;
  };

  // User-to-color mapping for investment graph
  const userColors = generateUserColorMap();

  // Chatroom State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, id: messages.length }]);
      setNewMessage("");
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Dashboard</h2>
        <ul>
          <li>Home</li>
          <li>Analytics</li>
          <li>Settings</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="welcome-message">Welcome to the Group Dashboard</h1>

        {/* Charts Container */}
        <div className="charts-container">
          {/* Portfolio Share Pie Chart */}
          <div className="chart">
            <h3>Remaining Capital</h3>
            <PieChart width={300} height={300}>
              <Pie data={portfolioShareData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                {portfolioShareData.map((entry, index) => (
                  <Cell key={`portfolio-cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Legend />
            </PieChart>
          </div>

          {/* Asset Share Pie Chart */}
          <div className="chart">
            <h3>Investment Share</h3>
            <PieChart width={300} height={300}>
              <Pie data={assetShareData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                {assetShareData.map((entry, index) => (
                  <Cell key={`asset-cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Legend />
            </PieChart>
          </div>
        </div>

        {/* Investment Movement Graph (Below Pie Charts) */}
        <div className="graph-container">
          <h3>Investment Movement (Last 5 Trades)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={investmentData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.isArray(lastTrades) && lastTrades
                .map(trade => trade.user)
                .filter((v, i, a) => a.indexOf(v) === i) // Get unique users
                .map((user, index) => (
                  <Line 
                    key={user} 
                    type="monotone" 
                    dataKey={user} 
                    stroke={userColors[user] || colorPalette[index % colorPalette.length]} 
                    strokeWidth={2} 
                    dot={{ r: 5 }} 
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right Section (Leaderboard + Chat) */}
      <div className="right-section">
        {/* Leaderboard */}
        <div className="leaderboard-container">
          <h3>Leaderboard</h3>
          <ul className="leaderboard-list">
            {leaderboardData.map((entry, index) => (
              <li key={index} className="leaderboard-item">
                <div className="leaderboard-rank">#{index + 1}</div>
                <div className="leaderboard-info">
                  <span className="leaderboard-name">{entry.user}</span>
                  <span className="leaderboard-trade">Portfolio Value: {entry.total_value}</span>
                </div>
                <span className="profit-badge">${entry.profit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Chatroom (Below Leaderboard) */}
        <div className="chatroom-container">
          <h3>Chatroom</h3>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className="chat-message">{msg.text}</div>
            ))}
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="chat-send" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;