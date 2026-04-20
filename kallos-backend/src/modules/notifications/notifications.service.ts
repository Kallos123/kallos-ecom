import { prisma } from '../../config/database';

export const notificationsService = {
  async create(data: { type: string; title: string; message: string; link?: string }) {
    return prisma.adminNotification.create({ data });
  },

  async list(limit = 40) {
    const [items, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.adminNotification.count({ where: { isRead: false } }),
    ]);
    return { items, unreadCount };
  },

  async markRead(id: string) {
    return prisma.adminNotification.update({ where: { id }, data: { isRead: true } });
  },

  async markAllRead() {
    return prisma.adminNotification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  },

  async deleteOne(id: string) {
    return prisma.adminNotification.delete({ where: { id } });
  },
};
