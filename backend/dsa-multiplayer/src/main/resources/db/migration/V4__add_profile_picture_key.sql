-- V4__add_profile_picture_key.sql
-- Adds the profile_picture_url column to the users table.
-- This stores the S3 object key (not a public URL) for the user's profile picture.
-- Access is via server-generated presigned URLs only.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(512);
