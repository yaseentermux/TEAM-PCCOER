import { PrismaClient, ProductType, BillingPeriod, AmountType, DiscountScope } from '@prisma/client';

export async function seedCatalog(prisma: PrismaClient) {
  console.log('Seeding Catalog (Member 2)...');

  // 1. Taxes: GST 18% & GST 5%
  const gst18 = await prisma.tax.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'GST 18%',
      type: AmountType.PERCENT,
      amount: 18.00,
      isActive: true,
    },
  });

  const gst5 = await prisma.tax.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'GST 5%',
      type: AmountType.PERCENT,
      amount: 5.00,
      isActive: true,
    },
  });

  // 2. Products
  // Brightloop CRM with Brand variants (Odoo +560, Generic +0)
  const crm = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Brightloop CRM',
      type: ProductType.SERVICE,
      salesPrice: 1000.00,
      costPrice: 400.00,
      notes: 'Flagship enterprise CRM solution',
      isActive: true,
      taxes: {
        connect: [{ id: gst18.id }],
      },
    },
  });

  await prisma.productVariant.upsert({
    where: {
      productId_attribute_value: {
        productId: crm.id,
        attribute: 'Brand',
        value: 'Odoo',
      },
    },
    update: { extraPrice: 560.00 },
    create: {
      productId: crm.id,
      attribute: 'Brand',
      value: 'Odoo',
      extraPrice: 560.00,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      productId_attribute_value: {
        productId: crm.id,
        attribute: 'Brand',
        value: 'Generic',
      },
    },
    update: { extraPrice: 0.00 },
    create: {
      productId: crm.id,
      attribute: 'Brand',
      value: 'Generic',
      extraPrice: 0.00,
    },
  });

  // Brightloop HR
  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Brightloop HR',
      type: ProductType.SERVICE,
      salesPrice: 800.00,
      costPrice: 300.00,
      notes: 'Complete Human Resources & Payroll management',
      isActive: true,
      taxes: {
        connect: [{ id: gst18.id }],
      },
    },
  });

  // Addons: Extra Storage 100GB, Priority Support
  await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Extra Storage 100GB',
      type: ProductType.ADDON,
      salesPrice: 200.00,
      costPrice: 50.00,
      notes: 'Cloud storage expansion',
      isActive: true,
      taxes: {
        connect: [{ id: gst18.id }],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Priority Support',
      type: ProductType.ADDON,
      salesPrice: 500.00,
      costPrice: 150.00,
      notes: '24/7 priority support with 1 hour SLA',
      isActive: true,
      taxes: {
        connect: [{ id: gst18.id }],
      },
    },
  });

  // 3. Plans
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  await prisma.plan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Daily',
      price: 49.00,
      billingPeriod: BillingPeriod.DAILY,
      minQuantity: 1,
      startDate: new Date('2024-01-01'),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Weekly',
      price: 299.00,
      billingPeriod: BillingPeriod.WEEKLY,
      minQuantity: 1,
      startDate: new Date('2024-01-01'),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Monthly',
      price: 999.00,
      billingPeriod: BillingPeriod.MONTHLY,
      minQuantity: 1,
      startDate: new Date('2024-01-01'),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Yearly',
      price: 9999.00,
      billingPeriod: BillingPeriod.YEARLY,
      minQuantity: 1,
      startDate: new Date('2024-01-01'),
      autoClose: true,
      closable: true,
      pausable: true,
      renewable: true,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: 'Launch Offer Monthly',
      price: 799.00,
      billingPeriod: BillingPeriod.MONTHLY,
      minQuantity: 1,
      startDate: today,
      endDate: thirtyDaysLater,
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      isActive: true,
    },
  });

  // 4. Discounts
  // Bulk 10+ seats 10% (PRODUCT scope, minQuantity 10, usageLimit 50)
  await prisma.discount.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Bulk 10+ seats 10%',
      code: 'BULK10',
      type: AmountType.PERCENT,
      value: 10.00,
      scope: DiscountScope.PRODUCT,
      minQuantity: 10,
      usageLimit: 50,
      startDate: new Date('2024-01-01'),
      isActive: true,
      products: {
        connect: [{ id: crm.id }],
      },
    },
  });

  // Flat 500 off yearly (SUBSCRIPTION scope, minPurchase 5000)
  await prisma.discount.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Flat 500 off yearly',
      code: 'FLAT500',
      type: AmountType.FIXED,
      value: 500.00,
      scope: DiscountScope.SUBSCRIPTION,
      minPurchase: 5000.00,
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
  });

  console.log('Seeded Catalog successfully!');
}
