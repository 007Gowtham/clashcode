'use client';

import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Globe, Lock, X } from 'lucide-react';
import { useState } from 'react';

const ROLES = [
    { id: 'architect', label: 'Architect', icon: '📐' },
    { id: 'builder', label: 'Builder', icon: '🛠️' },
    { id: 'debugger', label: 'Debugger', icon: '🐛' },
    { id: 'optimiser', label: 'Optimiser', icon: '⚡' },
];

export default function JoinTeamModal({
    isOpen,
    onClose,
    selectedTeam,
    onJoin,
    isLoading
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !selectedTeam) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (selectedTeam.visibility === 'PRIVATE' && !code.trim()) {
            setError('Team code is required for private teams');
            return;
        }

        try {
            await onJoin(selectedTeam.id, code || undefined);
            setCode('');
            setError('');
        } catch (err) {
            console.error('Join team error:', err);
        }
    };

    const handleClose = () => {
        setCode('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between font-[family-name:var(--font-mono)]">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Join Team</h2>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 font-[family-name:var(--font-inter)]">
                    {/* Team Info Card - Restored Original Style */}
                    <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wide">
                            You're joining:
                        </p>
                        <p className="text-lg font-bold text-gray-900 mb-2">{selectedTeam.name}</p>

                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                {selectedTeam.visibility === 'PRIVATE' ? (
                                    <>
                                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                                        <span className="text-amber-700 font-semibold">Private Team</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700 font-semibold">Public Team</span>
                                    </>
                                )}
                            </div>
                            <div className="text-gray-500">
                                {selectedTeam.members?.length || 0} / {selectedTeam.maxSize || 4} members
                            </div>
                        </div>

                        {selectedTeam.visibility === 'PRIVATE' && (
                            <div className="mt-3 p-2 bg-amber-100/50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-800 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Team code required - ask the team leader
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Role Selection removed as requested */}

                    {/* Code Input */}
                    <div className="mb-5">
                        <Input
                            label={selectedTeam.visibility === 'PRIVATE' ? 'Team Code (Required)' : 'Team Code (Optional)'}
                            placeholder={selectedTeam.visibility === 'PRIVATE' ? 'Enter the team code' : 'Enter code if provided'}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            required={selectedTeam.visibility === 'PRIVATE'}
                            disabled={isLoading}
                            className="font-mono"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Join Team
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
