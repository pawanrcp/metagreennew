import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export type DropdownCategoryKey = 
  | 'expense_types'
  | 'lead_sources'
  | 'lead_stages'
  | 'project_stages'
  | 'payment_stages'
  | 'payment_modes'
  | 'inventory_categories'
  | 'supplier_categories'
  | 'structure_types'
  | 'banks'
  | 'discoms';

export interface DropdownOption {
  id: string;
  category: DropdownCategoryKey;
  name: string;
  code?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  isDefault?: boolean;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface DropdownCategoryMeta {
  key: DropdownCategoryKey;
  title: string;
  description: string;
  iconName: string;
  scope: 'Finance' | 'CRM' | 'Projects' | 'Inventory' | 'Procurement' | 'General';
  defaults: Array<{ name: string; code?: string; description?: string }>;
}

export const DROPDOWN_CATEGORIES: DropdownCategoryMeta[] = [
  {
    key: 'expense_types',
    title: 'Expense Outflow Categories',
    description: 'Categories for direct costs, labor wages, shipping, utilities & operating expenses',
    iconName: 'Receipt',
    scope: 'Finance',
    defaults: [
      { name: 'Material & Hardware Purchase', code: 'EXP-MAT', description: 'Procurement of balance of system hardware and components' },
      { name: 'Labor & Installation Wages', code: 'EXP-LAB', description: 'Site technician, wireman & installer daily or milestone labor' },
      { name: 'Employee Commission', code: 'EXP-COM', description: 'Sales rep or installer incentive & deal closing commissions' },
      { name: 'Logistics & Transport', code: 'EXP-LOG', description: 'Freight, vehicle hiring, tempo/truck shipping to project sites' },
      { name: 'DISCOM Application Fees', code: 'EXP-DIS', description: 'Net metering application, testing & inspection statutory fees' },
      { name: 'Civil & Foundation Work', code: 'EXP-CIV', description: 'Roof grouting, concrete pedestal curing and masonry' },
      { name: 'Office Rent & Utilities', code: 'EXP-OFC', description: 'Office lease, power, internet, water & recurring overhead' },
      { name: 'Equipment Repair & Maintenance', code: 'EXP-REP', description: 'Crimpers, torque wrenches, ladders & drill repairs' },
      { name: 'Marketing & Customer Acquisition', code: 'EXP-MKT', description: 'Digital ads, hoardings, expo booths, flyers and promotions' },
      { name: 'Vendor Advance Payment', code: 'EXP-ADV', description: 'Advance token payments to external material suppliers' },
      { name: 'Other Expenses', code: 'EXP-OTH', description: 'Miscellaneous petty cash and incidental expenditures' }
    ]
  },
  {
    key: 'lead_sources',
    title: 'Lead Inflow Sources',
    description: 'Marketing channels and inquiry origin points for customer prospect tracking',
    iconName: 'Users',
    scope: 'CRM',
    defaults: [
      { name: 'Website Inquiry', code: 'SRC-WEB', description: 'Inbound submission via online booking catalogue or landing page' },
      { name: 'Customer Referral', code: 'SRC-REF', description: 'Word of mouth recommendation from satisfied existing solar client' },
      { name: 'Social Media / Meta Ads', code: 'SRC-SOC', description: 'Facebook, Instagram & WhatsApp lead generation campaigns' },
      { name: 'Google Search & SEO', code: 'SRC-SEO', description: 'Organic Google search & Google Business profile queries' },
      { name: 'Cold Call / Field Canvassing', code: 'SRC-FLD', description: 'Direct door-to-door or telemarketing outreach by sales reps' },
      { name: 'Exhibition & Trade Expo', code: 'SRC-EXP', description: 'Renewable energy fairs, agri-expos and community exhibitions' },
      { name: 'Channel Partner / Electrical Dealer', code: 'SRC-PRT', description: 'Referred by local electricians, hardware stores and vendors' },
      { name: 'Newspaper & Print Media', code: 'SRC-PRN', description: 'Print advertorials, paper inserts, and local banners' },
      { name: 'Walk-in Office Visit', code: 'SRC-WLK', description: 'Walk-in direct visitors to local solar showroom or office' }
    ]
  },
  {
    key: 'lead_stages',
    title: 'CRM Sales Stages',
    description: 'Pipeline milestone progression stages from raw inquiry to deal closure',
    iconName: 'Filter',
    scope: 'CRM',
    defaults: [
      { name: 'New Inquiry', code: 'STG-NEW', description: 'Unqualified initial inquiry awaiting first contact' },
      { name: 'Contacted', code: 'STG-CON', description: 'Sales rep has initiated first telephonic contact' },
      { name: 'Qualified', code: 'STG-QLF', description: 'Customer confirmed roof ownership, interest and electricity bills' },
      { name: 'Site Survey Scheduled', code: 'STG-SRV', description: 'Engineer dispatched for physical shadow & roof structural analysis' },
      { name: 'Proposal / Quotation Sent', code: 'STG-PRP', description: 'System design and commercial quotation delivered to customer' },
      { name: 'Negotiation', code: 'STG-NEG', description: 'Price negotiation, financing discussions or subsidy queries' },
      { name: 'Approved / Won', code: 'STG-WON', description: 'Customer confirmed order, token advance collected' },
      { name: 'Lost / Dropped', code: 'STG-LST', description: 'Deal disqualified, customer withdrew or chose competitor' }
    ]
  },
  {
    key: 'project_stages',
    title: 'Project Execution Milestones',
    description: 'End-to-end solar plant installation lifecycle statuses',
    iconName: 'Sun',
    scope: 'Projects',
    defaults: [
      { name: 'Site Feasibility & Shadow Analysis', code: 'PRJ-SRV', description: 'Physical site measurements and roof structure inspection' },
      { name: 'Engineering & 3D Design', code: 'PRJ-ENG', description: 'CAD layouts, SLDs, inverter stringing and BOM generation' },
      { name: 'DISCOM Net Metering Applied', code: 'PRJ-DSC', description: 'Statutory grid connectivity registration submitted' },
      { name: 'Procurement & Hardware Dispatched', code: 'PRJ-MAT', description: 'Solar panels, inverter & structure dispatched from warehouse' },
      { name: 'Structure Erection & Module Mounting', code: 'PRJ-MNT', description: 'Mounting rails, clamps, leg columns & module cabling complete' },
      { name: 'Inverter & Electrical Wiring', code: 'PRJ-ELE', description: 'ACDB, DCDB, earthing pits and inverter termination' },
      { name: 'DISCOM Inspection & Bi-directional Meter', code: 'PRJ-INS', description: 'Government inspector approval and net meter installation' },
      { name: 'Commissioned & Grid Synced', code: 'PRJ-COM', description: 'Plant energized and generating green energy onto the grid' },
      { name: 'Subsidy Disbursed & Completed', code: 'PRJ-SUB', description: 'Central/State subsidy credited, final handover complete' }
    ]
  },
  {
    key: 'payment_stages',
    title: 'Customer Payment Milestone Stages',
    description: 'Contract payment stages for milestone invoicing and customer balance billing',
    iconName: 'IndianRupee',
    scope: 'Finance',
    defaults: [
      { name: 'Advance (Signing)', code: 'PAY-ADV', description: 'Booking token upon agreement signing (typically 10-20%)' },
      { name: 'Material Delivery (Milestone)', code: 'PAY-MAT', description: 'Payment upon arrival of panels and inverter at site (typically 60-70%)' },
      { name: 'Installation Complete', code: 'PAY-INS', description: 'Payment upon physical mounting and wiring completion (10-15%)' },
      { name: 'Net Metering / Subsidy', code: 'PAY-DSC', description: 'Milestone upon DISCOM inspection & net meter grid synchronization' },
      { name: 'Final Balance', code: 'PAY-BAL', description: 'Final project balance settlement upon commissioning handover' },
      { name: 'EMI', code: 'PAY-EMI', description: 'Monthly scheduled installment from customer or bank' },
      { name: 'Refund', code: 'PAY-REF', description: 'Reversal or adjustment refund to customer' }
    ]
  },
  {
    key: 'payment_modes',
    title: 'Payment Modes & Gateways',
    description: 'Accepted financial transaction channels for billing and expense records',
    iconName: 'CreditCard',
    scope: 'Finance',
    defaults: [
      { name: 'Bank Transfer (NEFT / RTGS / IMPS)', code: 'MOD-NFT', description: 'Direct bank-to-bank electronic fund transfer' },
      { name: 'UPI / QR Code Scan', code: 'MOD-UPI', description: 'Instant UPI transfer via GooglePay, PhonePe, Paytm or BHIM' },
      { name: 'Cheque / Demand Draft', code: 'MOD-CHQ', description: 'Account payee bank cheque or demand draft' },
      { name: 'Cash', code: 'MOD-CSH', description: 'Physical cash collection with official voucher receipt' },
      { name: 'Net Banking', code: 'MOD-NET', description: 'Direct customer portal internet banking' },
      { name: 'Credit / Debit Card (POS)', code: 'MOD-CRD', description: 'Card swipe machine or online payment gateway' },
      { name: 'Direct Bank Financing / NBFC', code: 'MOD-FIN', description: 'Disbursement directly from bank or solar financing partner' }
    ]
  },
  {
    key: 'inventory_categories',
    title: 'Inventory & Component SKU Categories',
    description: 'Hardware classification categories for warehouse stock management',
    iconName: 'Package',
    scope: 'Inventory',
    defaults: [
      { name: 'Solar Modules / Panels', code: 'CAT-MOD', description: 'Mono PERC, Bifacial, TopCon & DCR solar photovoltaic modules' },
      { name: 'Solar Inverters', code: 'CAT-INV', description: 'On-grid string inverters, hybrid inverters & micro-inverters' },
      { name: 'Solar Batteries & ESS', code: 'CAT-BAT', description: 'Lithium iron phosphate (LFP) & tubular lead-acid batteries' },
      { name: 'Mounting Structures & Rails', code: 'CAT-STR', description: 'Hot-dip galvanized (HDG) & aluminum mini-rails, purlins, clamps' },
      { name: 'ACDB & DCDB Distribution Boxes', code: 'CAT-DBX', description: 'Array junction boxes with MCBs, SPD type-II & fuses' },
      { name: 'Solar DC Cables (1C Cu XLPO)', code: 'CAT-DCC', description: 'UV-resistant 4 sq.mm & 6 sq.mm tinned copper solar cables' },
      { name: 'AC Power Cables (Al / Cu)', code: 'CAT-ACC', description: 'Armoured 3-phase & single-phase grid connectivity cables' },
      { name: 'Earthing Rods & Chemical Compounds', code: 'CAT-ERT', description: 'Copper bonded earth electrodes and moisture chemical compound' },
      { name: 'Lightning Arresters (LA)', code: 'CAT-LAR', description: 'Conventional copper LA and early streamer emission (ESE) rods' },
      { name: 'Net Meters & CT Boxes', code: 'CAT-MTR', description: 'DISCOM approved bi-directional digital generation & net meters' },
      { name: 'Fasteners, MC4 & Installation Accessories', code: 'CAT-ACC', description: 'SS304 bolts, conduit pipes, cable ties and MC4 connectors' }
    ]
  },
  {
    key: 'supplier_categories',
    title: 'Supplier & Vendor Classifications',
    description: 'Industry specialties for registered and direct offline material suppliers',
    iconName: 'Building2',
    scope: 'Procurement',
    defaults: [
      { name: 'Solar Panels (Mono/Poly PV)', code: 'SUP-MOD', description: 'Tier-1 module manufacturers and authorized wholesale stockists' },
      { name: 'Solar Inverters & Power Electronics', code: 'SUP-INV', description: 'Grid-tied, hybrid, and micro-inverter OEM distributors' },
      { name: 'Mounting Structures & Hardware', code: 'SUP-STR', description: 'Metal fabrication, HDG structures, rails, clamps and nuts/bolts' },
      { name: 'Electrical Cables & Switchgear', code: 'SUP-ELE', description: 'DC/AC wire manufacturers, Polycab, Havells, Schneider stockists' },
      { name: 'Batteries & Energy Storage', code: 'SUP-BAT', description: 'LFP lithium and lead-acid battery manufacturers' },
      { name: 'Earthing & Lightning Protection', code: 'SUP-ERT', description: 'Chemical earth electrode and ESE lightning rod vendors' },
      { name: 'Civil Work & Structure Fabrication', code: 'SUP-CIV', description: 'Site foundation, concrete pedestal and shed welding contractors' },
      { name: 'Logistics, Tempo & Transport', code: 'SUP-LOG', description: 'Local transport agencies, tempo fleets and freight operators' },
      { name: 'All-in-One Solar Wholesaler', code: 'SUP-ALL', description: 'Turnkey solar kits and multi-component wholesale distributors' },
      { name: 'Other Direct Suppliers', code: 'SUP-OTH', description: 'Incidental hardware, consumables and regional service suppliers' }
    ]
  },
  {
    key: 'structure_types',
    title: 'Roof Structure & Mounting Types',
    description: 'Types of solar mounting systems for roof analysis and design quotes',
    iconName: 'Building',
    scope: 'Projects',
    defaults: [
      { name: 'RCC Flat Roof (Ballasted / Anchor Fixed)', code: 'STR-RCC', description: 'Non-penetrating ballasted block or anchor bolted concrete tilt' },
      { name: 'Industrial Tin Shed (Mini Rail / Klip-Lok)', code: 'STR-TIN', description: 'Short mini-rails screwed to sheet ridges with EPDM gaskets' },
      { name: 'Elevated Super Structure (High Clearance)', code: 'STR-ELV', description: 'High clearance heavy MS/GI columns for roof usability below' },
      { name: 'Mangalore / Clay Tiled Roof (Hooks)', code: 'STR-TIL', description: 'Specialized stainless steel tile hooks supporting profile rails' },
      { name: 'Ground Mount Piled Foundation', code: 'STR-GND', description: 'Open field ramming or bored concrete pile foundation' },
      { name: 'Asbestos / Corrugated Sheet (Hanger Bolts)', code: 'STR-ASB', description: 'Long threaded hanger bolts penetrating purlins' }
    ]
  },
  {
    key: 'banks',
    title: 'Financial Partners & Banks',
    description: 'Financing partners for customer solar loans and EMI calculation schemes',
    iconName: 'Landmark',
    scope: 'Finance',
    defaults: [
      { name: 'State Bank of India (SBI)', code: 'BNK-SBI', description: 'SBI Surya Ghar collateral-free rooftop solar loan' },
      { name: 'HDFC Bank', code: 'BNK-HDFC', description: 'HDFC green personal and home improvement solar loans' },
      { name: 'ICICI Bank', code: 'BNK-ICICI', description: 'ICICI digital solar loan with instant in-principle sanction' },
      { name: 'Punjab National Bank (PNB)', code: 'BNK-PNB', description: 'PNB green solar scheme with concessionary interest rates' },
      { name: 'Bank of Baroda (BoB)', code: 'BNK-BOB', description: 'BoB Surya Ghar special low-rate financing' },
      { name: 'Bajaj Finserv (NBFC)', code: 'BNK-BAJ', description: 'Instant consumer durable solar financing with minimal KYC' },
      { name: 'Tata Capital (NBFC)', code: 'BNK-TATA', description: 'Tata Capital renewable energy clean loan facility' },
      { name: 'Muthoot Finance (NBFC)', code: 'BNK-MUT', description: 'Quick processing regional clean energy loans' }
    ]
  },
  {
    key: 'discoms',
    title: 'Electricity Distribution Boards (DISCOMs)',
    description: 'State and private electricity distribution companies for net metering and subsidy',
    iconName: 'Zap',
    scope: 'General',
    defaults: [
      { name: 'APEPDCL (Eastern Power - Andhra Pradesh)', code: 'DIS-APEP', description: 'Visakhapatnam, Srikakulam, Vizianagaram, East & West Godavari' },
      { name: 'APSPDCL (Southern Power - Andhra Pradesh)', code: 'DIS-APSP', description: 'Vijayawada, Guntur, Krishna, Nellore, Chittoor, Kadapa, Anantapur' },
      { name: 'BESCOM (Bangalore Electricity Supply - Karnataka)', code: 'DIS-BES', description: 'Bangalore Urban, Bangalore Rural, Kolar, Tumkur, Ramanagara' },
      { name: 'TSSPDCL (Southern Power - Telangana)', code: 'DIS-TSSP', description: 'Hyderabad, Rangareddy, Medchal, Mahbubnagar, Nalgonda' },
      { name: 'TANGEDCO (Tamil Nadu Electricity Board)', code: 'DIS-TNEB', description: 'Chennai, Coimbatore, Madurai and all districts across Tamil Nadu' },
      { name: 'MSEDCL (Mahavitaran - Maharashtra)', code: 'DIS-MSED', description: 'Mumbai outskirts, Pune, Nagpur, Nashik and Maharashtra state' },
      { name: 'UPPCL (Uttar Pradesh Power Corporation)', code: 'DIS-UPPC', description: 'Lucknow, Noida, Ghaziabad, Kanpur and Uttar Pradesh' },
      { name: 'Tata Power (Mumbai / Delhi / Odisha)', code: 'DIS-TATA', description: 'Tata Power distribution licensed areas' },
      { name: 'Adani Electricity (Mumbai)', code: 'DIS-ADAN', description: 'Adani Electricity Mumbai suburban distribution zone' },
      { name: 'PSPCL (Punjab State Power Corporation)', code: 'DIS-PSPC', description: 'Ludhiana, Amritsar, Jalandhar, Patiala and Punjab state' }
    ]
  }
];

/**
 * Subscribe to dropdown options for a given category with real-time updates.
 * If no documents exist in Firestore yet, automatically returns default options.
 */
export function subscribeDropdownOptions(
  categoryKey: DropdownCategoryKey,
  callback: (options: DropdownOption[]) => void
) {
  const q = query(
    collection(db, 'systemDropdownMasters'),
    where('category', '==', categoryKey)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      const meta = DROPDOWN_CATEGORIES.find(c => c.key === categoryKey);
      const defaults = meta ? meta.defaults.map((d, index) => ({
        id: `default-${categoryKey}-${index}`,
        category: categoryKey,
        name: d.name,
        code: d.code || '',
        description: d.description || '',
        status: 'Active' as const,
        isDefault: true,
        order: index
      })) : [];

      callback(defaults);
    } else {
      const items: DropdownOption[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          category: data.category || categoryKey,
          name: data.name || '',
          code: data.code || '',
          description: data.description || '',
          status: data.status || 'Active',
          isDefault: !!data.isDefault,
          order: data.order !== undefined ? data.order : 999,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });

      items.sort((a, b) => (a.order || 999) - (b.order || 999) || a.name.localeCompare(b.name));
      callback(items);
    }
  });
}

