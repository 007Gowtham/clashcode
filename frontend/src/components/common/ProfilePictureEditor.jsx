'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { setProfilePicture } from '@/store/slices/authSlice';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * ProfilePictureEditor
 *
 * Renders the user's avatar with a camera-icon overlay. On click it opens the
 * file picker, runs the full presigned-URL upload flow (get URL → PUT to S3 →
 * confirm with backend), and updates Redux state — all without sending the file
 * bytes through your Spring backend.
 *
 * Props
 * ─────
 * userId   {string}   Required. The user's UUID.
 * username {string}   Displayed as initials when no picture is set.
 * photoKey {string}   The stored S3 key (from user.profilePictureKey).
 * size     {string}   Tailwind size class for the avatar circle. Default "w-10 h-10".
 * editable {boolean}  When false the overlay/click is suppressed. Default true.
 */
export default function ProfilePictureEditor({
  userId,
  username = '',
  photoKey = null,
  size = 'w-10 h-10',
  editable = true,
}) {
  const dispatch = useDispatch();
  const fileRef = useRef(null);

  const [viewUrl, setViewUrl] = useState(null);         // fetched presigned GET URL
  const [previewUrl, setPreviewUrl] = useState(null);   // optimistic local preview
  const [status, setStatus] = useState('idle');         // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // ── Fetch view URL on first render when a key exists ─────────────────────
  // Using a lazy initialiser pattern: fetch once, cache in state.
  const fetchViewUrl = useCallback(async (key) => {
    if (!key || !userId) return;
    try {
      const { data } = await api.get(`/api/users/${userId}/profile-picture`);
      setViewUrl(data?.data?.viewUrl ?? null);
    } catch {
      // silently fail — initials fallback is shown
    }
  }, [userId]);

  // Trigger fetch or reset when photoKey changes (handles logout and switching users)
  useEffect(() => {
    if (photoKey) {
      fetchViewUrl(photoKey);
    } else {
      setViewUrl(null);
      setPreviewUrl(null);
    }
  }, [photoKey, fetchViewUrl]);

  // ── File selected ─────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';      // reset so the same file can be re-selected
    if (!file) return;

    // Client-side guards
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus('error');
      setErrorMsg('Only JPEG, PNG, and WebP images are accepted.');
      setTimeout(() => setStatus('idle'), 3500);
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus('error');
      setErrorMsg('Image must be smaller than 5 MB.');
      setTimeout(() => setStatus('idle'), 3500);
      return;
    }

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setStatus('uploading');
    setErrorMsg('');

    try {
      // ── Step 1: get presigned PUT URL from our backend ─────────────────
      const { data: urlData } = await api.post(
        `/api/users/${userId}/profile-picture/upload-url`,
        { contentType: file.type }
      );
      const { uploadUrl, key } = urlData.data;

      // ── Step 2: PUT the file directly to S3 (no backend involved) ──────
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`);

      // ── Step 3: tell the backend to persist the key ────────────────────
      await api.post(`/api/users/${userId}/profile-picture/confirm`, { key });

      // ── Step 4: update Redux so every component reflects the new key ───
      dispatch(setProfilePicture(key));

      // Fetch a real presigned GET URL to replace the local blob URL
      await fetchViewUrl(key);
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(null);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(null);
      setStatus('error');
      setErrorMsg(
        err?.response?.data?.message ?? 'Upload failed. Please try again.'
      );
      setTimeout(() => setStatus('idle'), 3500);
    }
  };

  // ── Derived display URL (local preview > fetched view URL > null) ─────────
  const displayUrl = previewUrl ?? viewUrl;

  // ── Initials fallback ─────────────────────────────────────────────────────
  const initials = username?.charAt(0)?.toUpperCase() ?? '?';

  const isUploading = status === 'uploading';

  return (
    <div className="relative inline-block group/avatar">
      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => editable && !isUploading && fileRef.current?.click()}
        disabled={!editable || isUploading}
        className={`
          ${size} rounded-full overflow-hidden relative
          focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
          ${editable ? 'cursor-pointer' : 'cursor-default'}
          transition-all duration-200
        `}
        title={editable ? 'Change profile picture' : undefined}
        aria-label={editable ? 'Change profile picture' : 'Profile picture'}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-[10px] font-semibold select-none">
            {initials}
          </span>
        )}

        {/* Camera overlay — only when editable and not uploading */}
        {editable && !isUploading && (
          <span className="
            absolute inset-0 flex items-center justify-center
            bg-black/40 rounded-full
            opacity-0 group-hover/avatar:opacity-100
            transition-opacity duration-150
          ">
            <Camera className="w-3 h-3 text-white" strokeWidth={2.5} />
          </span>
        )}

        {/* Spinner overlay while uploading */}
        {isUploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </span>
        )}
      </button>

      {/* Status badge */}
      {status === 'success' && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center" title="Uploaded">
          <CheckCircle2 className="w-2 h-2 text-white" strokeWidth={3} />
        </span>
      )}
      {status === 'error' && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center" title={errorMsg}>
          <AlertCircle className="w-2 h-2 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Error tooltip */}
      {status === 'error' && errorMsg && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] bg-red-600 text-white text-[11px] font-medium rounded-lg px-3 py-1.5 shadow-lg z-50 text-center leading-tight whitespace-normal pointer-events-none">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
