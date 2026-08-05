import RoomCard from './RoomCard';

export default function RoomGrid({ rooms, onJoin, activeRoomId, joiningRoomId }) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-24 w-full border-2 border-dashed border-retro-ink bg-retro-paper">
        <p className="font-mono font-black uppercase text-sm tracking-widest text-retro-muted">
          // No active rooms found
        </p>
        <p className="font-mono text-xs font-bold text-retro-muted mt-2">
          Create one to start a battle.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mx-auto">
      {rooms.map((room) => (
        <RoomCard 
          key={room._id || room.id} 
          room={room} 
          onJoin={onJoin} 
          activeRoomId={activeRoomId} 
          isJoining={joiningRoomId === (room._id || room.id)}
        />
      ))}
    </div>
  );
}