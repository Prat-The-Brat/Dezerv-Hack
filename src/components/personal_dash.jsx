import React from "react";
import { Link } from "react-router-dom";
import "./personal_dash.css"; // Custom styles for this dashboard

const PersonalDash = () => {
  // Dummy user details
  const user = {
    name: "Aarohi Verma",
    profilePic: "/src/assets/images/profile.jpg", // Replace with actual path
    organization: "BITS Pilani",
    currentInvestment: 152000, // Example amount in ₹
  };

  // Dummy investment data
  const investments = [
    { name: "Tesla", value: 30000, change: "+12.5%" },
    { name: "Apple", value: 25000, change: "+8.2%" },
    { name: "Google", value: 20000, change: "-5.3%" },
    { name: "Amazon", value: 18000, change: "+3.8%" },
    { name: "Microsoft", value: 16000, change: "-2.1%" },
    { name: "Netflix", value: 14000, change: "+6.7%" },
    { name: "Meta", value: 12000, change: "-4.8%" },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Personal Dashboard</h2>
        <ul>
          <li className="sidebar-nav-item">Overview</li>
          <li className="sidebar-nav-item">Transactions</li>
          <li className="sidebar-nav-item">Investments</li>
        </ul>
        <div className="sidebar-button-container">
          <Link to="/grp_total_dash">
            <button className="dashboard-button">Group Dashboard</button>
          </Link>
        </div>
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

        {/* Scrollable Investment Table */}
        <div className="investment-table-container">
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
                  <td className={inv.change.includes("+") ? "positive" : "negative"}>{inv.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PersonalDash;
