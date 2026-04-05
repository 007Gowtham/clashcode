import { createSlice } from '@reduxjs/toolkit';

const contestSlice = createSlice({
  name: 'contest',
  initialState: {
    myQuestions:  [],
    leaderboard:  [],
    submissions:  [],
    endTime:      null,
  },
  reducers: {
    setMyQuestions(state, { payload }) {
      state.myQuestions = payload;
    },
    setLeaderboard(state, { payload }) {
      state.leaderboard = payload;
    },
    setSubmissions(state, { payload }) {
      state.submissions = payload;
    },
    setEndTime(state, { payload }) {
      state.endTime = payload;
    },
    clearContest(state) {
      state.myQuestions = [];
      state.leaderboard = [];
      state.submissions = [];
      state.endTime     = null;
    },
  },
});

export const { setMyQuestions, setLeaderboard, setSubmissions, setEndTime, clearContest } = contestSlice.actions;
export default contestSlice.reducer;
