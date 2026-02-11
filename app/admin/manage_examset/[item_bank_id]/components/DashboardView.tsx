'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    Users,
    FileText,
    BarChart2,
    CheckCircle,
    Clock,
    Calendar,
    Settings,
    PlusCircle,
    PlayCircle,
    ChevronRight,
    Home
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    item_bank: {
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
        duration: number;
        is_active: boolean;
    };
    stats: {
        total_items: number;
        total_attempts: number;
        completed_attempts: number;
        average_score: number;
        max_score: number;
        min_score: number;
        pass_rate: number;
    };
    charts: {
        score_distribution: {
            range: string;
            count: number;
        }[];
    };
    recent_activity: {
        session_id: number;
        user_id: number;
        start_time: string;
        end_time: string | null;
        score: number;
        status: string;
    }[];
}

interface DashboardViewProps {
    itemBankId: string;
    onManageExams: () => void;
}

const API_URL = 'http://localhost:5000';

export default function DashboardView({ itemBankId, onManageExams }: DashboardViewProps) {
    const { getToken } = useAuth();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, [itemBankId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                throw new Error('Failed to fetch dashboard data');
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        // Implement status toggle functionality here if needed
        // For now, it's a visual toggle in the UI as per design request
        if (!data) return;

        // Optimistic update
        const newData = { ...data };
        newData.item_bank.is_active = !newData.item_bank.is_active;
        setData(newData);

        try {
            const token = getToken();
            await fetch(`${API_URL}/items-bank/${itemBankId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: newData.item_bank.is_active })
            });
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setData(data);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading Dashboard...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <CheckCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Unavailable Data</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { item_bank, stats, charts, recent_activity } = data;

    // Transform chart data for better visualization (reverse order if needed for vertical layout)
    // The design shows horizontal bars. Recharts handles this with layout="vertical".
    // We might want to sort by range or keep as is.

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 bg-gray-50/50 min-h-screen">
           

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Dashboard: <span className="text-gray-700 font-normal">{item_bank.name}</span>
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onManageExams}
                        className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all font-medium flex items-center gap-2"
                    >
                        Manage Exam Questions
                    </button>
                    <button className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-green-700 hover:border-green-200 shadow-sm transition-all">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatsCard
                    title="Total questions in bank"
                    value={stats.total_items.toLocaleString()}
                    icon={<FileText className="w-8 h-8 text-green-600" />}
                />
                <StatsCard
                    title="Times exam taken"
                    value={stats.total_attempts.toLocaleString()}
                    icon={<Users className="w-8 h-8 text-green-600" />}
                />
                <StatsCard
                    title="Overall average"
                    value={`${stats.average_score}%`}
                    icon={<BarChart2 className="w-8 h-8 text-green-600" />}
                />
                <StatsCard
                    title="Based on 60% threshold"
                    value={`${stats.pass_rate}%`}
                    icon={<CheckCircle className="w-8 h-8 text-green-600" />}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Score Distribution Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Score Distribution</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={charts.score_distribution}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="range"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                        tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                                        {charts.score_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#15803d" /> /* green-700 */
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-3 font-semibold text-gray-600 text-sm">User</th>
                                        <th className="py-3 font-semibold text-gray-600 text-sm">Date</th>
                                        <th className="py-3 font-semibold text-gray-600 text-sm">Score</th>
                                        <th className="py-3 font-semibold text-gray-600 text-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recent_activity.length > 0 ? (
                                        recent_activity.map((session) => (
                                            <tr key={session.session_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 text-sm font-medium text-gray-900">
                                                    User: #{session.user_id}
                                                </td>
                                                <td className="py-4 text-sm text-gray-500">
                                                    {new Date(session.start_time).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-4 text-sm font-medium text-gray-900">
                                                    {session.status === 'COMPLETED' ? `${session.score}%` : '-'}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${session.status === 'COMPLETED'
                                                        ? (session.score >= 60
                                                            ? 'bg-green-100 text-green-700' // Passed
                                                            : 'bg-red-100 text-red-700')    // Failed
                                                        : 'bg-yellow-100 text-yellow-700' // In Progress
                                                        }`}>
                                                        {session.status === 'COMPLETED'
                                                            ? (session.score >= 60 ? 'Passed' : 'Failed')
                                                            : 'In Progress'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                                                No recent activity data available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Item Bank Details Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Item Bank Details</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Created date</span>
                                <span className="text-gray-900">
                                    {new Date(item_bank.created_at).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Last updated</span>
                                <span className="text-gray-900">
                                    {item_bank.updated_at ? new Date(item_bank.updated_at).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    }) : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Duration</span>
                                <span className="text-gray-900">
                                    {Math.floor(item_bank.duration / 60)} mins
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50 mt-2">
                                <span className="text-gray-600 font-medium">Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${item_bank.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                        {item_bank.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${item_bank.is_active ? 'bg-green-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${item_bank.is_active ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                            <button
                                onClick={onManageExams}
                                className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-700 font-medium transition-colors group"
                            >
                                <PlusCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                Add Situation
                            </button>
                            <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-700 font-medium transition-colors group">
                                <PlayCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                Preview Exam
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, subtext }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="mb-3 p-3 bg-green-50 rounded-full border border-green-100">
                {icon}
            </div>
            <h4 className="text-3xl font-bold text-green-700 mb-1">{value}</h4>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    );
}
