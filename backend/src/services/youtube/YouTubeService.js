'use strict';

/**
 * YouTube Verification Service
 *
 * IMPORTANT ARCHITECTURAL NOTE:
 * ─────────────────────────────
 * The YouTube Data API v3 does NOT expose subscription data for arbitrary users.
 * A channel owner can only query their OWN subscriptions via OAuth.
 * There is no API endpoint that accepts a Telegram user ID and returns
 * whether that person subscribes to a given channel.
 *
 * Therefore: YouTube verification is implemented as a SELF-REPORT flow.
 * The user clicks "I subscribed", submits their YouTube channel URL/handle,
 * and the system records the claim. An admin can later spot-check and
 * approve or reject it.
 *
 * This is the only honest, API-compliant approach without requiring
 * every user to individually OAuth-authorize your application
 * (which is impractical for a Telegram bot use case).
 *
 * Architecture is designed so that if YouTube ever provides a suitable API,
 * the verifySubscription() function below can be replaced with a real check
 * without touching the referral or verification logic.
 */

const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Verify YouTube subscription.
 *
 * Currently returns a "SELF_REPORTED" result since direct verification
 * is not possible via the YouTube Data API v3 for arbitrary users.
 *
 * @param {string} youtubeChannelUrl - URL or handle provided by user
 * @returns {{ verified: boolean, method: string, data: object }}
 */
const verifySubscription = async (youtubeChannelUrl = '') => {
  // When a real API method becomes available, implement it here.
  // For now: record the claim and mark as pending admin review.
  logger.info('YouTube verification (self-report)', { youtubeChannelUrl });

  return {
    verified: false,           // Not auto-verified — requires admin approval
    method:   'SELF_REPORTED',
    data: {
      channel_url:    youtubeChannelUrl,
      target_channel: env.YOUTUBE_CHANNEL_ID,
      note:           'User self-reported subscription. Pending admin review.',
    },
  };
};

/**
 * Get the YouTube channel URL for display to users.
 */
const getChannelUrl = () =>
  `https://www.youtube.com/channel/${env.YOUTUBE_CHANNEL_ID}`;

module.exports = { verifySubscription, getChannelUrl };
