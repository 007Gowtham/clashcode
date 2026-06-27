'use client';

import TeamCard from './teamcard';

export default function TeamGrid({ teams, onJoinTeam, onLeaveTeam, onReady, onKickMember, myTeamId }) {
    return (
        <div className="w-full max-w-6xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teams.map((team) => (
                    <TeamCard key={team.id} team={team} onJoinTeam={onJoinTeam} onLeaveTeam={onLeaveTeam} onReady={onReady} onKickMember={onKickMember} myTeamId={myTeamId} />
                ))}
            </div>
        </div>
    );
}
