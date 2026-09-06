-- ============================================================
-- Telegram Referral Platform — Full Production Schema Reference
-- Phase 2: All tables
-- NOTE: Actual creation is handled by Sequelize migrations.
--       This file is documentation only.
-- ============================================================

-- users: Telegram user accounts
CREATE TABLE users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  telegram_id     BIGINT NOT NULL UNIQUE,
  username        VARCHAR(100),
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  referral_code   VARCHAR(20) NOT NULL UNIQUE,
  referred_by_id  BIGINT UNSIGNED REFERENCES users(id),
  balance         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_earned    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at    DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- referrals: referral relationships
CREATE TABLE referrals (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referrer_id      BIGINT UNSIGNED NOT NULL REFERENCES users(id),
  referred_user_id BIGINT UNSIGNED NOT NULL UNIQUE REFERENCES users(id),
  status           ENUM('PENDING','QUALIFIED','REWARDED','REJECTED') NOT NULL DEFAULT 'PENDING',
  reward_amount    DECIMAL(12,2),
  qualified_at     DATETIME,
  rewarded_at      DATETIME,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- transactions: immutable financial ledger
CREATE TABLE transactions (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT UNSIGNED NOT NULL REFERENCES users(id),
  type           ENUM('REFERRAL_REWARD','WITHDRAWAL','WITHDRAWAL_REVERSAL','ADJUSTMENT') NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  currency       VARCHAR(3) NOT NULL DEFAULT 'USD',
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after  DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id   BIGINT UNSIGNED,
  description    VARCHAR(255),
  status         ENUM('PENDING','COMPLETED','FAILED','REVERSED') NOT NULL DEFAULT 'COMPLETED',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- admins: admin dashboard users
CREATE TABLE admins (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50) NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('SUPER_ADMIN','ADMIN','MODERATOR') NOT NULL DEFAULT 'ADMIN',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  DATETIME,
  last_login_ip  VARCHAR(45),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- withdrawals: withdrawal requests
CREATE TABLE withdrawals (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL REFERENCES users(id),
  amount          DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_method  VARCHAR(50) NOT NULL,
  payment_details TEXT NOT NULL,
  status          ENUM('PENDING','PROCESSING','PAID','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  admin_id        BIGINT UNSIGNED REFERENCES admins(id),
  admin_note      TEXT,
  processed_at    DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- requirements: configurable join requirements (Telegram/YouTube)
CREATE TABLE requirements (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  type             ENUM('TELEGRAM','YOUTUBE') NOT NULL,
  telegram_chat_id VARCHAR(100),
  url              VARCHAR(500),
  description      VARCHAR(255),
  is_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  order_index      INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- requirement_verifications: per-user verification state
CREATE TABLE requirement_verifications (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL REFERENCES users(id),
  requirement_id    INT UNSIGNED NOT NULL REFERENCES requirements(id),
  status            ENUM('PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'PENDING',
  verified_at       DATETIME,
  verification_data TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_requirement (user_id, requirement_id)
);

-- settings: platform configuration
CREATE TABLE settings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key`       VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT,
  description VARCHAR(255),
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- audit_logs: admin action history
CREATE TABLE audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id    BIGINT UNSIGNED REFERENCES admins(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   BIGINT UNSIGNED,
  old_values  TEXT,
  new_values  TEXT,
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(500),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
