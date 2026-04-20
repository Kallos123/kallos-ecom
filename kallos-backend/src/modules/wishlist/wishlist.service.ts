import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';

export const wishlistService = {
  async getWishlist(userId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                isActive: true,
                images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
                variants: {
                  where: { isActive: true },
                  select: { id: true, size: true, color: true, stock: true, price: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return wishlist ?? { items: [] };
  },

  async toggle(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw AppError.notFound('Product not found');

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) wishlist = await prisma.wishlist.create({ data: { userId } });

    const existing = await prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { added: false };
    } else {
      await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
      return { added: true };
    }
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminListWishlists(skip: number, limit: number, search?: string) {
    const userWhere = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName:  { contains: search, mode: 'insensitive' as const } },
            { email:     { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const where = {
      items: { some: {} },
      ...(userWhere ? { user: userWhere } : {}),
    };

    const [wishlists, total] = await Promise.all([
      prisma.wishlist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  isActive: true,
                  images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
                  _count: { select: { variants: { where: { stock: { gt: 0 } } } } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.wishlist.count({ where }),
    ]);

    return { wishlists, total };
  },
};
