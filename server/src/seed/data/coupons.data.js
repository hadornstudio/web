const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const couponsData = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrderValue: 0,
    perUserLimit: 1,
  },
  {
    code: 'HADORN25',
    type: 'flat',
    value: 35000, // ₦35,000
    minOrderValue: 200000, // ₦200,000
    expiresAt: daysFromNow(90),
    perUserLimit: 1,
  },
  {
    code: 'SUMMER15',
    type: 'percent',
    value: 15,
    minOrderValue: 100000, // ₦100,000
    maxDiscountAmount: 70000, // ₦70,000
    expiresAt: daysFromNow(60),
    perUserLimit: 1,
  },
  {
    code: 'EXPIRED5',
    type: 'percent',
    value: 5,
    minOrderValue: 0,
    expiresAt: daysAgo(10),
    perUserLimit: 1,
  },
];
