import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { notificationsService } from '../notifications/notifications.service';

export const reviewsService = {
  async getProductReviews(productId: string, skip: number, limit: number, sort: string) {
    const orderBy =
      sort === 'rating_desc'
        ? { rating: 'desc' as const }
        : sort === 'rating_asc'
        ? { rating: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, status: 'APPROVED' },
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          images: true,
          createdAt: true,
          user: { select: { firstName: true } },
        },
      }),
      prisma.review.count({ where: { productId, status: 'APPROVED' } }),
    ]);

    const aggregate = await prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });

    return {
      reviews,
      total,
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count,
    };
  },

  async createReview(
    userId: string,
    productId: string,
    data: { rating: number; title?: string; body?: string; orderId?: string }
  ) {
    // Must have purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        order: { userId, orderStatus: 'DELIVERED' },
        variant: { productId },
      },
    });
    if (!hasPurchased) {
      throw AppError.forbidden('You can only review products you have purchased and received');
    }

    const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
    if (existing) throw AppError.conflict('You have already reviewed this product');

    const review = await prisma.review.create({
      data: { userId, productId, ...data, status: 'PENDING' },
    });

    notificationsService.create({
      type: 'NEW_REVIEW',
      title: 'New Review Pending',
      message: `A customer left a review waiting for approval`,
      link: '/admin/reviews',
    }).catch(() => {});

    return review;
  },

  async updateReview(
    userId: string,
    reviewId: string,
    data: { rating?: number; title?: string; body?: string }
  ) {
    const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
    if (!review) throw AppError.notFound('Review not found');
    return prisma.review.update({ where: { id: reviewId }, data: { ...data, status: 'PENDING' } });
  },

  async deleteReview(userId: string, reviewId: string) {
    const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
    if (!review) throw AppError.notFound('Review not found');
    await prisma.review.delete({ where: { id: reviewId } });
  },

  // Admin
  async listReviews(status: string | undefined, search: string | undefined, skip: number, limit: number) {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { name: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);
    return { reviews, total };
  },

  async moderateReview(reviewId: string, status: 'APPROVED' | 'REJECTED') {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Review not found');
    return prisma.review.update({ where: { id: reviewId }, data: { status } });
  },

  async adminDeleteReview(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Review not found');
    await prisma.review.delete({ where: { id: reviewId } });
  },
};