/**
 * Fetch dropdown options once (for non-reactive scenarios)
 */
export async function getDropdownOptions(categoryKey: DropdownCategoryKey): Promise<DropdownOption[]> {
  try {
    const q = query(
      collection(db, 'systemDropdownMasters'),
      where('category', '==', categoryKey)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const meta = DROPDOWN_CATEGORIES.find(c => c.key === categoryKey);
      return meta ? meta.defaults.map((d, index) => ({
        id: `default-${categoryKey}-${index}`,
        category: categoryKey,
        name: d.name,
        code: d.code || '',
        description: d.description || '',
        status: 'Active' as const,
        isDefault: true,
        order: index
      })) : [];
    }

    const items = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as DropdownOption));
    items.sort((a, b) => (a.order || 999) - (b.order || 999) || a.name.localeCompare(b.name));
    return items;
  } catch (err) {
    console.error(`Error fetching dropdown options for ${categoryKey}:`, err);
    const meta = DROPDOWN_CATEGORIES.find(c => c.key === categoryKey);
    return meta ? meta.defaults.map((d, index) => ({
      id: `default-${categoryKey}-${index}`,
      category: categoryKey,
      name: d.name,
      code: d.code || '',
      description: d.description || '',
      status: 'Active' as const,
      isDefault: true,
      order: index
    })) : [];
  }
}

