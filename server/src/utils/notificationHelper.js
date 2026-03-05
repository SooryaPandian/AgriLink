const Notification = require('../models/Notification');

/**
 * Create a notification in DB and emit it to the recipient via socket
 */
async function createAndEmitNotification(io, { recipient, type, title, message, relatedId, relatedModel }) {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    relatedId,
    relatedModel,
  });

  if (io) {
    io.to(recipient.toString()).emit('notification', notification);
  }

  return notification;
}

module.exports = { createAndEmitNotification };
