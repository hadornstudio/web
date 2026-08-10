import Order from '../models/Order.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function getHeadline() {
  const [revenueAgg, totalOrders, totalCustomers] = await Promise.all([
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
  ]);

  const totalRevenue = revenueAgg[0]?.revenue || 0;
  const paidCount = revenueAgg[0]?.count || 0;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    averageOrderValue: paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0,
  };
}

async function getRevenueSeries(days) {
  // $dateToString formats in UTC by default, so the JS-side date window must be
  // built with UTC methods too — mixing local-time setDate/setHours with UTC
  // toISOString() silently shifts the whole series by the local UTC offset,
  // dropping "today" off the end whenever local time is behind UTC.
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  const rows = await Order.aggregate([
    { $match: { 'payment.status': 'paid', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
  ]);
  const byDate = new Map(rows.map((r) => [r._id, { revenue: r.revenue, orderCount: r.orderCount }]));

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const key = formatDate(d);
    const entry = byDate.get(key) || { revenue: 0, orderCount: 0 };
    series.push({ date: key, ...entry });
  }
  return series;
}

async function getOrdersByStatus() {
  const rows = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = new Map(rows.map((r) => [r._id, r.count]));
  return ORDER_STATUSES.map((status) => ({ status, count: byStatus.get(status) || 0 }));
}

async function getTopProducts() {
  return Order.aggregate([
    { $match: { 'payment.status': 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        title: { $first: '$items.title' },
        image: { $first: '$items.image' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, productId: '$_id', title: 1, image: 1, unitsSold: 1, revenue: 1 } },
  ]);
}

async function getRecentOrders() {
  const orders = await Order.find()
    .sort('-createdAt')
    .limit(10)
    .populate('user', 'name')
    .select('orderNumber total status createdAt user');

  return orders.map((o) => ({
    _id: o._id,
    orderNumber: o.orderNumber,
    customerName: o.user?.name || 'Unknown',
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }));
}

export const getOverview = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

  const [headline, revenueSeries, ordersByStatus, topProducts, recentOrders] = await Promise.all([
    getHeadline(),
    getRevenueSeries(days),
    getOrdersByStatus(),
    getTopProducts(),
    getRecentOrders(),
  ]);

  res.json({
    success: true,
    data: { headline, revenueSeries, ordersByStatus, topProducts, recentOrders },
  });
});
