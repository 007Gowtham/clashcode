'use client';

import { Check, X, User, Clock, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';

export default function RequestManagement({
    pendingRequests = [],
    onAssignQuestion,
    onRejectQuestion
}) {
    return (
        <div className="h-full flex flex-col bg-gray-50/50">
            <div className="p-4 border-b border-gray-100 bg-white shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pending Approvals
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold ml-auto">
                        {pendingRequests.length}
                    </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Approve or deny question access for your teammates.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                {pendingRequests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-bold mb-1">All Clear!</h4>
                        <p className="text-xs text-gray-500 max-w-[200px]">
                            No pending requests at the moment. Your team is busy coding.
                        </p>
                    </div>
                ) : (
                    pendingRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {request.requesterName || 'Teammate'}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Just now
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Requested Question</p>
                                <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                                    {request.questionTitle || `Question ID: ${request.questionId}`}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onAssignQuestion(request.questionId, request.requesterId, request.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm active:scale-95"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => onRejectQuestion(request.questionId, request.requesterId, request.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm active:scale-95"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Deny
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
