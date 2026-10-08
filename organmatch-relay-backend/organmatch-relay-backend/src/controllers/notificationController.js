import { Notification } from '../models/index.js';

export async function myNotifications(req, res) {
  const notifications = await Notification.find({ recipient_id: req.user.id })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  res.json({ notifications });
}

export async function markRead(req, res) {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient_id: req.user.id },
    { is_read: true },
    { new: true }
  ).lean();

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  res.json({ notification });
}
