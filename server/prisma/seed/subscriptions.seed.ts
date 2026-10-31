import {
  PrismaClient,
  Prisma,
  Role,
  SubscriptionStatus,
  BillingPeriod,
  PaymentTerms,
  ProductType,
} from "@prisma/client";

const defaultPrisma = new PrismaClient();

/**
 * Helper to add days to a date.
 */
function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Main subscription seed function.
 * Seeds:
 * 1. Quotation Templates ("Starter Monthly", "Enterprise Yearly 25 seats")
 * 2. Approximately 15 Subscriptions across all statuses (DRAFT, QUOTATION, CONFIRMED, ACTIVE, PAUSED, CLOSED)
 * 3. Subscription Lines with realistic products, variants and taxes
 * 4. SubscriptionEvent records for audit history
 *
 * Idempotent: Can be run repeatedly without creating duplicate records.
 */
export async function seedSubscriptions(prisma: PrismaClient = defaultPrisma) {
  console.log("🌱 [seed:subscriptions] Starting Member 3 subscription seeding...");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Resolve or provide fallback customers
  let customers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    orderBy: { id: "asc" },
  });

  if (customers.length === 0) {
    console.log("ℹ️  [seed:subscriptions] No existing customers found. Creating demo customer accounts...");
    const demoCustomers = [
      {
        email: "acme.corp@example.com",
        name: "Acme Corporation",
        company: "Acme Corp Ltd",
        phone: "+1-555-0101",
        address: "100 Innovation Way, Suite 400, San Francisco, CA",
        role: Role.CUSTOMER,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345",
      },
      {
        email: "globex.tech@example.com",
        name: "Globex Industries",
        company: "Globex Tech",
        phone: "+1-555-0102",
        address: "742 Evergreen Terrace, Springfield, OR",
        role: Role.CUSTOMER,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345",
      },
      {
        email: "initech.solutions@example.com",
        name: "Initech Solutions",
        company: "Initech Software",
        phone: "+1-555-0103",
        address: "4120 Freemont Blvd, Austin, TX",
        role: Role.CUSTOMER,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345",
      },
      {
        email: "wayne.enterprises@example.com",
        name: "Wayne Enterprises",
        company: "Wayne Corp",
        phone: "+1-555-0104",
        address: "1007 Mountain Drive, Gotham, NJ",
        role: Role.CUSTOMER,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345",
      },
    ];

    for (const c of demoCustomers) {
      const created = await prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: c,
      });
      customers.push(created);
    }
  }

  // 2. Resolve or provide fallback staff user (salesperson)
  let staff = await prisma.user.findFirst({
    where: { role: { in: [Role.ADMIN, Role.INTERNAL] } },
    orderBy: { id: "asc" },
  });

  if (!staff) {
    staff = await prisma.user.upsert({
      where: { email: "sales@brightloop.io" },
      update: {},
      create: {
        email: "sales@brightloop.io",
        name: "Sales Representative",
        company: "Brightloop Software",
        role: Role.INTERNAL,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345",
      },
    });
  }

  // 3. Resolve or provide fallback plans
  let starterPlan = await prisma.plan.findFirst({
    where: { name: { contains: "Starter", mode: "insensitive" } },
  });
  if (!starterPlan) {
    starterPlan = await prisma.plan.create({
      data: {
        name: "Starter Monthly",
        price: new Prisma.Decimal("49.00"),
        billingPeriod: BillingPeriod.MONTHLY,
        minQuantity: 1,
        startDate: addDays(today, -180),
        pausable: true,
        closable: true,
        renewable: true,
        autoClose: false,
        isActive: true,
      },
    });
  }

  let enterprisePlan = await prisma.plan.findFirst({
    where: { name: { contains: "Enterprise", mode: "insensitive" } },
  });
  if (!enterprisePlan) {
    enterprisePlan = await prisma.plan.create({
      data: {
        name: "Enterprise Yearly",
        price: new Prisma.Decimal("499.00"),
        billingPeriod: BillingPeriod.YEARLY,
        minQuantity: 5,
        startDate: addDays(today, -365),
        pausable: true,
        closable: true,
        renewable: true,
        autoClose: true,
        isActive: true,
      },
    });
  }

  // 4. Resolve or provide fallback products
  let products = await prisma.product.findMany({
    include: { variants: true, taxes: true },
    orderBy: { id: "asc" },
  });

  if (products.length === 0) {
    console.log("ℹ️  [seed:subscriptions] No existing products found. Creating demo products...");
    const coreProduct = await prisma.product.create({
      data: {
        name: "Brightloop Cloud Platform",
        type: ProductType.SERVICE,
        salesPrice: new Prisma.Decimal("49.00"),
        costPrice: new Prisma.Decimal("10.00"),
        notes: "Primary subscription access seat",
        isActive: true,
      },
      include: { variants: true, taxes: true },
    });

    const seatAddon = await prisma.product.create({
      data: {
        name: "Additional User Seat",
        type: ProductType.SERVICE,
        salesPrice: new Prisma.Decimal("15.00"),
        costPrice: new Prisma.Decimal("2.00"),
        notes: "Per-seat license expansion",
        isActive: true,
      },
      include: { variants: true, taxes: true },
    });

    products = [coreProduct, seatAddon];
  }

  const primaryProduct = products[0];
  const secondaryProduct = products.length > 1 ? products[1] : products[0];

  // 5. Seed Quotation Templates
  console.log("📋 [seed:subscriptions] Seeding Quotation Templates...");

  let templateStarter = await prisma.quotationTemplate.findFirst({
    where: { name: "Starter Monthly" },
  });

  if (!templateStarter) {
    templateStarter = await prisma.quotationTemplate.create({
      data: {
        name: "Starter Monthly",
        validityDays: 30,
        planId: starterPlan.id,
        notes: "Standard turnkey starter template with 1 core license",
        lines: {
          create: [
            {
              productId: primaryProduct.id,
              variantId: primaryProduct.variants[0]?.id ?? null,
              quantity: 1,
            },
          ],
        },
      },
    });
    console.log(`   ✓ Created Quotation Template: ${templateStarter.name}`);
  } else {
    console.log(`   ✓ Quotation Template already exists: ${templateStarter.name}`);
  }

  let templateEnterprise = await prisma.quotationTemplate.findFirst({
    where: { name: "Enterprise Yearly 25 seats" },
  });

  if (!templateEnterprise) {
    templateEnterprise = await prisma.quotationTemplate.create({
      data: {
        name: "Enterprise Yearly 25 seats",
        validityDays: 15,
        planId: enterprisePlan.id,
        notes: "Enterprise tier with volume deployment package (25 user seats)",
        lines: {
          create: [
            {
              productId: primaryProduct.id,
              variantId: primaryProduct.variants[0]?.id ?? null,
              quantity: 25,
            },
            {
              productId: secondaryProduct.id,
              variantId: null,
              quantity: 10,
            },
          ],
        },
      },
    });
    console.log(`   ✓ Created Quotation Template: ${templateEnterprise.name}`);
  } else {
    console.log(`   ✓ Quotation Template already exists: ${templateEnterprise.name}`);
  }

  // 6. Seed Subscriptions (~15 Subscriptions across all statuses)
  console.log("📦 [seed:subscriptions] Seeding Subscriptions across lifecycle states...");

  interface SubscriptionSeedSpec {
    number: string;
    customerIndex: number;
    planId: number;
    templateId?: number;
    status: SubscriptionStatus;
    startDate: Date;
    expiryDate?: Date;
    quoteValidUntil?: Date;
    nextInvoiceDate?: Date;
    paymentTerms: PaymentTerms;
    notes: string;
    lines: {
      productId: number;
      variantId?: number | null;
      description: string;
      quantity: number;
      unitPrice: string;
    }[];
    events: {
      fromStatus: SubscriptionStatus | null;
      toStatus: SubscriptionStatus;
      note: string;
      daysOffset: number;
    }[];
  }

  const p1Price = primaryProduct.salesPrice.toString();
  const p2Price = secondaryProduct.salesPrice.toString();

  const subscriptionSpecs: SubscriptionSeedSpec[] = [
    // 1. DRAFT
    {
      number: "SUB-00001",
      customerIndex: 0,
      planId: starterPlan.id,
      templateId: templateStarter.id,
      status: SubscriptionStatus.DRAFT,
      startDate: today,
      paymentTerms: PaymentTerms.IMMEDIATE,
      notes: "Draft subscription created for onboarding initial assessment",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: primaryProduct.variants[0]?.id ?? null,
          description: `${primaryProduct.name} - Standard Base`,
          quantity: 1,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Subscription created in draft status",
          daysOffset: 0,
        },
      ],
    },
    // 2. DRAFT
    {
      number: "SUB-00002",
      customerIndex: 1,
      planId: enterprisePlan.id,
      templateId: templateEnterprise.id,
      status: SubscriptionStatus.DRAFT,
      startDate: addDays(today, 5),
      paymentTerms: PaymentTerms.NET_15,
      notes: "Draft custom proposal awaiting sales manager sign-off",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: `${primaryProduct.name} (Enterprise Deployment)`,
          quantity: 10,
          unitPrice: p1Price,
        },
        {
          productId: secondaryProduct.id,
          variantId: null,
          description: `${secondaryProduct.name} (Team Pack)`,
          quantity: 5,
          unitPrice: p2Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Subscription drafted for Globex expansion",
          daysOffset: -1,
        },
      ],
    },
    // 3. QUOTATION (Active & Valid)
    {
      number: "SUB-00003",
      customerIndex: 2,
      planId: starterPlan.id,
      templateId: templateStarter.id,
      status: SubscriptionStatus.QUOTATION,
      startDate: addDays(today, 2),
      quoteValidUntil: addDays(today, 28),
      paymentTerms: PaymentTerms.IMMEDIATE,
      notes: "Formal quotation sent to Initech procurement team",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 2,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -2,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation sent (valid for 30 days)",
          daysOffset: -2,
        },
      ],
    },
    // 4. QUOTATION (Valid from template)
    {
      number: "SUB-00004",
      customerIndex: 3,
      planId: enterprisePlan.id,
      templateId: templateEnterprise.id,
      status: SubscriptionStatus.QUOTATION,
      startDate: addDays(today, 7),
      quoteValidUntil: addDays(today, 14),
      paymentTerms: PaymentTerms.NET_30,
      notes: "Enterprise proposal sent to Wayne Enterprises with 25-seat discount",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: `${primaryProduct.name} - Enterprise Volume`,
          quantity: 25,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created from Enterprise Yearly template",
          daysOffset: -1,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation sent with 14-day validity",
          daysOffset: -1,
        },
      ],
    },
    // 5. QUOTATION (Expired quotation for testing lifecycle guardrails)
    {
      number: "SUB-00005",
      customerIndex: 0,
      planId: starterPlan.id,
      status: SubscriptionStatus.QUOTATION,
      startDate: addDays(today, -40),
      quoteValidUntil: addDays(today, -10),
      paymentTerms: PaymentTerms.IMMEDIATE,
      notes: "Expired quotation - requires revised quote before confirmation",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 1,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Initial proposal draft",
          daysOffset: -45,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation dispatched to client",
          daysOffset: -40,
        },
      ],
    },
    // 6. CONFIRMED
    {
      number: "SUB-00006",
      customerIndex: 1,
      planId: starterPlan.id,
      status: SubscriptionStatus.CONFIRMED,
      startDate: addDays(today, 1),
      paymentTerms: PaymentTerms.NET_7,
      notes: "Customer confirmed quotation, scheduled for activation tomorrow",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 3,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -5,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation sent",
          daysOffset: -4,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Customer accepted quotation terms online",
          daysOffset: -1,
        },
      ],
    },
    // 7. CONFIRMED
    {
      number: "SUB-00007",
      customerIndex: 2,
      planId: enterprisePlan.id,
      status: SubscriptionStatus.CONFIRMED,
      startDate: addDays(today, 3),
      paymentTerms: PaymentTerms.NET_15,
      notes: "Confirmed order pending infrastructure provisioning",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: `${primaryProduct.name} Enterprise Tier`,
          quantity: 15,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Initial scope drafted",
          daysOffset: -7,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Formal quote issued",
          daysOffset: -5,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Quotation confirmed by staff",
          daysOffset: -2,
        },
      ],
    },
    // 8. ACTIVE (nextInvoiceDate = today, critical for M4 billing demo)
    {
      number: "SUB-00008",
      customerIndex: 0,
      planId: starterPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: addDays(today, -30),
      expiryDate: addDays(today, 335),
      nextInvoiceDate: today,
      paymentTerms: PaymentTerms.IMMEDIATE,
      notes: "Active subscription ready for recurring billing cycle run today",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: `${primaryProduct.name} - Monthly Service`,
          quantity: 2,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -35,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation issued",
          daysOffset: -32,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Quotation approved",
          daysOffset: -30,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Subscription activated, nextInvoiceDate initialized",
          daysOffset: -30,
        },
      ],
    },
    // 9. ACTIVE (nextInvoiceDate is in the past by 2 days, overdue billing for M4)
    {
      number: "SUB-00009",
      customerIndex: 3,
      planId: enterprisePlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: addDays(today, -60),
      expiryDate: addDays(today, 305),
      nextInvoiceDate: addDays(today, -2),
      paymentTerms: PaymentTerms.NET_15,
      notes: "Active enterprise contract with overdue invoice date for batch billing demonstration",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: `${primaryProduct.name} - Enterprise Site License`,
          quantity: 20,
          unitPrice: p1Price,
        },
        {
          productId: secondaryProduct.id,
          variantId: null,
          description: `${secondaryProduct.name} - Premium Support`,
          quantity: 5,
          unitPrice: p2Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Enterprise draft created",
          daysOffset: -65,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation approved by board",
          daysOffset: -62,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Contract counter-signed",
          daysOffset: -60,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Subscription activated and services online",
          daysOffset: -60,
        },
      ],
    },
    // 10. ACTIVE (Future billing cycle)
    {
      number: "SUB-00010",
      customerIndex: 1,
      planId: starterPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: addDays(today, -10),
      expiryDate: addDays(today, 355),
      nextInvoiceDate: addDays(today, 20),
      paymentTerms: PaymentTerms.NET_7,
      notes: "Healthy active monthly subscription with invoice scheduled in 20 days",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 1,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -12,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation confirmed directly",
          daysOffset: -10,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Confirmed",
          daysOffset: -10,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Activated",
          daysOffset: -10,
        },
      ],
    },
    // 11. ACTIVE (Expiring soon with autoClose enabled)
    {
      number: "SUB-00011",
      customerIndex: 2,
      planId: enterprisePlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: addDays(today, -355),
      expiryDate: addDays(today, 10),
      nextInvoiceDate: addDays(today, 10),
      paymentTerms: PaymentTerms.NET_30,
      notes: "Active subscription nearing expiration with autoClose flag enabled",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 5,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -360,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation created",
          daysOffset: -358,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Confirmed",
          daysOffset: -355,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Subscription activated for 1-year contract",
          daysOffset: -355,
        },
      ],
    },
    // 12. PAUSED
    {
      number: "SUB-00012",
      customerIndex: 0,
      planId: starterPlan.id,
      status: SubscriptionStatus.PAUSED,
      startDate: addDays(today, -90),
      nextInvoiceDate: addDays(today, 15),
      paymentTerms: PaymentTerms.IMMEDIATE,
      notes: "Customer temporarily paused account for winter season",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 2,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -95,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quoted",
          daysOffset: -92,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Confirmed",
          daysOffset: -90,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Subscription activated",
          daysOffset: -90,
        },
        {
          fromStatus: SubscriptionStatus.ACTIVE,
          toStatus: SubscriptionStatus.PAUSED,
          note: "Subscription paused at customer request via portal",
          daysOffset: -15,
        },
      ],
    },
    // 13. PAUSED
    {
      number: "SUB-00013",
      customerIndex: 3,
      planId: enterprisePlan.id,
      status: SubscriptionStatus.PAUSED,
      startDate: addDays(today, -120),
      nextInvoiceDate: addDays(today, 30),
      paymentTerms: PaymentTerms.NET_15,
      notes: "Paused during internal enterprise security audit",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 12,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft",
          daysOffset: -125,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quoted",
          daysOffset: -122,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Confirmed",
          daysOffset: -120,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Activated",
          daysOffset: -120,
        },
        {
          fromStatus: SubscriptionStatus.ACTIVE,
          toStatus: SubscriptionStatus.PAUSED,
          note: "Account paused pending security audit completion",
          daysOffset: -20,
        },
      ],
    },
    // 14. CLOSED (Expired and auto-closed)
    {
      number: "SUB-00014",
      customerIndex: 1,
      planId: enterprisePlan.id,
      status: SubscriptionStatus.CLOSED,
      startDate: addDays(today, -400),
      expiryDate: addDays(today, -35),
      paymentTerms: PaymentTerms.NET_30,
      notes: "Automatically closed because subscription expired",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: `${primaryProduct.name} (Legacy Plan)`,
          quantity: 5,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -405,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quoted",
          daysOffset: -402,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Confirmed",
          daysOffset: -400,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Subscription activated",
          daysOffset: -400,
        },
        {
          fromStatus: SubscriptionStatus.ACTIVE,
          toStatus: SubscriptionStatus.CLOSED,
          note: "Automatically closed because subscription expired",
          daysOffset: -35,
        },
      ],
    },
    // 15. CLOSED (Cancelled with reason)
    {
      number: "SUB-00015",
      customerIndex: 2,
      planId: starterPlan.id,
      status: SubscriptionStatus.CLOSED,
      startDate: addDays(today, -75),
      expiryDate: addDays(today, -15),
      paymentTerms: PaymentTerms.IMMEDIATE,
      notes: "Closed: Customer consolidated software stack into single corporate suite",
      lines: [
        {
          productId: primaryProduct.id,
          variantId: null,
          description: primaryProduct.name,
          quantity: 1,
          unitPrice: p1Price,
        },
      ],
      events: [
        {
          fromStatus: null,
          toStatus: SubscriptionStatus.DRAFT,
          note: "Draft created",
          daysOffset: -80,
        },
        {
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.QUOTATION,
          note: "Quotation sent",
          daysOffset: -78,
        },
        {
          fromStatus: SubscriptionStatus.QUOTATION,
          toStatus: SubscriptionStatus.CONFIRMED,
          note: "Confirmed",
          daysOffset: -75,
        },
        {
          fromStatus: SubscriptionStatus.CONFIRMED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Activated",
          daysOffset: -75,
        },
        {
          fromStatus: SubscriptionStatus.ACTIVE,
          toStatus: SubscriptionStatus.CLOSED,
          note: "Customer cancelled subscription: Migrated to central enterprise toolchain",
          daysOffset: -15,
        },
      ],
    },
  ];

  for (const spec of subscriptionSpecs) {
    const existing = await prisma.subscription.findUnique({
      where: { number: spec.number },
    });

    if (existing) {
      console.log(`   ✓ Subscription ${spec.number} already exists, skipping.`);
      continue;
    }

    const assignedCustomer = customers[spec.customerIndex % customers.length];

    await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          number: spec.number,
          customerId: assignedCustomer.id,
          salespersonId: staff.id,
          planId: spec.planId,
          templateId: spec.templateId ?? null,
          status: spec.status,
          startDate: spec.startDate,
          expiryDate: spec.expiryDate ?? null,
          quoteValidUntil: spec.quoteValidUntil ?? null,
          nextInvoiceDate: spec.nextInvoiceDate ?? null,
          paymentTerms: spec.paymentTerms,
          notes: spec.notes,
          lines: {
            create: spec.lines.map((line) => {
              const unitPriceNum = parseFloat(line.unitPrice);
              const amountNum = unitPriceNum * line.quantity;
              return {
                productId: line.productId,
                variantId: line.variantId ?? null,
                description: line.description,
                quantity: line.quantity,
                unitPrice: new Prisma.Decimal(unitPriceNum.toFixed(2)),
                amount: new Prisma.Decimal(amountNum.toFixed(2)),
              };
            }),
          },
        },
      });

      // Create realistic chronological events for the subscription
      for (const ev of spec.events) {
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: sub.id,
            fromStatus: ev.fromStatus,
            toStatus: ev.toStatus,
            note: ev.note,
            userId: staff.id,
            createdAt: addDays(today, ev.daysOffset),
          },
        });
      }
    });

    console.log(
      `   ✓ Seeded ${spec.number} [${spec.status}] for customer "${assignedCustomer.name}"`
    );
  }

  console.log("✅ [seed:subscriptions] Member 3 subscription seeding complete!");
}

// Allow direct execution via: npx tsx prisma/seed/subscriptions.seed.ts
if (require.main === module) {
  seedSubscriptions()
    .catch((e) => {
      console.error("❌ [seed:subscriptions] Error during seeding:", e);
      process.exit(1);
    })
    .finally(async () => {
      await defaultPrisma.$disconnect();
    });
}

