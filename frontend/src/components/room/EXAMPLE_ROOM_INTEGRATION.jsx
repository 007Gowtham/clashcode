/**
 * Example Room Component with Assignment System Integration
 * This shows how to integrate the request-based assignment system
 */

'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import ProblemPanel from '@/components/room/code-editor/ProblemPanel';
import CodeEditorPanel from '@/components/room/code-editor/CodeEditorPanel';
import TeamManagement from '@/components/room/code-editor/TeamManagement';
import { toast } from 'react-hot-toast';

export default function RoomPage({ roomId, teamId, userId }) {
    // Socket connection
    const socket = useSocket();

    // User and team state
    const [currentUserId, setCurrentUserId] = useState(userId);
    const [isLeader, setIsLeader] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);

    // Question state
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [questionAssignments, setQuestionAssignments] = useState({});

    // Assignment workflow state
    const [pendingRequests, setPendingRequests] = useState([]);
    const [cooldowns, setCooldowns] = useState({});

    // Editor state
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');

    // ==================== Socket Event Handlers ====================

    useEffect(() => {
        if (!socket) return;

        // Join team channel
        socket.emit('join-team', { teamId });

        // Listen for new assignment requests (Leader only)
        socket.on('assignment:request_received', (data) => {
            console.log('📨 New assignment request:', data);

            if (isLeader) {
                setPendingRequests(prev => {
                    // Avoid duplicates
                    const exists = prev.some(req => req.id === data.id);
                    if (exists) return prev;
                    return [...prev, data];
                });

                toast.success(`${data.requesterName} requested ${data.questionTitle}`);
            }
        });

        // Listen for assignment updates
        socket.on('assignment:updated', (data) => {
            console.log('✅ Assignment updated:', data);

            const { questionId, assignedUserId, assignedUserName } = data;

            // Update assignments map
            setQuestionAssignments(prev => ({
                ...prev,
                [questionId]: {
                    userId: assignedUserId,
                    username: assignedUserName
                }
            }));

            // Remove from pending requests
            setPendingRequests(prev =>
                prev.filter(req => req.questionId !== questionId)
            );

            // Show notification
            if (assignedUserId === currentUserId) {
                toast.success(`You've been assigned to solve this question!`);
            } else {
                toast.info(`${assignedUserName} was assigned a question`);
            }
        });

        // Listen for rejections
        socket.on('assignment:rejected', (data) => {
            console.log('❌ Assignment rejected:', data);

            const { questionId, requesterId } = data;

            // Remove from pending requests
            setPendingRequests(prev =>
                prev.filter(req => !(req.questionId === questionId && req.requesterId === requesterId))
            );

            // Set cooldown for the requester
            if (requesterId === currentUserId) {
                const cooldownTime = 30000; // 30 seconds

                setCooldowns(prev => ({
                    ...prev,
                    [questionId]: cooldownTime
                }));

                toast.error('Your request was rejected. Please wait 30 seconds before requesting again.');

                // Countdown timer
                const interval = setInterval(() => {
                    setCooldowns(prev => {
                        const remaining = prev[questionId];
                        if (remaining <= 1000) {
                            clearInterval(interval);
                            const newCooldowns = { ...prev };
                            delete newCooldowns[questionId];
                            return newCooldowns;
                        }
                        return {
                            ...prev,
                            [questionId]: remaining - 1000
                        };
                    });
                }, 1000);
            }
        });

        // Listen for errors
        socket.on('assignment:error', (data) => {
            console.error('⚠️ Assignment error:', data);
            toast.error(data.message);
        });

        // Listen for request confirmation
        socket.on('assignment:request_sent', (data) => {
            console.log('📤 Request sent:', data);
            toast.success(data.message);
        });

        return () => {
            socket.off('assignment:request_received');
            socket.off('assignment:updated');
            socket.off('assignment:rejected');
            socket.off('assignment:error');
            socket.off('assignment:request_sent');
        };
    }, [socket, isLeader, currentUserId, teamId]);

    // ==================== Handler Functions ====================

    /**
     * Handle question request from team member
     */
    const handleRequestQuestion = (questionId, questionTitle) => {
        if (!socket) {
            toast.error('Not connected to server');
            return;
        }

        console.log('📨 Requesting question:', questionId);

        socket.emit('assignment:request', {
            teamId,
            questionId,
            questionTitle
        });
    };

    /**
     * Handle question assignment
     * - If leader with userId: Approve a request
     * - If leader without userId: Direct assign to self
     */
    const handleAssignQuestion = (questionId, userId = null, requestId = null) => {
        if (!socket) {
            toast.error('Not connected to server');
            return;
        }

        if (isLeader && userId && userId !== currentUserId) {
            // Leader approving a request
            console.log('✅ Approving request:', { questionId, userId, requestId });

            socket.emit('assignment:approve', {
                teamId,
                questionId,
                requesterId: userId,
                requestId
            });
        } else {
            // Leader directly assigning to self
            console.log('⚡ Direct assignment:', questionId);

            socket.emit('assignment:direct', {
                teamId,
                questionId,
                userId: currentUserId
            });
        }
    };

    /**
     * Handle question rejection (Leader only)
     */
    const handleRejectQuestion = (questionId, userId, requestId) => {
        if (!socket) {
            toast.error('Not connected to server');
            return;
        }

        if (!isLeader) {
            toast.error('Only team leader can reject requests');
            return;
        }

        console.log('❌ Rejecting request:', { questionId, userId, requestId });

        socket.emit('assignment:reject', {
            teamId,
            questionId,
            requesterId: userId,
            requestId
        });
    };

    // ==================== Render ====================

    return (
        <div className="h-screen flex">
            {/* Left: Problem Panel */}
            <div className="w-1/3">
                <ProblemPanel
                    activeTab="problem"
                    onTabChange={() => { }}
                    selectedQuestion={selectedQuestion}
                    onQuestionSelect={setSelectedQuestion}
                    questions={questions}
                    isLeader={isLeader}
                    questionAssignments={questionAssignments}
                    pendingRequests={pendingRequests}
                    currentUserId={currentUserId}
                    cooldowns={cooldowns}
                    onRequestQuestion={handleRequestQuestion}
                    onAssignQuestion={handleAssignQuestion}
                />
            </div>

            {/* Center: Code Editor */}
            <div className="flex-1">
                <CodeEditorPanel
                    code={code}
                    setCode={setCode}
                    activeEditor={currentUserId}
                    onEditorChange={() => { }}
                    language={language}
                    onLanguageChange={setLanguage}
                    onRun={() => { }}
                    onSubmit={() => { }}
                    isLocked={!questionAssignments[selectedQuestion]?.userId === currentUserId}
                    selectedQuestion={selectedQuestion}
                    isRunning={false}
                    isSubmitting={false}
                    output={null}
                    submissionResult={null}
                    teamMembers={teamMembers}
                    currentUserId={currentUserId}
                    leaderId={teamMembers.find(m => m.isLeader)?.userId}
                />
            </div>

            {/* Right: Team Management */}
            <div className="w-80">
                <TeamManagement
                    isLeader={isLeader}
                    teamMembers={teamMembers}
                    questionAssignments={questionAssignments}
                    pendingRequests={pendingRequests}
                    onAssignQuestion={handleAssignQuestion}
                    onRejectQuestion={handleRejectQuestion}
                />
            </div>
        </div>
    );
}
