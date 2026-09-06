'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Check if already seeded
    const existing = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM requirements',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].count > 0) {
      console.log('Requirements already seeded — skipping.');
      return;
    }

    await queryInterface.bulkInsert('requirements', [
      {
        name: 'Join Telegram Community 1',
        type: 'TELEGRAM',
        telegram_chat_id: '-1004418005232',
        url: 'https://t.me/+gq4chv77usE1OWZk',
        description: 'Join CRYPTO COMMUNITY to qualify',
        is_enabled: true,
        order_index: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Join Telegram Community 2',
        type: 'TELEGRAM',
        telegram_chat_id: '-1003920921797',
        url: 'https://t.me/+cvl2ct83eeRiNTI0',
        description: 'Join CRYPTO GIVE AWAY to qualify',
        is_enabled: true,
        order_index: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Subscribe to YouTube Channel',
        type: 'YOUTUBE',
        telegram_chat_id: null,
        url: 'https://www.youtube.com/channel/UCkaUxs6oOUGHD8eG2VGrRgw',
        description: 'Subscribe to our YouTube channel to qualify',
        is_enabled: true,
        order_index: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('Requirements seeded successfully.');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('requirements', null, {});
  },
};
