'use client';

import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Hash, X } from 'lucide-react';
import { useState } from 'react';

export default function JoinViaCodeModal({
 isOpen,
 onClose,
 onJoin,
 isLoading
}) {
 const [teamCode, setTeamCode] = useState('');

 const [error, setError] = useState('');

 // 5-6 DSA-themed roles


 if (!isOpen) return null;

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');

 if (!teamCode.trim()) {
 setError('Team code is required');
 return;
 }



 try {
 await onJoin({ teamCode: teamCode.trim() });
 // Reset form
 setTeamCode('');
 setError('');
 } catch (err) {
 console.error('Join via code error:', err);
 }
 };

 const handleClose = () => {
 setTeamCode('');
 setError('');
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
 {/* Header */}
 <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between ">
 <h2 className="text-xl font-bold tracking-tight text-slate-900">Join via Code</h2>
 <button
 onClick={handleClose}
 disabled={isLoading}
 className="text-gray-400 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors disabled:opacity-50"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <form onSubmit={handleSubmit} className="p-6">
 {/* Info Card */}
 <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
 <div className="flex items-center gap-2 mb-2">
 <Hash className="w-4 h-4 text-blue-600" />
 <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
 Join with Code
 </p>
 </div>
 <p className="text-sm text-gray-700">
 Enter the team code provided by the team leader to join
 </p>
 </div>

 {/* Team Code Input */}
 <div className="mb-5">
 <Input
 label="Team Code"
 placeholder="Enter team code"
 value={teamCode}
 onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
 required
 disabled={isLoading}
 helperText="Get this code from the team leader"
 className="font-mono"
 maxLength={10}
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
