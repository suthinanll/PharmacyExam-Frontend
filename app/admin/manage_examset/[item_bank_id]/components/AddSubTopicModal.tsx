import React from 'react';
import { X, Plus, Loader2 } from 'lucide-react';

interface Topic {
    topic_id: number;
    topic_name: string;
}

interface AddSubTopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    topics: Topic[];
    onAddSubTopic: () => void;
    isAdding: boolean;
    newSubTopicName: string;
    setNewSubTopicName: (value: string) => void;
    newSubTopicTopicId: number | '';
    setNewSubTopicTopicId: (value: number | '') => void;
}

export default function AddSubTopicModal({
    isOpen,
    onClose,
    topics,
    onAddSubTopic,
    isAdding,
    newSubTopicName,
    setNewSubTopicName,
    newSubTopicTopicId,
    setNewSubTopicTopicId
}: AddSubTopicModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium text-gray-900">เพิ่มหัวข้อย่อยใหม่</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            หัวข้อหลัก <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={newSubTopicTopicId}
                            onChange={(e) => setNewSubTopicTopicId(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                        >
                            <option value="">-- เลือกหัวข้อหลัก --</option>
                            {topics.map(topic => (
                                <option key={topic.topic_id} value={topic.topic_id}>
                                    {topic.topic_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            ชื่อหัวข้อย่อย <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newSubTopicName}
                            onChange={(e) => setNewSubTopicName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="กรอกชื่อหัวข้อย่อย"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onAddSubTopic();
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={onAddSubTopic}
                        disabled={isAdding}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                กำลังเพิ่ม...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                เพิ่ม
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
