'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { roomsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Active room state
  const [activeRoom, setActiveRoom] = useState(null);
  const [leavingActiveRoom, setLeavingActiveRoom] = useState(false);

  // Rooms list state
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Create room modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRoomName, setCreateRoomName] = useState('');
  const [createMode, setCreateMode] = useState('SOLO');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [maxTeams, setMaxTeams] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join room modal / input state
  const [directRoomCode, setDirectRoomCode] = useState('');
  const [directJoinLoading, setDirectJoinLoading] = useState(false);
  const [directJoinError, setDirectJoinError] = useState('');

  const [modalTargetRoom, setModalTargetRoom] = useState(null);
  const [modalRoomCode, setModalRoomCode] = useState('');
  const [modalJoinLoading, setModalJoinLoading] = useState(false);
  const [modalJoinError, setModalJoinError] = useState('');

  // Helper to extract active room code from error message (e.g. "You already have an active room (4QDNLK)...")
  const extractRoomCode = (msg) => {
    if (!msg) return null;
    const match = msg.match(/active room \(([A-Z0-9_-]+)\)/i);
    return match ? match[1] : null;
  };

  // Fetch active room for user
  const fetchActiveRoom = useCallback(async () => {
    if (!user) return;
    try {
      const res = await roomsApi.getActive();
      if (res && res.hasActiveRoom) {
        setActiveRoom(res);
      } else {
        setActiveRoom(null);
      }
    } catch {
      setActiveRoom(null);
    }
  }, [user]);

  // Leave active room
  const handleLeaveActiveRoom = async (targetIdOrCode) => {
    const idToLeave = targetIdOrCode || activeRoom?.roomId || activeRoom?.roomCode;
    if (!idToLeave) return;
    if (!confirm('Leave your active room?')) return;
    setLeavingActiveRoom(true);
    try {
      await roomsApi.leave(idToLeave);
      setActiveRoom(null);
      setDirectJoinError('');
      setCreateError('');
      setModalJoinError('');
      fetchAvailableRooms();
    } catch (err) {
      alert(err.message || 'Failed to leave room');
    } finally {
      setLeavingActiveRoom(false);
    }
  };

  // Fetch available rooms
  const fetchAvailableRooms = useCallback(async () => {
    try {
      const res = await roomsApi.listAvailable({ page, size: 10 });
      if (res && res.content) {
        setAvailableRooms(res.content);
        setTotalPages(res.totalPages || 0);
      } else if (Array.isArray(res)) {
        setAvailableRooms(res);
      }
    } catch (err) {
      console.warn('Failed to fetch available rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAvailableRooms();
    fetchActiveRoom();
    const interval = setInterval(() => {
      fetchAvailableRooms();
      fetchActiveRoom();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAvailableRooms, fetchActiveRoom]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [authLoading, user, router]);

  // Handle Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (activeRoom) return;
    setCreateLoading(true);
    setCreateError('');

    try {
      const payload = {
        roomName: createRoomName.trim(),
        mode: createMode,
        durationMinutes: parseInt(durationMinutes, 10),
      };

      if (createMode === 'TEAM') {
        payload.maxTeams = parseInt(maxTeams, 10);
      } else {
        payload.maxPlayers = parseInt(maxPlayers, 10);
      }

      const snapshot = await roomsApi.create(payload);
      const codeOrId = snapshot.room?.roomCode || snapshot.room?.id;
      setShowCreateModal(false);
      router.push(`/rooms/${codeOrId}`);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to create room';
      setCreateError(msg);
      fetchActiveRoom();
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Direct Join with Code
  const handleDirectJoin = async (e) => {
    e.preventDefault();
    if (activeRoom || !directRoomCode.trim()) return;
    setDirectJoinLoading(true);
    setDirectJoinError('');

    try {
      const snapshot = await roomsApi.join({
        roomCode: directRoomCode.trim().toUpperCase(),
      });
      const codeOrId = snapshot.room?.roomCode || snapshot.room?.id;
      router.push(`/rooms/${codeOrId}`);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to join room';
      setDirectJoinError(msg);
      fetchActiveRoom();
    } finally {
      setDirectJoinLoading(false);
    }
  };

  // Handle Modal Join from Table
  const handleModalJoin = async (e) => {
    e.preventDefault();
    if (activeRoom || !modalRoomCode.trim()) return;
    setModalJoinLoading(true);
    setModalJoinError('');

    try {
      const snapshot = await roomsApi.join({
        roomCode: modalRoomCode.trim().toUpperCase(),
      });
      const codeOrId = snapshot.room?.roomCode || snapshot.room?.id;
      setModalTargetRoom(null);
      router.push(`/rooms/${codeOrId}`);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to join room';
      setModalJoinError(msg);
      fetchActiveRoom();
    } finally {
      setModalJoinLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-[1000px] mx-auto py-8 px-4 space-y-6">
        {/* Page Title & User Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--ink-border)] pb-6">
          <div>
            <h1 className="text-[26px] font-semibold text-[var(--ink)] tracking-tight">
              ClashCode Arena
            </h1>
            <p className="text-[14px] opacity-70 mt-1">
              Welcome back, <span className="font-medium text-[var(--ink)]">{user?.username}</span>.
            </p>
          </div>

          <Button
            variant="primary"
            disabled={Boolean(activeRoom)}
            title={activeRoom ? 'Leave your active room to create a new one' : 'Create Room'}
            onClick={() => {
              if (activeRoom) return;
              setCreateRoomName('');
              setCreateError('');
              setShowCreateModal(true);
            }}
          >
            Create Room
          </Button>
        </div>

        {/* SIMPLE & CLEAN ACTIVE ROOM REJOIN BAR */}
        {activeRoom && (
          <div className="border border-[var(--ink-border)] bg-[var(--paper)] rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--ink)] animate-pulse" />
              <span className="text-[var(--ink)]">
                Active room: <strong className="font-semibold">{activeRoom.roomName || 'Contest'}</strong>{' '}
                <span className="font-mono opacity-60">({activeRoom.roomCode})</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                disabled={leavingActiveRoom}
                onClick={() => handleLeaveActiveRoom()}
              >
                {leavingActiveRoom ? 'Leaving...' : 'Leave'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/rooms/${activeRoom.roomCode || activeRoom.roomId}`)}
              >
                Rejoin Room →
              </Button>
            </div>
          </div>
        )}

        {/* How It Works Box */}
        <div className="border border-[var(--ink-border)] rounded-md p-5 bg-[var(--paper)] space-y-2.5">
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">How it works</h2>
          <ol className="list-decimal pl-5 space-y-1 text-[13px] leading-relaxed opacity-80">
            <li>Create a room, or join one with its private room code.</li>
            <li>Create a team, or join one with its team code.</li>
            <li>When the admin starts, every player gets their own assigned problem.</li>
            <li>Passed test cases add points to your team. The highest team score wins.</li>
          </ol>
        </div>

        {/* Quick Join with Room Code */}
        <div className="border border-[var(--ink-border)] rounded-md p-5 bg-[var(--paper)] space-y-3">
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">Join with a Room Code</h2>
          <form
            onSubmit={handleDirectJoin}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 max-w-md"
          >
            <div className="flex-1">
              <Input
                label="Room Code"
                placeholder="e.g. 4QDNLK"
                maxLength={10}
                required
                disabled={Boolean(activeRoom)}
                value={directRoomCode}
                onChange={(e) => setDirectRoomCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={directJoinLoading || Boolean(activeRoom) || !directRoomCode.trim()}
              title={activeRoom ? 'Leave active room to join another' : 'Join'}
            >
              {directJoinLoading ? 'Joining...' : 'Join'}
            </Button>
          </form>

          {activeRoom && (
            <p className="text-[12px] opacity-60">
              Leave your active room ({activeRoom.roomCode}) to join another.
            </p>
          )}

          {directJoinError && (
            <div className="p-3 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[13px] space-y-2">
              <div>{directJoinError}</div>
              {extractRoomCode(directJoinError) && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/rooms/${extractRoomCode(directJoinError)}`)}
                  >
                    Rejoin Room {extractRoomCode(directJoinError)} →
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={leavingActiveRoom}
                    onClick={() => handleLeaveActiveRoom(extractRoomCode(directJoinError))}
                  >
                    Leave Room
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Available Rooms Table */}
        <div className="border border-[var(--ink-border)] rounded-md p-5 bg-[var(--paper)] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[var(--ink)]">Available Rooms</h2>
            <span className="text-[12px] opacity-60">
              {activeRoom ? `Active in ${activeRoom.roomCode}` : 'Polled every 10s'}
            </span>
          </div>

          <Table>
            <TableHead>
              <TableHeaderCell>Room Name</TableHeaderCell>
              <TableHeaderCell>Mode</TableHeaderCell>
              <TableHeaderCell>Admin</TableHeaderCell>
              <TableHeaderCell>Players</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell align="right">Action</TableHeaderCell>
            </TableHead>
            <TableBody>
              {loadingRooms ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center opacity-60 text-[14px]">
                    Loading available rooms...
                  </TableCell>
                </TableRow>
              ) : availableRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center opacity-60 text-[14px]">
                    No waiting rooms available.
                  </TableCell>
                </TableRow>
              ) : (
                availableRooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-[14px]">
                      {r.roomName || 'Unnamed Room'}
                    </TableCell>
                    <TableCell className="text-[12px] uppercase font-semibold">
                      {r.mode}
                    </TableCell>
                    <TableCell className="text-[13px]">{r.adminUsername || 'Admin'}</TableCell>
                    <TableCell className="text-[13px]">
                      {r.currentPlayers}/{r.maxPlayers}
                    </TableCell>
                    <TableCell className="text-[12px] font-semibold uppercase">
                      {r.status}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={Boolean(activeRoom)}
                        title={activeRoom ? 'Leave active room to join another' : 'Join room'}
                        onClick={() => {
                          if (activeRoom) return;
                          setModalTargetRoom(r);
                          setModalRoomCode('');
                          setModalJoinError('');
                        }}
                      >
                        Join
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination if multiple pages */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--ink-border)] text-[13px]">
              <span className="opacity-70">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Create Room */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Contest Room"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4">
            {createError && (
              <div className="p-3 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[13px] space-y-2">
                <div>{createError}</div>
                {extractRoomCode(createError) && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowCreateModal(false);
                        router.push(`/rooms/${extractRoomCode(createError)}`);
                      }}
                    >
                      Rejoin Room {extractRoomCode(createError)} →
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={leavingActiveRoom}
                      onClick={() => handleLeaveActiveRoom(extractRoomCode(createError))}
                    >
                      Leave Room
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Room Name (3-40 Characters)"
              required
              minLength={3}
              maxLength={40}
              placeholder="e.g. ClashCode Weekly Cup"
              value={createRoomName}
              onChange={(e) => setCreateRoomName(e.target.value)}
            />

            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink)] mb-1.5">
                Room Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreateMode('SOLO')}
                  className={`py-2 px-3 text-[13px] rounded border transition-hover cursor-pointer ${
                    createMode === 'SOLO'
                      ? 'border-[var(--ink)] font-semibold bg-[var(--ink-hover)]'
                      : 'border-[var(--ink-border)] opacity-70'
                  }`}
                >
                  Solo Contest
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('TEAM')}
                  className={`py-2 px-3 text-[13px] rounded border transition-hover cursor-pointer ${
                    createMode === 'TEAM'
                      ? 'border-[var(--ink)] font-semibold bg-[var(--ink-hover)]'
                      : 'border-[var(--ink-border)] opacity-70'
                  }`}
                >
                  Team Contest
                </button>
              </div>
            </div>

            {createMode === 'SOLO' ? (
              <Input
                label="Max Players (2 - 100)"
                type="number"
                min={2}
                max={100}
                required
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
              />
            ) : (
              <Input
                label="Max Teams (2 - 25, 4 players/team)"
                type="number"
                min={2}
                max={25}
                required
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
              />
            )}

            <Input
              label="Duration (Minutes, 5 - 300)"
              type="number"
              min={5}
              max={300}
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: Join Room with Code (from Table) */}
        <Modal
          isOpen={Boolean(modalTargetRoom)}
          onClose={() => setModalTargetRoom(null)}
          title={`Join Room: ${modalTargetRoom?.roomName || ''}`}
        >
          <form onSubmit={handleModalJoin} className="space-y-4">
            <p className="text-[13px] opacity-70">
              Enter the private room code provided by the host.
            </p>

            {modalJoinError && (
              <div className="p-3 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[13px] space-y-2">
                <div>{modalJoinError}</div>
                {extractRoomCode(modalJoinError) && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setModalTargetRoom(null);
                        router.push(`/rooms/${extractRoomCode(modalJoinError)}`);
                      }}
                    >
                      Rejoin Room {extractRoomCode(modalJoinError)} →
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={leavingActiveRoom}
                      onClick={() => handleLeaveActiveRoom(extractRoomCode(modalJoinError))}
                    >
                      Leave Room
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Room Code"
              required
              maxLength={10}
              placeholder="e.g. 4QDNLK"
              value={modalRoomCode}
              onChange={(e) => setModalRoomCode(e.target.value.toUpperCase())}
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalTargetRoom(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={modalJoinLoading || !modalRoomCode.trim()}
              >
                {modalJoinLoading ? 'Joining...' : 'Confirm Join'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
