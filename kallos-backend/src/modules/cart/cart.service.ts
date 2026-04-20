import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';

export const cartService = {
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    basePrice: true,
                    isActive: true,
                    images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      await prisma.cart.create({ data: { userId } });
      return { userId, items: [], subtotal: 0 };
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price = Number(item.variant.price ?? item.variant.product.basePrice);
      return sum + price * item.quantity;
    }, 0);

    return { ...cart, subtotal };
  },

  async addItem(userId: string, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { isActive: true } } },
    });

    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw AppError.notFound('Product or variant not found');
    }
    if (variant.stock < quantity) {
      throw AppError.badRequest(`Only ${variant.stock} units available`);
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (variant.stock < newQty) throw AppError.badRequest(`Only ${variant.stock} units available`);
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
    }

    return this.getCart(userId);
  },

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw AppError.notFound('Cart not found');

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw AppError.notFound('Cart item not found');

    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant || variant.stock < quantity) {
      throw AppError.badRequest(`Only ${variant?.stock ?? 0} units available`);
    }

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getCart(userId);
  },

  async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw AppError.notFound('Cart not found');

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw AppError.notFound('Cart item not found');

    await prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  },

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminListCarts(skip: number, limit: number, search?: string) {
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

    const [carts, total] = await Promise.all([
      prisma.cart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      basePrice: true,
                      images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
                    },
                  },
                },
                select: {
                  id: true,
                  size: true,
                  color: true,
                  colorHex: true,
                  price: true,
                  stock: true,
                  product: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.cart.count({ where }),
    ]);

    return {
      carts: carts.map((cart) => ({
        ...cart,
        subtotal: cart.items.reduce((sum, item) => {
          const price = Number(item.variant.price ?? item.variant.product.basePrice);
          return sum + price * item.quantity;
        }, 0),
        totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
      total,
    };
  },
};
