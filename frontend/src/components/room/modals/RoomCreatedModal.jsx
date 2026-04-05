'use client';

import { useState } from 'react';
import { Copy, Check, Link2, Key } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { toast } from 'react-hot-toast';

export default function RoomCreatedModal({ isOpen, onClose, room }) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    if (!room) return null;

    const inviteLink = `${window.location.origin}/room?code=${room.code}`;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(room.code);
            setCopiedCode(true);
            toast.success('Room code copied!');
            setTimeout(() => setCopiedCode(false), 2000);
        } catch (error) {
            toast.error('Failed to copy code');
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopiedLink(true);
            toast.success('Invite link copied!');
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const handleContinue = () => {
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🎉 Room Created Successfully!"
        >
            <div className="space-y-6">
                {/* Success Message */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {room.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                        Share the code or link below to invite participants
                    </p>
                </div>

                {/* Room Code */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Room Code
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg font-mono text-2xl font-bold text-center text-gray-900 tracking-wider">
                            {room.code}
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors flex items-center gap-2"
                            title="Copy code"
                        >
                            {copiedCode ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Invite Link */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        Invite Link
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-700 truncate">
                            {inviteLink}
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors flex items-center gap-2"
                            title="Copy link"
                        >
                            {copiedLink ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">
                        💡 <span className="font-semibold">Tip:</span> Participants can join using either the room code or the invite link. The code is easier to share verbally!
                    </p>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleContinue}
                    className="w-full"
                >
                    Continue to Waiting Room
                </Button>
            </div>
        </Modal>
    );
}