/**
 * Add a new option to a dropdown category and persist in Firestore
 */
export async function addDropdownOption(
  categoryKey: DropdownCategoryKey,
  data: {
    name: string;
    code?: string;
    description?: string;
    status?: 'Active' | 'Inactive';
    createdBy?: string;
  }
): Promise<string> {
  const cleanName = data.name.trim();
  if (!cleanName) throw new Error('Option name cannot be empty.');

  const docRef = await addDoc(collection(db, 'systemDropdownMasters'), {
    category: categoryKey,
    name: cleanName,
    code: data.code?.trim() || cleanName.toUpperCase().replace(/\s+/g, '_').slice(0, 15),
    description: data.description?.trim() || '',
    status: data.status || 'Active',
    isDefault: false,
    order: 100,
    createdBy: data.createdBy || 'system',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Sync with specific collections if relevant
  if (categoryKey === 'expense_types') {
    try {
      await addDoc(collection(db, 'financeExpenseTypes'), {
        name: cleanName,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Silent sync to financeExpenseTypes:', e);
    }
  }

  return docRef.id;
}

/**
 * Update an existing dropdown option
 */
export async function updateDropdownOption(
  optionId: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    status?: 'Active' | 'Inactive';
    order?: number;
  }
): Promise<void> {
  const cleanData: any = {
    updatedAt: serverTimestamp()
  };

  if (data.name !== undefined) cleanData.name = data.name.trim();
  if (data.code !== undefined) cleanData.code = data.code.trim();
  if (data.description !== undefined) cleanData.description = data.description.trim();
  if (data.status !== undefined) cleanData.status = data.status;
  if (data.order !== undefined) cleanData.order = data.order;

  await updateDoc(doc(db, 'systemDropdownMasters', optionId), cleanData);
}

/**
 * Delete a dropdown option by ID
 */
export async function deleteDropdownOption(optionId: string): Promise<void> {
  await deleteDoc(doc(db, 'systemDropdownMasters', optionId));
}

/**
 * Seed or restore default curated options for a dropdown category
 */
export async function seedCategoryDefaults(categoryKey: DropdownCategoryKey): Promise<number> {
  const meta = DROPDOWN_CATEGORIES.find(c => c.key === categoryKey);
  if (!meta) return 0;

  const q = query(
    collection(db, 'systemDropdownMasters'),
    where('category', '==', categoryKey)
  );
  const existingSnapshot = await getDocs(q);
  const existingNames = new Set(existingSnapshot.docs.map(d => (d.data().name || '').toLowerCase()));

  const batch = writeBatch(db);
  let seededCount = 0;

  meta.defaults.forEach((def, index) => {
    if (!existingNames.has(def.name.toLowerCase())) {
      const newDocRef = doc(collection(db, 'systemDropdownMasters'));
      batch.set(newDocRef, {
        category: categoryKey,
        name: def.name,
        code: def.code || def.name.toUpperCase().replace(/\s+/g, '_').slice(0, 15),
        description: def.description || '',
        status: 'Active',
        isDefault: true,
        order: index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      seededCount++;
    }
  });

  if (seededCount > 0) {
    await batch.commit();
  }

  return seededCount;
}
