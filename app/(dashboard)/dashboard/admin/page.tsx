'use client';

import React, { useState } from 'react';

// Mock Data
const USERS = [
    { id: 1, name: 'Jane Doe', email: 'jane.doe@disco.com', role: 'Lead Analyst', status: 'Active', lastActive: '2 mins ago', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsOiwo6ttCVZuKeyZ-xkOBmNE9b2oeGb8W2q8Q4Ze2_8L7UzrtFY7u0JTbPeM_4eOh5fT49oCpaBnmUMK4UDCT9HonmEHpFt0kmMdWMIOo7Ltiii_7zEYGwaqZFWyky0958cKSKxKhy0jU1hK0RjKSzDRIz0uQdi6jo81ZEmrdDGBXR8Dujt2CIqxaRcHdb-p1-XerVFZgQcWOY4BUvTP9Zc1RxXWEb6tXs3X8BAlNOh5kuLfItZkWu0RVzSa0ys5h6wgKcMiPHVQ' },
    { id: 2, name: 'John Smith', email: 'john.smith@disco.com', role: 'Field Ops Lead', status: 'Active', lastActive: '1 hour ago', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
    { id: 3, name: 'Sarah Connor', email: 's.connor@disco.com', role: 'Admin', status: 'Inactive', lastActive: '3 days ago', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { id: 4, name: 'Mike Ross', email: 'm.ross@disco.com', role: 'Analyst', status: 'Active', lastActive: '5 mins ago', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
];

const AUDIT_LOGS = [
    { id: 1, action: 'User Login', user: 'Jane Doe', time: '10:42 AM', details: 'Successful login from IP 192.168.1.4' },
    { id: 2, action: 'Report Generated', user: 'System', time: '09:00 AM', details: 'Monthly Revenue Report generated automatically' },
    { id: 3, action: 'Settings Changed', user: 'Sarah Connor', time: 'Yesterday', details: 'Updated theft detection threshold to 85%' },
];

const Admin: React.FC = () => {
    const [users, setUsers] = useState(USERS);
    const [showUserModal, setShowUserModal] = useState(false);
    
    // New User State
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Analyst' });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        const user = {
            id: users.length + 1,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: 'Active',
            lastActive: 'Just now',
            avatar: `https://i.pravatar.cc/150?u=${Math.random()}`
        };
        setUsers([...users, user]);
        setShowUserModal(false);
        setNewUser({ name: '', email: '', role: 'Analyst' });
    };

    const handleDeleteUser = (id: number) => {
        if(confirm('Delete user?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background-light dark:bg-background-dark">
             <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
                    <p className="text-text-muted text-sm mt-1">Manage users, system health, and audit logs.</p>
                </div>

                {/* System Health Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <HealthCard title="System Status" value="Healthy" status="good" icon="check_circle" detail="All systems operational" />
                    <HealthCard title="API Latency" value="45ms" status="good" icon="speed" detail="Avg response time" />
                    <HealthCard title="Database Storage" value="85%" status="warning" icon="database" detail="1.2TB / 1.5TB Used" />
                </div>

                {/* User Management */}
                <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl shadow-sm flex flex-col">
                    <div className="p-5 border-b border-border-dark flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Management</h3>
                        <button 
                            onClick={() => setShowUserModal(true)}
                            className="bg-primary hover:bg-primary-hover text-black font-bold py-2 px-3 rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">person_add</span> Add User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-black/20 text-xs text-text-muted uppercase">
                                <tr>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Last Active</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-border-dark" />
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-text-muted">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-400">{user.role}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                user.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{user.lastActive}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl shadow-sm p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Audit Logs</h3>
                    <div className="space-y-4">
                        {AUDIT_LOGS.map(log => (
                            <div key={log.id} className="flex gap-4 items-start p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-border-dark">
                                <div className="p-2 rounded bg-surface-active text-text-muted">
                                    <span className="material-symbols-outlined text-lg">history</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{log.action} <span className="text-text-muted font-normal">by {log.user}</span></p>
                                    <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                                </div>
                                <div className="ml-auto text-xs text-gray-500 whitespace-nowrap">{log.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             {/* Add User Modal */}
             {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1c271f] w-full max-w-md rounded-2xl border border-border-dark p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Add New User</h3>
                        <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                            <input 
                                className="bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-white" 
                                placeholder="Full Name" 
                                value={newUser.name}
                                onChange={e => setNewUser({...newUser, name: e.target.value})}
                                required
                            />
                             <input 
                                className="bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-white" 
                                placeholder="Email Address" 
                                type="email"
                                value={newUser.email}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                                required
                            />
                            <select 
                                className="bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-white"
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value})}
                            >
                                <option value="Analyst">Analyst</option>
                                <option value="Field Ops">Field Ops</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2 rounded bg-surface-active text-white">Cancel</button>
                                <button type="submit" className="flex-1 py-2 rounded bg-primary text-black font-bold">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
             )}
        </div>
    );
};

const HealthCard = ({ title, value, status, icon, detail }: any) => {
    const colors = status === 'good' ? 'text-primary' : status === 'warning' ? 'text-orange-500' : 'text-red-500';
    return (
        <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-surface-active ${colors}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-xs text-text-muted uppercase font-bold">{title}</p>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className={`text-xs ${colors}`}>{detail}</p>
            </div>
        </div>
    );
};

export default Admin;
