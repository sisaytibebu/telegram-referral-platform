-- ============================================================
-- Telegram Referral Platform — Database Initialisation
-- Phase 1: Create database and user (run as MySQL root)
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS telegram_referral
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create test database
CREATE DATABASE IF NOT EXISTS telegram_referral_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create application user (change password before use in production)
-- CREATE USER IF NOT EXISTS 'referral_user'@'%' IDENTIFIED BY 'strong_password_here';
-- GRANT ALL PRIVILEGES ON telegram_referral.* TO 'referral_user'@'%';
-- GRANT ALL PRIVILEGES ON telegram_referral_test.* TO 'referral_user'@'%';
-- FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES LIKE 'telegram_referral%';
