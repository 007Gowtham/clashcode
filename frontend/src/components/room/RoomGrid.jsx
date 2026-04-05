import RoomCard from './RoomCard';

export default function RoomGrid({ rooms, onJoin, activeRoomId }) {
    if (rooms.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500 w-full">
                <p>No active rooms found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mx-auto">
            {rooms.map((room) => (
                <RoomCard key={room._id || room.id} room={room} onJoin={onJoin} activeRoomId={activeRoomId} />
            ))}
        </div>
    );
}