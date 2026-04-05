import React from 'react';

const ERROR_MAP = {
  EMAIL_TAKEN: 'This email is already registered',
  USERNAME_TAKEN: 'This username is already taken',
  INVALID_CREDENTIALS: 'Incorrect email or password',
  ACCOUNT_LOCKED: 'Account locked — too many failed attempts',
  EMAIL_NOT_VERIFIED: 'Please verify your email first',
  USE_GOOGLE_LOGIN: 'This account uses Google sign-in',
  VERIFY_TOKEN_INVALID_OR_EXPIRED: 'Verification link has expired',
  RESEND_LIMIT_EXCEEDED: 'Too many resend attempts — wait 1 hour',
  ROOM_NOT_FOUND: 'No room found with that code',
  ROOM_FULL: 'This room is full',
  ROOM_ALREADY_STARTED: 'Contest has already started',
  TEAM_FULL: 'This team is full',
  TEAM_CODE_INVALID: 'Invalid team code',
  JUDGE_MAX_ATTEMPTS_REACHED: 'Max submissions reached',
  JUDGE_ALREADY_ACCEPTED: 'Already accepted for this question',
};

export default function FormError({ message, code }) {
  if (!message && !code) return null;
  const displayMsg = (code && ERROR_MAP[code]) ? ERROR_MAP[code] : message;
  
  return (
    <p className="text-red-500 text-sm mt-1 font-medium">{displayMsg}</p>
  );
}
