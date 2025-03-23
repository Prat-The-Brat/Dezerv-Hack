import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./personal_dash.css"; // Custom styles for this dashboard

const PersonalDash = () => {
  const [user, setUser] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('User not logged in');
          setLoading(false);
          return;
        }

        // Fetch user details
        const userResponse = await axios.get(`http://127.0.0.1:8000/api/stocks/get_user/${userId}/`);
        
        // Fetch user's groups
        const groupsResponse = await axios.get(`http://127.0.0.1:8000/game/get_groups/${userId}/`);
        setGroups(groupsResponse.data);
        
        // Set the first group as selected if available
        if (groupsResponse.data.length > 0) {
          setSelectedGroup(groupsResponse.data[0].group_id);
        }

        setUser({
          name: userResponse.data.name,
          profilePic: userResponse.data.profile_pic || "/images/9826392ab976924ab28347a2274961e1.jpg",
          organization: "BITS Pilani",
          currentInvestment: userResponse.data.current_investment || 0
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!selectedGroup) return;

      try {
        const userId = localStorage.getItem('userId');
        const investmentsResponse = await axios.get(`http://127.0.0.1:8000/api/stocks/portfolio/?user_id=${userId}&group_id=${selectedGroup}`);
        setInvestments(investmentsResponse.data.map(inv => ({
          name: inv.ticker,
          value: inv.quantity * inv.current_price,
          change: `${((inv.current_price - inv.purchase_price) / inv.purchase_price * 100).toFixed(2)}%`
        })));
      } catch (err) {
        console.error('Error fetching investments:', err);
        setError('Failed to load investments');
      }
    };

    fetchInvestments();
  }, [selectedGroup]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedGroup) return;

      try {
        const userId = localStorage.getItem('userId');
        const response = await axios.get(`http://127.0.0.1:8000/api/stocks/get_user_transactions/${userId}/${selectedGroup}/`);
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [selectedGroup]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-message">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Personal Dashboard</h2>
        <ul>
          <li><Link to="/grp_total_dash" className="sidebar-nav-item">Your Groups</Link></li>
          <li><Link to="/trade" className="sidebar-nav-item">Trade</Link></li>
          {/* <li className="sidebar-nav-item">Investments</li> */}
        </ul>
        {/* <div className="sidebar-button-container">
          <Link to="/grp_total_dash">
            <button className="dashboard-button">Group Dashboard</button>
          </Link>
        </div> */}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* User Details Section */}
        <div className="user-details">
          <img src={user.profilePic} alt="Profile" className="profile-pic" />
          <div className="user-info">
            <h2>{user.name}</h2>
            <p>Organization: {user.organization}</p>
            <p className="investment-amount">Current Investment: ₹{user.currentInvestment.toLocaleString()}</p>
          </div>
        </div>

        {/* Group Selection */}
        {groups.length > 0 && (
          <div className="group-selection">
            <select 
              value={selectedGroup || ''} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="group-select"
            >
              {groups.map(group => (
                <option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scrollable Investment Table */}
        {/* <div className="investment-table-container">
          <h3 className="investment-table-container-text">Your Investments</h3>
          <table className="investment-table">
            <thead>
              <tr>
                <th>Investment</th>
                <th>Value (₹)</th>
                <th>% Change</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv, index) => (
                <tr key={index}>
                  <td>{inv.name}</td>
                  <td>₹{inv.value.toLocaleString()}</td>
                  <td className={inv.change.includes("-") ? "negative" : "positive"}>{inv.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}

        {/* Transaction History Section */}
        <div className="transaction-history">
          <h2>Transaction History</h2>
          <div className="transaction-table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Stock</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className={transaction.action === 'buy' ? 'buy-row' : 'sell-row'}>
                    <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                    <td className={transaction.action === 'buy' ? 'buy-action' : 'sell-action'}>
                      {transaction.action.toUpperCase()}
                    </td>
                    <td>{transaction.ticker}</td>
                    <td>{transaction.quantity}</td>
                    <td>₹{parseFloat(transaction.price).toLocaleString()}</td>
                    <td>₹{parseFloat(transaction.total_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDash;
