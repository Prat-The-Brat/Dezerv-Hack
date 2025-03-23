import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './grp_total_dash.css';

const GrpTotalDash = () => {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [groupId, setGroupId] = useState('');
    const [groups, setGroups] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setErrorMessage('Please log in to view groups');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8000/game/get_groups/${userId}/`);
                if (!response.ok) throw new Error('Failed to fetch groups');
                const data = await response.json();
                console.log('Fetched groups:', data); // Debug log
                setGroups(data || []);
            } catch (err) {
                console.error('Error fetching groups:', err);
                setErrorMessage('Error loading groups: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setErrorMessage('Please enter a group name');
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setErrorMessage('Please log in to create a group');
                return;
            }

            const response = await axios.post('http://127.0.0.1:8000/game/create_group/', {
                group_name: groupName,
                user_id: userId
            });

            if (response.status === 201) {
                const newGroup = {
                    group_id: response.data.group_id,
                    group_name: groupName,
                    current_balance: 10000 // Default starting balance
                };
                setGroups(prevGroups => [...prevGroups, newGroup]);
                setGroupName('');
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Create group error:', error);
            setErrorMessage('Error creating group: ' + (error.response?.data?.error || 'Server error'));
        }
    };

    const handleJoinGroup = async () => {
        if (!groupId.trim()) {
            setErrorMessage('Please enter a group ID');
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setErrorMessage('Please log in to join a group');
                return;
            }

            const response = await axios.post('http://127.0.0.1:8000/game/join_group/', {
                group_id: groupId,
                user_id: userId
            });

            if (response.status === 200) {
                const newGroup = {
                    group_id: groupId,
                    group_name: response.data.group_name || `Group ${groupId}`,
                    current_balance: 10000 // Default starting balance
                };
                setGroups(prevGroups => [...prevGroups, newGroup]);
                setGroupId('');
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Join group error:', error);
            setErrorMessage('Error joining group: ' + (error.response?.data?.error || 'Server error'));
        }
    };

    const handleGroupClick = (group) => {
        navigate(`/grp_dash/${group.group_name}`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="groups-container">
            <aside className="sidebar">
                <h2>Your Groups</h2>
                <div className="groups-list">
                    {groups.length === 0 ? (
                        <p className="no-groups">No groups yet</p>
                    ) : (
                        <ul>
                            {groups.map((group) => (
                                <li key={`group-${group.group_id}`}>
                                    <button 
                                        className="group-button"
                                        onClick={() => handleGroupClick(group)}
                                    >
                                        {group.group_name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>

            <main className="main-content">
                <h1>Group Management</h1>

                {errorMessage && (
                    <div className="error-message">
                        {errorMessage}
                    </div>
                )}

                <div className="group-actions">
                    <div className="group-action create-group">
                        <h3>Create a New Group</h3>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                            <button onClick={handleCreateGroup}>Create Group</button>
                        </div>
                    </div>

                    <div className="group-action join-group">
                        <h3>Join a Group</h3>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter group ID"
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                            />
                            <button onClick={handleJoinGroup}>Join Group</button>
                        </div>
                    </div>
                </div>

                <button 
                    className="back-buttonp"
                    onClick={() => navigate('/personal_dash')}
                >
                    Personal Dashboard
                </button>
            </main>
        </div>
    );
};

export default GrpTotalDash;
