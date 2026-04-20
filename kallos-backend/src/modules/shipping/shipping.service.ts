import axios from 'axios';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

const delhivery = axios.create({
  baseURL: env.DELHIVERY_BASE_URL,
  headers: {
    Authorization: `Token ${env.DELHIVERY_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const shippingService = {
  async checkServiceability(pincode: string) {
    try {
      const res = await delhivery.get(`/c/api/pin-codes/json/?filter_codes=${pincode}`);
      const pincodes = res.data?.delivery_codes ?? [];
      const serviceable = pincodes.some((p: any) => p.postal_code?.cod === 'Y' || p.postal_code?.pre_paid === 'Y');
      return { pincode, serviceable, cod: pincodes[0]?.postal_code?.cod === 'Y' };
    } catch {
      return { pincode, serviceable: false, cod: false };
    }
  },

  async createShipment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { email: true, phone: true, firstName: true, lastName: true } },
      },
    });

    if (!order) throw AppError.notFound('Order not found');
    if (order.orderStatus !== 'PROCESSING') {
      throw AppError.badRequest('Order must be in PROCESSING state to create shipment');
    }

    const address = order.addressSnapshot as any;
    const totalWeight = 500 * order.items.reduce((sum, i) => sum + i.quantity, 0); // 500g per item estimate

    const shipmentData = {
      format: 'json',
      data: JSON.stringify({
        shipments: [
          {
            name: address.fullName,
            add: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
            city: address.city,
            state: address.state,
            country: 'India',
            pin: address.pincode,
            phone: address.phone,
            order: order.orderNumber,
            payment_mode: order.paymentMethod === 'COD' ? 'COD' : 'Pre-paid',
            return_pin: '',
            return_city: '',
            return_phone: '',
            return_add: '',
            return_state: '',
            return_country: 'India',
            products_desc: 'Clothing and Accessories',
            hsn_code: '',
            cod_amount: order.paymentMethod === 'COD' ? Number(order.totalAmount) : 0,
            order_date: order.createdAt.toISOString(),
            total_amount: Number(order.totalAmount),
            seller_add: env.DELHIVERY_WAREHOUSE_NAME,
            seller_name: 'KALLOS',
            seller_inv: order.orderNumber,
            quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
            weight: totalWeight,
            shipment_width: 30,
            shipment_height: 10,
            shipment_length: 40,
            comment: order.notes ?? '',
          },
        ],
      }),
    };

    const response = await delhivery.post('/api/cmu/create.json', shipmentData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const waybill = response.data?.packages?.[0]?.waybill;
    if (!waybill) throw AppError.internal('Failed to create Delhivery shipment');

    await prisma.order.update({
      where: { id: orderId },
      data: { trackingId: waybill, courierPartner: 'Delhivery', orderStatus: 'SHIPPED' },
    });

    return { waybill, orderId };
  },

  async trackShipment(waybill: string) {
    try {
      const res = await delhivery.get(`/api/v1/packages/json/?waybill=${waybill}`);
      return res.data;
    } catch {
      throw AppError.internal('Failed to fetch tracking info');
    }
  },

  async handleWebhook(payload: any) {
    const waybill = payload?.waybill;
    const status = payload?.status;
    if (!waybill || !status) return;

    const statusMap: Record<string, string> = {
      'Delivered': 'DELIVERED',
      'Out for Delivery': 'OUT_FOR_DELIVERY',
      'In Transit': 'SHIPPED',
    };

    const orderStatus = statusMap[status];
    if (!orderStatus) return;

    const order = await prisma.order.findFirst({ where: { trackingId: waybill } });
    if (!order) return;

    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { orderStatus: orderStatus as any } }),
      prisma.orderStatusHistory.create({ data: { orderId: order.id, status: orderStatus as any, note: `Delhivery: ${status}` } }),
    ]);
  },
};
