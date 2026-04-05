import { createSlice } from '@reduxjs/toolkit';

const roomSlice = createSlice({
  name: 'room',
  initialState: {
    room:   null,
    teams:  [],
    myTeam: null,
    myRole: null, // 'admin' | 'leader' | 'member'
  },
  reducers: {
    setRoom(state, { payload }) {
      state.room = payload;
    },
    setTeams(state, { payload }) {
      state.teams = payload;
    },
    setMyTeam(state, { payload }) {
      state.myTeam = payload;
    },
    setMyRole(state, { payload }) {
      state.myRole = payload;
    },
    upsertTeam(state, { payload }) {
      const { team, userId, adminId } = payload;
      const t = team || payload; // fallback if only team is passed
      
      const idx = state.teams.findIndex(x => x._id === t._id);
      if (idx >= 0) state.teams[idx] = t;
      else state.teams.push(t);
      
      if (state.myTeam?._id === t._id) {
        state.myTeam = t;
        if (userId) {
          const stillIn = t.members.some(m => (m.userId?._id || m.userId).toString() === userId.toString());
          if (!stillIn) {
            state.myTeam = null;
            state.myRole = (adminId === userId) ? 'admin' : null;
          }
        }
      }
    },
    removeTeam(state, { payload: teamId }) {
      const tid = String(teamId);
      state.teams = state.teams.filter(t => String(t._id) !== tid);
      if (String(state.myTeam?._id) === tid) {
        state.myTeam = null;
        state.myRole = (state.room?.adminId === state.myRole) ? 'admin' : null; 
      }
    },
    clearRoom(state) {
      state.room   = null;
      state.teams  = [];
      state.myTeam = null;
      state.myRole = null;
    },
  },
});

export const { setRoom, setTeams, setMyTeam, setMyRole, upsertTeam, removeTeam, clearRoom } = roomSlice.actions;
export default roomSlice.reducer;
