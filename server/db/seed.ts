import bcrypt from 'bcryptjs';
import { db } from './database';

export async function seedDatabase(): Promise<void> {
  await db.init();

  // 1. Check if already seeded
  if (!db.isEmpty('roles') && !db.isEmpty('permissions')) {
    return;
  }

  console.log('Seeding database with dynamic data...');

  // -------------------------------------------------------------
  // 2. PERMISSIONS MATRIX (Module -> Resource -> Action)
  // -------------------------------------------------------------
  const permissionsList = [
    // Dashboard
    { id: 'perm_dash_view', module: 'Dashboard', resource: 'Overview', action: 'View', code: 'dashboard:overview:view', description: 'View main solar generation dashboard & KPI stats' },
    { id: 'perm_dash_export', module: 'Dashboard', resource: 'Reports', action: 'Export', code: 'dashboard:reports:export', description: 'Export dashboard telemetry and generation reports' },

    // CRM & Leads
    { id: 'perm_crm_view', module: 'CRM', resource: 'Leads', action: 'View', code: 'crm:leads:view', description: 'View CRM leads & customer pipeline' },
    { id: 'perm_crm_create', module: 'CRM', resource: 'Leads', action: 'Create', code: 'crm:leads:create', description: 'Create and ingest new solar inquiries' },
    { id: 'perm_crm_update', module: 'CRM', resource: 'Leads', action: 'Update', code: 'crm:leads:update', description: 'Update lead details, stages, and notes' },
    { id: 'perm_crm_delete', module: 'CRM', resource: 'Leads', action: 'Delete', code: 'crm:leads:delete', description: 'Archive or delete leads from CRM' },

    // Customers
    { id: 'perm_cust_view', module: 'Customers', resource: 'Directory', action: 'View', code: 'customers:directory:view', description: 'View customer accounts and installed capacity' },
    { id: 'perm_cust_create', module: 'Customers', resource: 'Directory', action: 'Create', code: 'customers:directory:create', description: 'Register new customer accounts' },
    { id: 'perm_cust_update', module: 'Customers', resource: 'Directory', action: 'Update', code: 'customers:directory:update', description: 'Update customer profiles and address info' },
    { id: 'perm_cust_delete', module: 'Customers', resource: 'Directory', action: 'Delete', code: 'customers:directory:delete', description: 'Delete or archive customer profiles' },

    // Solar Design & 3D Rooftop
    { id: 'perm_design_view', module: 'Design', resource: 'CAD', action: 'View', code: 'design:cad:view', description: 'View 3D rooftop solar designs and raytracing' },
    { id: 'perm_design_create', module: 'Design', resource: 'CAD', action: 'Create', code: 'design:cad:create', description: 'Generate automated 3D panel layout & shading analysis' },
    { id: 'perm_design_update', module: 'Design', resource: 'CAD', action: 'Update', code: 'design:cad:update', description: 'Edit solar module tilt, azimuth and string sizing' },

    // Quotes & Invoices
    { id: 'perm_quote_view', module: 'Billing', resource: 'Quotation', action: 'View', code: 'billing:quote:view', description: 'View solar quotations and customer proposals' },
    { id: 'perm_quote_create', module: 'Billing', resource: 'Quotation', action: 'Create', code: 'billing:quote:create', description: 'Generate new quotation and single-line diagrams' },
    { id: 'perm_quote_update', module: 'Billing', resource: 'Quotation', action: 'Update', code: 'billing:quote:update', description: 'Modify pricing, discounts, and system BOM' },
    { id: 'perm_quote_delete', module: 'Billing', resource: 'Quotation', action: 'Delete', code: 'billing:quote:delete', description: 'Cancel or delete quotation drafts' },
    { id: 'perm_invoice_manage', module: 'Billing', resource: 'TaxInvoice', action: 'Manage', code: 'billing:invoice:manage', description: 'Generate and disburse GST tax invoices' },

    // Projects & Installations
    { id: 'perm_proj_view', module: 'Projects', resource: 'Tracker', action: 'View', code: 'projects:tracker:view', description: 'View rooftop installation progress & stages' },
    { id: 'perm_proj_create', module: 'Projects', resource: 'Tracker', action: 'Create', code: 'projects:tracker:create', description: 'Commission new project from approved lead' },
    { id: 'perm_proj_update', module: 'Projects', resource: 'Tracker', action: 'Update', code: 'projects:tracker:update', description: 'Update milestone dates, assign technicians' },
    { id: 'perm_proj_delete', module: 'Projects', resource: 'Tracker', action: 'Delete', code: 'projects:tracker:delete', description: 'Delete or cancel ongoing projects' },
    { id: 'perm_proj_photos', module: 'Projects', resource: 'Photos', action: 'Upload', code: 'projects:photos:upload', description: 'Upload geotagged field survey & installation photos' },

    // Inventory & BOS Stock
    { id: 'perm_inv_view', module: 'Inventory', resource: 'Stock', action: 'View', code: 'inventory:stock:view', description: 'View warehouse panels, inverters & balance of system stock' },
    { id: 'perm_inv_create', module: 'Inventory', resource: 'Stock', action: 'Create', code: 'inventory:stock:create', description: 'Add new items, serial numbers, and warranty records' },
    { id: 'perm_inv_update', module: 'Inventory', resource: 'Stock', action: 'Update', code: 'inventory:stock:update', description: 'Update stock levels, reserved quantities, and unit pricing' },
    { id: 'perm_inv_delete', module: 'Inventory', resource: 'Stock', action: 'Delete', code: 'inventory:stock:delete', description: 'Remove or scrap damaged hardware components' },

    // Procurement & Purchase Orders
    { id: 'perm_proc_view', module: 'Procurement', resource: 'PO', action: 'View', code: 'procurement:po:view', description: 'View tier-1 supplier directory and purchase orders' },
    { id: 'perm_proc_create', module: 'Procurement', resource: 'PO', action: 'Create', code: 'procurement:po:create', description: 'Draft and dispatch component purchase orders' },
    { id: 'perm_proc_update', module: 'Procurement', resource: 'PO', action: 'Update', code: 'procurement:po:update', description: 'Update delivery schedules and payment milestones' },

    // Finance & Subsidy
    { id: 'perm_fin_view', module: 'Finance', resource: 'Ledger', action: 'View', code: 'finance:ledger:view', description: 'View financial balance, profit/loss, and project cashflow' },
    { id: 'perm_fin_create', module: 'Finance', resource: 'Ledger', action: 'Create', code: 'finance:ledger:create', description: 'Record customer payments, advances, and expenses' },
    { id: 'perm_sub_manage', module: 'Subsidy', resource: 'DISCOM', action: 'Manage', code: 'subsidy:discom:manage', description: 'Process PM-Surya Ghar national portal subsidy files' },

    // Roles & Access Control
    { id: 'perm_roles_view', module: 'AccessControl', resource: 'Roles', action: 'View', code: 'roles:role:view', description: 'View defined organizational roles and assigned users' },
    { id: 'perm_roles_create', module: 'AccessControl', resource: 'Roles', action: 'Create', code: 'roles:role:create', description: 'Create dynamic custom roles without code changes' },
    { id: 'perm_roles_update', module: 'AccessControl', resource: 'Roles', action: 'Update', code: 'roles:role:update', description: 'Modify role definitions and assign/remove permissions' },
    { id: 'perm_roles_delete', module: 'AccessControl', resource: 'Roles', action: 'Delete', code: 'roles:role:delete', description: 'Deactivate or delete custom roles' },

    // Subscription & Plans (Super Admin)
    { id: 'perm_sub_plans_view', module: 'Subscription', resource: 'Plans', action: 'View', code: 'subscription:plans:view', description: 'View active SaaS subscription tiers and pricing' },
    { id: 'perm_sub_plans_manage', module: 'Subscription', resource: 'Plans', action: 'Manage', code: 'subscription:plans:manage', description: 'Create, edit, price, and deactivate subscription plans' },
    { id: 'perm_sub_coupons_manage', module: 'Subscription', resource: 'Coupons', action: 'Manage', code: 'subscription:coupons:manage', description: 'Create and manage dynamic discount coupons' },
    { id: 'perm_sub_accounts_manage', module: 'Subscription', resource: 'Accounts', action: 'Manage', code: 'subscription:accounts:manage', description: 'Activate, renew, and extend subscriber accounts' },

    // Website Customization (Subscriber & Super Admin)
    { id: 'perm_web_view', module: 'Website', resource: 'Config', action: 'View', code: 'website:config:view', description: 'View tenant website styling and branding settings' },
    { id: 'perm_web_customize', module: 'Website', resource: 'Config', action: 'Update', code: 'website:config:update', description: 'Customize live subscriber website theme, colors, logo & content' },
    { id: 'perm_web_global_manage', module: 'Website', resource: 'Global', action: 'Manage', code: 'website:global:manage', description: 'Super Admin: override subscriber websites & manage global defaults' },

    // Master Settings & Dropdowns
    { id: 'perm_dropdown_manage', module: 'Settings', resource: 'Dropdowns', action: 'Manage', code: 'settings:dropdowns:manage', description: 'Manage dynamic dropdown categories and master values' }
  ];

  for (const perm of permissionsList) {
    db.insert('permissions', perm);
  }

  const allPermCodes = permissionsList.map(p => p.code);

  // -------------------------------------------------------------
  // 3. ORGANIZATIONS (Tenants)
  // -------------------------------------------------------------
  const orgSuperAdmin = db.insert('organizations', {
    id: 'org_super_admin',
    name: 'MetaGreen Global HQ',
    slug: 'metagreen',
    planId: 'plan-enterprise',
    status: 'active',
    isSuperAdminOrg: true,
  });

  const orgVikramSolar = db.insert('organizations', {
    id: 'org_vikram_solar',
    name: 'Vikram Solar EPC Pvt. Ltd.',
    slug: 'vikram-solar',
    planId: 'plan-growth',
    status: 'active',
    hasWebsiteSubscription: true,
    websiteSubscriptionPrice: 999,
  });

  const orgSunpower = db.insert('organizations', {
    id: 'org_sunpower',
    name: 'SunPower Certified Installers',
    slug: 'sunpower',
    planId: 'plan-pro-fleet',
    status: 'active',
    hasWebsiteSubscription: true,
    websiteSubscriptionPrice: 999,
  });

  // -------------------------------------------------------------
  // 4. DYNAMIC ROLES (Seeded, but editable/extensible dynamically)
  // -------------------------------------------------------------
  const superAdminRole = db.insert('roles', {
    id: 'role_super_admin',
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Universal platform controller with unrestricted access across all tenants, plans, and system settings',
    isSystem: true,
    status: 'active',
    permissions: allPermCodes,
  });

  const vendorAdminRole = db.insert('roles', {
    id: 'role_vendor_admin',
    name: 'Vendor Admin',
    code: 'VENDOR_ADMIN',
    description: 'EPC organization executive with full management over their own leads, inventory, projects, staff, and website',
    isSystem: false,
    status: 'active',
    permissions: [
      'dashboard:overview:view',
      'dashboard:reports:export',
      'crm:leads:view', 'crm:leads:create', 'crm:leads:update', 'crm:leads:delete',
      'customers:directory:view', 'customers:directory:create', 'customers:directory:update',
      'design:cad:view', 'design:cad:create', 'design:cad:update',
      'billing:quote:view', 'billing:quote:create', 'billing:quote:update', 'billing:invoice:manage',
      'projects:tracker:view', 'projects:tracker:create', 'projects:tracker:update', 'projects:photos:upload',
      'inventory:stock:view', 'inventory:stock:create', 'inventory:stock:update',
      'procurement:po:view', 'procurement:po:create', 'procurement:po:update',
      'finance:ledger:view', 'finance:ledger:create', 'subsidy:discom:manage',
      'roles:role:view',
      'subscription:plans:view',
      'website:config:view', 'website:config:update',
      'settings:dropdowns:manage'
    ],
  });

  const vendorEmpRole = db.insert('roles', {
    id: 'role_vendor_emp',
    name: 'Vendor Employee',
    code: 'VENDOR_EMPLOYEE',
    description: 'Operational sales rep or warehouse coordinator with scoped CRM and inventory permissions',
    isSystem: false,
    status: 'active',
    permissions: [
      'dashboard:overview:view',
      'crm:leads:view', 'crm:leads:create', 'crm:leads:update',
      'customers:directory:view',
      'design:cad:view',
      'billing:quote:view', 'billing:quote:create',
      'projects:tracker:view',
      'inventory:stock:view', 'inventory:stock:update',
    ],
  });

  const installerRole = db.insert('roles', {
    id: 'role_installer',
    name: 'Solar Installer',
    code: 'INSTALLER',
    description: 'Field engineer focused on roof surveys, mounting tasks, and photo upload for assigned projects',
    isSystem: false,
    status: 'active',
    permissions: [
      'dashboard:overview:view',
      'crm:leads:view',
      'projects:tracker:view', 'projects:tracker:update', 'projects:photos:upload',
      'inventory:stock:view',
      'website:config:view',
    ],
  });

  const salesRole = db.insert('roles', {
    id: 'role_sales',
    name: 'Sales Executive',
    code: 'SALES_EXEC',
    description: 'Solar business development representative focused on lead pipelines and sales quotations',
    isSystem: false,
    status: 'active',
    permissions: [
      'dashboard:overview:view',
      'crm:leads:view', 'crm:leads:create', 'crm:leads:update',
      'customers:directory:view', 'customers:directory:create',
      'billing:quote:view', 'billing:quote:create',
      'projects:tracker:view',
    ],
  });

  const financeRole = db.insert('roles', {
    id: 'role_finance',
    name: 'Finance Manager',
    code: 'FINANCE_MGR',
    description: 'Accountant responsible for invoices, expense receipts, and subsidy bank reconciliation',
    isSystem: false,
    status: 'active',
    permissions: [
      'dashboard:overview:view',
      'customers:directory:view',
      'billing:quote:view', 'billing:invoice:manage',
      'finance:ledger:view', 'finance:ledger:create',
      'subsidy:discom:manage',
    ],
  });

  // -------------------------------------------------------------
  // 5. USERS (With secure bcrypt password hashes)
  // -------------------------------------------------------------
  const salt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('demo1234', salt);

  db.insert('users', {
    id: 'usr_super_admin',
    email: 'admin@solar.com',
    passwordHash: defaultHash,
    name: 'Global Super Admin',
    roleId: superAdminRole.id,
    roleName: superAdminRole.name,
    organizationId: orgSuperAdmin.id,
    organizationName: orgSuperAdmin.name,
    isSuperAdmin: true,
    status: 'Active',
    companyName: 'MetaGreen Global HQ',
  });

  db.insert('users', {
    id: 'usr_vikram_vendor',
    email: 'vendor@vikramsolar.com',
    passwordHash: defaultHash,
    name: 'Vikram Solar Admin',
    roleId: vendorAdminRole.id,
    roleName: vendorAdminRole.name,
    organizationId: orgVikramSolar.id,
    organizationName: orgVikramSolar.name,
    isSuperAdmin: false,
    status: 'Active',
    companyName: 'Vikram Solar EPC Pvt. Ltd.',
  });

  db.insert('users', {
    id: 'usr_vikram_emp',
    email: 'emp@vikramsolar.com',
    passwordHash: defaultHash,
    name: 'Amit Kumar (Sales & Stock)',
    roleId: vendorEmpRole.id,
    roleName: vendorEmpRole.name,
    organizationId: orgVikramSolar.id,
    organizationName: orgVikramSolar.name,
    isSuperAdmin: false,
    status: 'Active',
    companyName: 'Vikram Solar EPC Pvt. Ltd.',
  });

  db.insert('users', {
    id: 'usr_sunpower_installer',
    email: 'installer@solar.com',
    passwordHash: defaultHash,
    name: 'Rohan Sharma (Lead Field Installer)',
    roleId: installerRole.id,
    roleName: installerRole.name,
    organizationId: orgSunpower.id,
    organizationName: orgSunpower.name,
    isSuperAdmin: false,
    status: 'Active',
    companyName: 'SunPower Certified Installers',
  });

  // -------------------------------------------------------------
  // 6. DYNAMIC SUBSCRIPTION PLANS
  // -------------------------------------------------------------
  db.insert('subscription_plans', {
    id: 'plan-starter',
    name: 'Starter Solar Vendor',
    userLimit: 3,
    storageGBLimit: 10,
    priceMonthly: 4999,
    priceAnnual: 47990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    websiteCustomizationTier: 'basic', // basic theme/contact info only
    features: [
      'Up to 3 Organization Users',
      '10 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Purchase Orders & Auto-Inventory',
      'GST Tax Invoice Generator',
      'Basic Website Branding Customization',
      'Standard Support'
    ],
  });

  db.insert('subscription_plans', {
    id: 'plan-growth',
    name: 'Growth Solar Enterprise',
    userLimit: 10,
    storageGBLimit: 50,
    priceMonthly: 9999,
    priceAnnual: 95990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    websiteCustomizationTier: 'pro', // theme + logo + content
    features: [
      'Up to 10 Organization Users',
      '50 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Auto-Stock Receipt & BOM Generator',
      'Full CRM & Proposal Engine',
      'Pro Website Customization (Colors, Logo, Banners, Texts)',
      'DISCOM PM-Surya Ghar API Gateway',
      '24/7 Priority Support'
    ],
  });

  db.insert('subscription_plans', {
    id: 'plan-pro-fleet',
    name: 'Pro Fleet & Franchise',
    userLimit: 25,
    storageGBLimit: 200,
    priceMonthly: 24999,
    priceAnnual: 239990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    websiteCustomizationTier: 'enterprise', // full website customization + custom domains
    features: [
      'Up to 25 Organization Users',
      '200 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Unlimited PO & Inventory Ingestion',
      'Full Live Website Customization & Domain Binding',
      'Real-time IoT Inverter Modbus Telemetry',
      'Dedicated Account Executive',
      'Multi-Branch Franchise Hierarchy'
    ],
  });

  db.insert('subscription_plans', {
    id: 'plan-enterprise',
    name: 'Annual Enterprise Powerhouse',
    userLimit: 100,
    storageGBLimit: 1000,
    priceMonthly: 49999,
    priceAnnual: 479990,
    billingInterval: 'annual',
    annualDiscountPercentage: 25,
    trialEnabled: true,
    trialDays: 14,
    status: 'active',
    websiteCustomizationTier: 'enterprise',
    features: [
      'Up to 100 Organization Users',
      '1,000 GB Dedicated Cloud Storage',
      '14-Day Free Trial Included',
      'Custom SLA & 99.99% Uptime Guarantee',
      'Full Live Website Customization Suite',
      'White-label Native Android/iOS App Build',
      'Dedicated VIP Technical Architect'
    ],
  });

  // -------------------------------------------------------------
  // 7. SUBSCRIBER-SPECIFIC WEBSITE CONFIGURATIONS
  // -------------------------------------------------------------
  // Global Default Template (Used when no tenant override is requested)
  db.insert('website_configs', {
    id: 'web_global_default',
    organizationId: 'org_super_admin',
    organizationSlug: 'default',
    isGlobalDefault: true,
    theme: {
      primaryColor: '#059669', // Emerald 600
      secondaryColor: '#0F172A', // Slate 900
      accentColor: '#14B8A6', // Teal 500
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      buttonColor: '#059669',
      buttonTextColor: '#FFFFFF',
      headerBgColor: 'rgba(5, 5, 16, 0.85)',
      footerBgColor: '#050510',
    },
    branding: {
      websiteName: 'MetaGreen',
      websiteTitle: 'Next-Gen Clean Energy Operating System',
      tagline: 'Solar EPC Operations, 3D CAD & Automated DISCOM Telemetry',
      logoUrl: '',
      faviconUrl: '',
      bannerImageUrl: '',
    },
    content: {
      heroHeading: 'Clean energy technology built for scale and precision',
      heroSubheading: 'Explore the end-to-end software modules, automation pipelines, and developer APIs powering modern renewable developers and solar EPCs.',
      heroCtaText: 'Schedule Architecture Demo',
      aboutTitle: 'Accelerating the Global Clean Energy Transition',
      aboutText: 'MetaGreen empowers solar installers and developers with unified tools for 3D layout simulation, PM-Surya Ghar subsidy automation, and live IoT fleet telemetry.',
      contactEmail: 'support@metagreen.in',
      contactPhone: '+91 (80) 4567-8900',
      contactAddress: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103, India',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/metagreen',
        twitter: 'https://twitter.com/metagreen',
      },
    },
    featuresAllowed: {
      allowThemeCustomization: true,
      allowLogoCustomization: true,
      allowContentCustomization: true,
      allowFullCustomization: true,
    },
  });

  // Vikram Solar's Subscriber-Specific Configuration (Emerald & Gold)
  db.insert('website_configs', {
    id: 'web_vikram_solar',
    organizationId: 'org_vikram_solar',
    organizationSlug: 'vikram-solar',
    isGlobalDefault: false,
    theme: {
      primaryColor: '#16a34a', // Bright Green
      secondaryColor: '#0c4a6e', // Deep Navy
      accentColor: '#f59e0b', // Solar Gold
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      buttonColor: '#16a34a',
      buttonTextColor: '#ffffff',
      headerBgColor: 'rgba(12, 74, 110, 0.9)',
      footerBgColor: '#082f49',
    },
    branding: {
      websiteName: 'Vikram Solar Solutions',
      websiteTitle: 'Vikram Solar • Turnkey EPC & High-Efficiency Solar Rooftops',
      tagline: 'India’s Leading High-Efficiency Solar Rooftop Partner',
      logoUrl: '',
      faviconUrl: '',
      bannerImageUrl: '',
    },
    content: {
      heroHeading: 'Power Your Industrial Facility With Premium Solar Energy',
      heroSubheading: 'Tier-1 bifacial panels, 25-year performance warranty, and instant DISCOM net-metering subsidy clearance within 14 days.',
      heroCtaText: 'Request Free Roof Audit',
      aboutTitle: 'Over 150 MW of High-Yield Solar Commissioned',
      aboutText: 'Vikram Solar provides turnkey engineering, procurement, and construction for industrial, commercial, and residential clean energy projects.',
      contactEmail: 'contact@vikramsolar.com',
      contactPhone: '+91 98765 43210',
      contactAddress: 'Solar Tower, Sector 5, Salt Lake, Kolkata, India',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/vikram-solar',
      },
    },
    featuresAllowed: {
      allowThemeCustomization: true,
      allowLogoCustomization: true,
      allowContentCustomization: true,
      allowFullCustomization: false,
    },
  });

  // SunPower Installers Subscriber-Specific Configuration (Cyan & Indigo)
  db.insert('website_configs', {
    id: 'web_sunpower',
    organizationId: 'org_sunpower',
    organizationSlug: 'sunpower',
    isGlobalDefault: false,
    theme: {
      primaryColor: '#0284c7', // Sky Blue
      secondaryColor: '#1e1b4b', // Deep Indigo
      accentColor: '#38bdf8', // Cyan
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      buttonColor: '#0284c7',
      buttonTextColor: '#ffffff',
      headerBgColor: 'rgba(30, 27, 75, 0.9)',
      footerBgColor: '#0f172a',
    },
    branding: {
      websiteName: 'SunPower Certified Clean Tech',
      websiteTitle: 'SunPower Installers • Rapid Solar Installation & Fleet Telemetry',
      tagline: 'Certified Solar Engineering & 48-Hour Grid Commissioning',
      logoUrl: '',
      faviconUrl: '',
      bannerImageUrl: '',
    },
    content: {
      heroHeading: 'Fast, Precision Solar Installation With Certified Engineers',
      heroSubheading: 'Smart inverters, micro-inverter arrays, and 24/7 smartphone telemetry monitoring for modern residential homes.',
      heroCtaText: 'Book Survey Engineer',
      aboutTitle: 'Certified Clean Tech Installation Guild',
      aboutText: 'Our accredited engineers deliver zero-leakage rooftop installations conforming to strict MNRE standards.',
      contactEmail: 'service@sunpowerinstallers.com',
      contactPhone: '+91 (80) 9988-7766',
      contactAddress: 'Tech Park, Whitefield, Bengaluru, India',
      socialLinks: {
        twitter: 'https://twitter.com/sunpower',
      },
    },
    featuresAllowed: {
      allowThemeCustomization: true,
      allowLogoCustomization: true,
      allowContentCustomization: true,
      allowFullCustomization: true,
    },
  });

  // -------------------------------------------------------------
  // 8. DYNAMIC NAVIGATION MENUS (Mapped to Permission Codes)
  // -------------------------------------------------------------
  const MENUS = [
    {
      id: 'menu_dashboard',
      title: 'Dashboard',
      view: 'dashboard',
      icon: 'LayoutDashboard',
      order: 1,
      category: 'Overview',
      requiredPermission: 'dashboard:overview:view',
    },
    {
      id: 'menu_crm',
      title: 'Leads (CRM)',
      view: 'crm',
      icon: 'Users',
      order: 2,
      category: 'Sales',
      requiredPermission: 'crm:leads:view',
    },
    {
      id: 'menu_customers',
      title: 'Customers',
      view: 'customers',
      icon: 'UserCheck',
      order: 3,
      category: 'Sales',
      requiredPermission: 'customers:directory:view',
    },
    {
      id: 'menu_design',
      title: '3D Solar Design',
      view: 'solar-design',
      icon: 'PenTool',
      order: 4,
      category: 'Engineering',
      requiredPermission: 'design:cad:view',
    },
    {
      id: 'menu_proposals',
      title: 'Proposals',
      view: 'proposal',
      icon: 'FileText',
      order: 5,
      category: 'Billing',
      requiredPermission: 'billing:quote:view',
    },
    {
      id: 'menu_quotations',
      title: 'Quotation Builder',
      view: 'quotation',
      icon: 'Calculator',
      order: 6,
      category: 'Billing',
      requiredPermission: 'billing:quote:create',
    },
    {
      id: 'menu_tax_invoices',
      title: 'Tax Invoices',
      view: 'tax-invoice',
      icon: 'Receipt',
      order: 7,
      category: 'Billing',
      requiredPermission: 'billing:invoice:manage',
    },
    {
      id: 'menu_projects',
      title: 'Projects & Tasks',
      view: 'projects',
      icon: 'CheckSquare',
      order: 8,
      category: 'Operations',
      requiredPermission: 'projects:tracker:view',
    },
    {
      id: 'menu_inventory',
      title: 'BOS Inventory',
      view: 'inventory',
      icon: 'Package',
      order: 9,
      category: 'Operations',
      requiredPermission: 'inventory:stock:view',
    },
    {
      id: 'menu_procurement',
      title: 'Procurement & POs',
      view: 'procurement',
      icon: 'Truck',
      order: 10,
      category: 'Operations',
      requiredPermission: 'procurement:po:view',
    },
    {
      id: 'menu_finance',
      title: 'Finance & Ledger',
      view: 'finance',
      icon: 'IndianRupee',
      order: 11,
      category: 'Finance',
      requiredPermission: 'finance:ledger:view',
    },
    {
      id: 'menu_subsidy',
      title: 'PM-Surya Ghar Subsidy',
      view: 'subsidy',
      icon: 'Landmark',
      order: 12,
      category: 'Finance',
      requiredPermission: 'subsidy:discom:manage',
    },
    {
      id: 'menu_vendor_portal',
      title: 'Subscriber Website & Portal',
      view: 'vendors',
      icon: 'Globe',
      order: 13,
      category: 'Website',
      requiredPermission: 'website:config:view',
    },
    {
      id: 'menu_master_settings',
      title: 'Master Settings & RBAC',
      view: 'settings',
      icon: 'Sliders',
      order: 14,
      category: 'Settings',
      requiredPermission: 'roles:role:view',
    },
  ];

  for (const m of MENUS) {
    db.insert('menus', m);
  }

  // -------------------------------------------------------------
  // 9. DYNAMIC DROPDOWN MASTERS (100% database-driven)
  // -------------------------------------------------------------
  const DROPDOWN_CATEGORIES = [
    { key: 'expense_types', title: 'Expense Outflow Categories', scope: 'Finance', icon: 'Receipt' },
    { key: 'lead_sources', title: 'Lead Inflow Sources', scope: 'CRM', icon: 'Users' },
    { key: 'lead_stages', title: 'CRM Sales Stages', scope: 'CRM', icon: 'Filter' },
    { key: 'project_stages', title: 'Project Milestones', scope: 'Projects', icon: 'CheckSquare' },
    { key: 'inventory_categories', title: 'Hardware Categories', scope: 'Inventory', icon: 'Package' },
    { key: 'structure_types', title: 'Mounting Structure Types', scope: 'Design', icon: 'Sliders' },
    { key: 'discoms', title: 'State DISCOM Utilities', scope: 'General', icon: 'Zap' },
  ];

  for (const cat of DROPDOWN_CATEGORIES) {
    db.insert('dropdown_categories', { id: `cat_${cat.key}`, ...cat });
  }

  const DROPDOWN_OPTIONS = [
    // Expense Types
    { category: 'expense_types', name: 'Material & Hardware Purchase', code: 'EXP-MAT', order: 1, status: 'Active' },
    { category: 'expense_types', name: 'Labor & Installation Wages', code: 'EXP-LAB', order: 2, status: 'Active' },
    { category: 'expense_types', name: 'Logistics & Transport', code: 'EXP-LOG', order: 3, status: 'Active' },
    { category: 'expense_types', name: 'DISCOM Application Fees', code: 'EXP-DIS', order: 4, status: 'Active' },
    // Lead Sources
    { category: 'lead_sources', name: 'Subscriber Website Inbound', code: 'SRC-WEB', order: 1, status: 'Active' },
    { category: 'lead_sources', name: 'Referral & Word-of-Mouth', code: 'SRC-REF', order: 2, status: 'Active' },
    { category: 'lead_sources', name: 'Field Survey & Canvassing', code: 'SRC-FLD', order: 3, status: 'Active' },
    { category: 'lead_sources', name: 'Google Search & Ads', code: 'SRC-GGL', order: 4, status: 'Active' },
    // Lead Stages
    { category: 'lead_stages', name: 'New Inquiry', code: 'STG-NEW', order: 1, status: 'Active' },
    { category: 'lead_stages', name: 'Site Feasibility Survey', code: 'STG-SRV', order: 2, status: 'Active' },
    { category: 'lead_stages', name: '3D Proposal Shared', code: 'STG-PRP', order: 3, status: 'Active' },
    { category: 'lead_stages', name: 'Contract Signed & Advance Paid', code: 'STG-WON', order: 4, status: 'Active' },
    // Inventory Categories
    { category: 'inventory_categories', name: 'Solar PV Modules (Tier-1)', code: 'INV-MOD', order: 1, status: 'Active' },
    { category: 'inventory_categories', name: 'On-Grid String Inverters', code: 'INV-INV', order: 2, status: 'Active' },
    { category: 'inventory_categories', name: 'Hot-Dip Galvanized Structure', code: 'INV-STR', order: 3, status: 'Active' },
    { category: 'inventory_categories', name: 'DC Solar Cable & Earthing BOS', code: 'INV-BOS', order: 4, status: 'Active' },
    // Discoms
    { category: 'discoms', name: 'BESCOM (Karnataka)', code: 'DIS-BES', order: 1, status: 'Active' },
    { category: 'discoms', name: 'MSEDCL (Maharashtra)', code: 'DIS-MSE', order: 2, status: 'Active' },
    { category: 'discoms', name: 'UPPCL (Uttar Pradesh)', code: 'DIS-UPP', order: 3, status: 'Active' },
    { category: 'discoms', name: 'TANGEDCO (Tamil Nadu)', code: 'DIS-TND', order: 4, status: 'Active' },
  ];

  for (const opt of DROPDOWN_OPTIONS) {
    db.insert('dropdown_options', opt);
  }

  // -------------------------------------------------------------
  // 10. TENANT BUSINESS DATA (Leads, Projects, Inventory)
  // -------------------------------------------------------------
  // Vikram Solar Data
  db.insert('leads', {
    id: 'lead_vikram_001',
    organizationId: orgVikramSolar.id,
    name: 'Apex Logistics Industrial Park',
    email: 'operations@apexlogistics.com',
    phone: '+91 98112 34567',
    source: 'Subscriber Website Inbound',
    status: 'Site Survey',
    expectedLoad: '120',
    expectedLoadUnit: 'KW',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Plot 42, Electronic City Phase 2',
    assignedToId: 'usr_vikram_emp',
    assignedTo: 'Amit Kumar (Sales & Stock)',
  });

  db.insert('projects', {
    id: 'proj_vikram_001',
    organizationId: orgVikramSolar.id,
    customerName: 'Apex Logistics Industrial Park',
    capacityKw: 120,
    status: 'In Process',
    totalCost: 5400000,
    amountPaid: 2700000,
    city: 'Bengaluru',
    state: 'Karnataka',
    assignedToId: 'usr_vikram_emp',
  });

  db.insert('inventory', {
    id: 'inv_vikram_001',
    organizationId: orgVikramSolar.id,
    name: 'Vikram Somera 550W Mono PERC Bifacial Module',
    category: 'Solar PV Modules (Tier-1)',
    type: 'Panel',
    quantity: 480,
    unit: 'PCS',
    purchasePrice: 10500,
    sellingPrice: 12800,
    minThreshold: 50,
  });

  // SunPower Data
  db.insert('leads', {
    id: 'lead_sunpower_001',
    organizationId: orgSunpower.id,
    name: 'Dr. Ramesh Sharma Villa',
    email: 'ramesh.sharma@example.com',
    phone: '+91 98450 12345',
    source: 'Referral & Word-of-Mouth',
    status: 'Proposal',
    expectedLoad: '10',
    expectedLoadUnit: 'KW',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '74 Lavender Hts, Indiranagar',
    assignedToId: 'usr_sunpower_installer',
    assignedTo: 'Rohan Sharma (Lead Field Installer)',
  });

  db.insert('projects', {
    id: 'proj_sunpower_001',
    organizationId: orgSunpower.id,
    customerName: 'Dr. Ramesh Sharma Villa',
    capacityKw: 10,
    status: 'Assigned Installation',
    totalCost: 580000,
    amountPaid: 300000,
    city: 'Bengaluru',
    state: 'Karnataka',
    installerId: 'usr_sunpower_installer',
    assignedToId: 'usr_sunpower_installer',
  });

  db.insert('inventory', {
    id: 'inv_sunpower_001',
    organizationId: orgSunpower.id,
    name: 'SunPower Maxeon 420W All-Black Panel',
    category: 'Solar PV Modules (Tier-1)',
    type: 'Panel',
    quantity: 120,
    unit: 'PCS',
    purchasePrice: 13000,
    sellingPrice: 15500,
    minThreshold: 20,
  });

  console.log('Database seeded successfully!');
}
