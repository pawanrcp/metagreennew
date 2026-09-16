import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  GLOBAL_DEFAULT_THEME,
  GLOBAL_DEFAULT_BRANDING,
  GLOBAL_DEFAULT_CONTENT,
} from './websiteCustomization.service';

export async function checkAndSeedFirebase(): Promise<void> {
  try {
    // 1. Check if roles are already present
    const rolesSnap = await getDocs(collection(db, 'roles'));
    if (!rolesSnap.empty) {
      return; // Already initialized
    }

    console.log('Seeding initial dynamic roles and permissions into Firebase Firestore...');

    // -------------------------------------------------------------
    // PERMISSIONS MATRIX (Module -> Resource -> Action)
    // -------------------------------------------------------------
    const PERMISSIONS = [
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
      { id: 'perm_dropdown_manage', module: 'Settings', resource: 'Dropdowns', action: 'Manage', code: 'settings:dropdowns:manage', description: 'Manage dynamic dropdown categories and master values' },

      // HR & Workforce Management
      { id: 'perm_hr_emp_view', module: 'HR', resource: 'Employees', action: 'View', code: 'hr:employees:view', description: 'View staff directory, employee cards, and contact details' },
      { id: 'perm_hr_emp_manage', module: 'HR', resource: 'Employees', action: 'Manage', code: 'hr:employees:manage', description: 'Create, edit, assign projects, and configure employee commissions' },
      { id: 'perm_hr_payroll_view', module: 'HR', resource: 'Payroll', action: 'View', code: 'hr:payroll:view', description: 'View salary slips, fixed payouts, and per-kW commissions' },
      { id: 'perm_hr_payroll_manage', module: 'HR', resource: 'Payroll', action: 'Manage', code: 'hr:payroll:manage', description: 'Approve salary payouts, disburse commissions, and edit remuneration' },
      { id: 'perm_hr_att_view', module: 'HR', resource: 'Attendance', action: 'View', code: 'hr:attendance:view', description: 'View daily punch-in logs and field technician GPS check-ins' },
      { id: 'perm_hr_att_manage', module: 'HR', resource: 'Attendance', action: 'Manage', code: 'hr:attendance:manage', description: 'Approve leave requests and adjust attendance records' },
    ];

    for (const p of PERMISSIONS) {
      await setDoc(doc(db, 'permissions', p.id), {
        ...p,
        createdAt: serverTimestamp(),
      });
    }

    const allPermCodes = PERMISSIONS.map((p) => p.code);

    // -------------------------------------------------------------
    // DYNAMIC ROLES
    // -------------------------------------------------------------
    const ROLES = [
      {
        id: 'role_super_admin',
        name: 'Super Admin',
        code: 'SUPER_ADMIN',
        description: 'Universal platform controller with unrestricted access across all tenants, plans, and system settings',
        isSystem: true,
        status: 'active',
        permissions: allPermCodes,
      },
      {
        id: 'role_vendor_admin',
        name: 'Vendor',
        code: 'VENDOR',
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
      },
      {
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
      },
      {
        id: 'role_installer',
        name: 'Installer',
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
      },
      {
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
      },
      {
        id: 'role_survey',
        name: 'Survey Engineer',
        code: 'SURVEY_ENG',
        description: 'Field engineer responsible for roof surveys, shadow analysis, and electrical panel inspections',
        isSystem: false,
        status: 'active',
        permissions: [
          'dashboard:overview:view',
          'crm:leads:view', 'crm:leads:update',
          'design:cad:view', 'design:cad:create',
          'projects:tracker:view', 'projects:photos:upload',
        ],
      },
      {
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
      },
      {
        id: 'role_hr_manager',
        name: 'HR Manager',
        code: 'HR_MANAGER',
        description: 'Human Resources Director: manages staff directory, employee cards, attendance logs, and payroll/commissions',
        isSystem: false,
        status: 'active',
        permissions: [
          'dashboard:overview:view',
          'hr:employees:view',
          'hr:employees:manage',
          'hr:payroll:view',
          'hr:payroll:manage',
          'hr:attendance:view',
          'hr:attendance:manage',
          'projects:tracker:view',
        ],
      },
      {
        id: 'role_customer',
        name: 'Customer',
        code: 'CUSTOMER',
        description: 'Rooftop solar prosumer tracking live inverter generation telemetry and warranty milestones',
        isSystem: true,
        status: 'active',
        permissions: [
          'dashboard:overview:view',
          'billing:quote:view',
          'projects:tracker:view',
        ],
      },
    ];

    for (const r of ROLES) {
      await setDoc(doc(db, 'roles', r.id), {
        ...r,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // -------------------------------------------------------------
    // DYNAMIC SUBSCRIPTION PLANS
    // -------------------------------------------------------------
    const PLANS = [
      {
        id: 'plan-starter',
        name: 'Starter Solar Vendor (3 Users)',
        userLimit: 3,
        storageGBLimit: 10,
        priceMonthly: 4999,
        priceAnnual: 47990,
        billingInterval: 'both',
        annualDiscountPercentage: 20,
        trialEnabled: true,
        trialDays: 7,
        status: 'active',
        websiteCustomizationTier: 'basic',
        features: [
          'Up to 3 Organization Users',
          '10 GB Encrypted Storage Vault',
          '7-Day Free Trial Included',
          'PO & Auto-Inventory Sync',
          'GST Tax Invoice Generator',
          'Basic Website Branding & Contact Info',
          'Standard Support'
        ],
      },
      {
        id: 'plan-growth',
        name: 'Growth Solar Enterprise (10 Users)',
        userLimit: 10,
        storageGBLimit: 50,
        priceMonthly: 9999,
        priceAnnual: 95990,
        billingInterval: 'both',
        annualDiscountPercentage: 20,
        trialEnabled: true,
        trialDays: 7,
        status: 'active',
        websiteCustomizationTier: 'pro',
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
      },
      {
        id: 'plan-pro-fleet',
        name: 'Pro Fleet & Franchise (25 Users)',
        userLimit: 25,
        storageGBLimit: 200,
        priceMonthly: 24999,
        priceAnnual: 239990,
        billingInterval: 'both',
        annualDiscountPercentage: 20,
        trialEnabled: true,
        trialDays: 7,
        status: 'active',
        websiteCustomizationTier: 'enterprise',
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
      },
      {
        id: 'plan-enterprise',
        name: 'Annual Enterprise Powerhouse (100 Users)',
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
      },
    ];

    for (const plan of PLANS) {
      await setDoc(doc(db, 'subscriptionPlans', plan.id), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // -------------------------------------------------------------
    // GLOBAL DEFAULT & TENANT WEBSITE CONFIGURATIONS
    // -------------------------------------------------------------
    await setDoc(doc(db, 'websiteConfigs', 'web_global_default'), {
      id: 'web_global_default',
      organizationId: 'org_super_admin',
      organizationName: 'MetaGreen',
      organizationSlug: 'default',
      isGlobalDefault: true,
      isActive: true,
      theme: GLOBAL_DEFAULT_THEME,
      branding: GLOBAL_DEFAULT_BRANDING,
      content: GLOBAL_DEFAULT_CONTENT,
      featuresAllowed: {
        allowThemeCustomization: true,
        allowLogoCustomization: true,
        allowContentCustomization: true,
        allowFullCustomization: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('Firebase dynamic seed initialized successfully.');
  } catch (err) {
    console.error('Error seeding Firebase dynamic data:', err);
  }
}
