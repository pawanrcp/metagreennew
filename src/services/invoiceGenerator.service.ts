import PDFDocument from 'pdfkit';
import { numberToWords, toTitleCase, CompanyDetails, BankDetails, UpiDetails } from './pdfGenerator.service';
import { METAGREEN_LOGO_BASE64 } from '@/src/assets/logoDataUrl';

export type InvoiceType = 'commercial' | 'itemized_tax_invoice' | 'solar_7030_tax_invoice';

export interface InvoiceItem {
  slNo?: number;
  description: string;
  hsnSac?: string;
  quantity?: number | string;
  capacity?: string;
  rateInclTax?: number;
  rate?: number;
  unit?: string;
  amount: number;

  taxableValue?: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
}

export interface HsnTaxSummary {
  hsnSac: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTax: number;
}

export interface InvoiceCustomer {
  name: string;
  address: string;
  cityDistrict?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  phone?: string;
}

export interface InvoiceData {
  invoiceType?: InvoiceType;
  invoiceNo: string;
  invoiceDate: string | Date;
  referenceNo?: string;
  referenceDate?: string;
  modeOfPayment?: string;
  deliveryNote?: string;
  buyersOrderNo?: string;
  orderDate?: string;
  dispatchDocId?: string;
  deliveryNoteDate?: string;
  termsOfDelivery?: string;
  shipTo: InvoiceCustomer;
  billTo: InvoiceCustomer;
  items: InvoiceItem[];
  subtotal?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  totalAmount: number;
  systemCapacityKw?: number;
  companyDetails?: CompanyDetails;
  bankDetails?: BankDetails;
  upiDetails?: UpiDetails;
  termsAndConditions?: string[];
  declaration?: string;
  hsnSummaries?: HsnTaxSummary[];
}

export type PDFDocumentType = InstanceType<typeof PDFDocument>;

// Helper to draw image safely with fallback
function drawImageSafely(
  doc: PDFDocumentType,
  imageSource: string | Buffer | Uint8Array | ArrayBuffer | undefined,
  x: number,
  y: number,
  options: PDFKit.Mixins.ImageOption,
  fallback: () => void
) {
  if (!imageSource) {
    fallback();
    return;
  }
  try {
    doc.image(imageSource as any, x, y, options);
  } catch (e) {
    fallback();
  }
}

// Format currency
function formatRs(num: number): string {
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmountOnly(num: number): string {
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- TEMPLATE 1: COMMERCIAL INVOICE (PDF 1 Spec) ---
function generateCommercialInvoice(doc: PDFDocumentType, data: InvoiceData): PDFDocumentType {
  const company: CompanyDetails = {
    name: 'SOLAR HUT SOLUTIONS LLP',
    gstin: '37AAKFS9782N1Z7',
    doorNo: '77-14-13, Ground Floor',
    street1: 'Shanthi Nagar, Pypula Road, Ajith Singh Nagar',
    cityState: 'Vijayawada, NTR District, Andhra Pradesh - 520015',
    mobile: '9848992333, 9966177225',
    website: 'www.solarhutsolutions.in',
    ...data.companyDetails,
  };

  const bank: BankDetails = {
    bankName: 'State Bank of India',
    accountName: 'Solar Hut Solutions LLP',
    accountNumber: '44513337275',
    ifsc: 'SBIN0012948',
    branch: 'Pantakalava Road, Vijayawada.',
    ...data.bankDetails,
  };

  const upi: UpiDetails = {
    upiId: 'solarhutsolutionsllp@sbi',
    ...data.upiDetails,
  };

  const formattedDate = new Date(data.invoiceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const pageWidth = doc.page.width;

  // Header Logo & Company Info
  const topY = 40;
  const imageSource = company.logoBuffer || company.logoPath || METAGREEN_LOGO_BASE64;
  drawImageSafely(doc, imageSource, 50, topY, { width: 130 }, () => {
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#FF6B00').text(company.name, 50, topY);
  });

  // Company details top right
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  let companyY = topY;
  if (company.gstin) { doc.text(`GSTIN: ${company.gstin}`, 300, companyY, { align: 'right', width: 245 }); companyY += 12; }
  if (company.doorNo) { doc.text(`Door No: ${company.doorNo}`, 300, companyY, { align: 'right', width: 245 }); companyY += 12; }
  if (company.street1) { doc.text(company.street1, 300, companyY, { align: 'right', width: 245 }); companyY += 12; }
  if (company.cityState) { doc.text(company.cityState, 300, companyY, { align: 'right', width: 245 }); companyY += 12; }
  if (company.mobile) { doc.text(`Mobile: ${company.mobile}`, 300, companyY, { align: 'right', width: 245 }); companyY += 12; }
  if (company.website) { doc.text(company.website, 300, companyY, { align: 'right', width: 245 }); }

  // Title: INVOICE
  const titleY = companyY + 20;
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#FF5500').text('INVOICE', 0, titleY, { align: 'center', width: pageWidth });

  // Metadata Bar (Invoice No | Date | Reference No)
  const metaY = titleY + 30;
  doc.lineWidth(0.5);
  doc.rect(50, metaY, 170, 25).fillAndStroke('#F5F5F5', '#888888');
  doc.rect(220, metaY, 150, 25).fillAndStroke('#F5F5F5', '#888888');
  doc.rect(370, metaY, 175, 25).fillAndStroke('#F5F5F5', '#888888');

  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
    .text(`Invoice No: ${data.invoiceNo}`, 55, metaY + 7)
    .text(`Date: ${formattedDate}`, 225, metaY + 7)
    .text(`Reference No: ${data.referenceNo || data.invoiceNo}`, 375, metaY + 7);

  // Ship To & Bill To side by side
  const addrY = metaY + 35;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
    .text('Ship to:', 50, addrY)
    .text('Bill To:', 300, addrY);

  const ship = data.shipTo;
  const bill = data.billTo;

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
  doc.text(toTitleCase(ship.name), 50, addrY + 14, { width: 230 });
  doc.text(toTitleCase(bill.name), 300, addrY + 14, { width: 230 });

  doc.font('Helvetica').fillColor('#555555');
  doc.text(`${ship.address}`, 50, addrY + 28, { width: 230 });
  doc.text(`${bill.address}`, 300, addrY + 28, { width: 230 });

  doc.text(`${toTitleCase(ship.cityDistrict || '')}, ${toTitleCase(ship.state || '')} - ${ship.pincode || ''}`, 50, addrY + 42, { width: 230 });
  doc.text(`${toTitleCase(bill.cityDistrict || '')}, ${toTitleCase(bill.state || '')} - ${bill.pincode || ''}`, 300, addrY + 42, { width: 230 });

  if (ship.phone) doc.text(`Ph: ${ship.phone}`, 50, addrY + 56);
  if (bill.phone) doc.text(`Ph: ${bill.phone}`, 300, addrY + 56);

  // Table Start
  const tableY = addrY + 80;
  const col1X = 50, col2X = 300, col3X = 370, col4X = 460;
  const col1W = 250, col2W = 70, col3W = 90, col4W = 85;
  const headerH = 22;

  doc.rect(col1X, tableY, col1W, headerH).fillAndStroke('#E0E0E0', '#888888');
  doc.rect(col2X, tableY, col2W, headerH).fillAndStroke('#E0E0E0', '#888888');
  doc.rect(col3X, tableY, col3W, headerH).fillAndStroke('#E0E0E0', '#888888');
  doc.rect(col4X, tableY, col4W, headerH).fillAndStroke('#E0E0E0', '#888888');

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text('Product Description', col1X + 5, tableY + 6, { width: col1W - 10 })
    .text('Quantity', col2X + 5, tableY + 6, { width: col2W - 10, align: 'center' })
    .text('Total Capacity', col3X + 5, tableY + 6, { width: col3W - 10, align: 'center' })
    .text('Amount', col4X + 5, tableY + 6, { width: col4W - 10, align: 'right' });

  let curY = tableY + headerH;
  const rowH = 50;

  data.items.forEach((item) => {
    doc.rect(col1X, curY, col1W, rowH).stroke('#888888');
    doc.rect(col2X, curY, col2W, rowH).stroke('#888888');
    doc.rect(col3X, curY, col3W, rowH).stroke('#888888');
    doc.rect(col4X, curY, col4W, rowH).stroke('#888888');

    doc.fontSize(9).font('Helvetica').fillColor('#000000')
      .text(item.description, col1X + 5, curY + 12, { width: col1W - 10 })
      .text(String(item.quantity || 1), col2X + 5, curY + 18, { width: col2W - 10, align: 'center' })
      .text(item.capacity || 'Solar Inverter', col3X + 5, curY + 12, { width: col3W - 10, align: 'center' })
      .text(formatRs(item.amount), col4X + 5, curY + 18, { width: col4W - 10, align: 'right' });

    curY += rowH;
  });

  // GST Amount row
  const gstVal = data.cgstAmount && data.sgstAmount ? (data.cgstAmount + data.sgstAmount) : (data.totalAmount * 0.05);
  doc.rect(col1X, curY, col1W + col2W + col3W, 20).fillAndStroke('#FFFFFF', '#888888');
  doc.rect(col4X, curY, col4W, 20).fillAndStroke('#FFFFFF', '#888888');

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text('GST Amount (5.00%)', col1X + 5, curY + 5)
    .text(`${formatRs(gstVal)} /-`, col4X + 5, curY + 5, { width: col4W - 10, align: 'right' });

  curY += 20;

  // Total Amount row
  doc.rect(col1X, curY, col1W + col2W + col3W, 22).fillAndStroke('#FFE5CC', '#888888');
  doc.rect(col4X, curY, col4W, 22).fillAndStroke('#FFE5CC', '#888888');

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
    .text('Total Amount (Incl. GST)', col1X + 5, curY + 6)
    .text(`${formatRs(data.totalAmount)} /-`, col4X + 5, curY + 6, { width: col4W - 10, align: 'right' });

  curY += 30;

  // Amount in words
  doc.fontSize(9).font('Helvetica').fillColor('#000000')
    .text('Amount Chargeable (in words) : ', 50, curY, { continued: true })
    .font('Helvetica-Bold')
    .text(numberToWords(data.totalAmount));

  curY += 20;

  // Bank & UPI Section
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#FF5500').text("Company's Bank Details", 50, curY);
  curY += 15;

  doc.fontSize(9).font('Helvetica').fillColor('#000000')
    .text('Bank Name: ', 50, curY, { continued: true }).font('Helvetica-Bold').text(bank.bankName); curY += 13;
  doc.font('Helvetica').text('Account Name: ', 50, curY, { continued: true }).font('Helvetica-Bold').text(bank.accountName); curY += 13;
  doc.font('Helvetica').text('A/C No: ', 50, curY, { continued: true }).font('Helvetica-Bold').text(bank.accountNumber); curY += 13;
  doc.font('Helvetica').text('IFSC: ', 50, curY, { continued: true }).font('Helvetica-Bold').text(bank.ifsc); curY += 13;
  doc.font('Helvetica').text('Branch: ', 50, curY, { continued: true }).font('Helvetica-Bold').text(bank.branch || ''); curY += 18;

  if (upi.upiId) {
    doc.font('Helvetica-Bold').fillColor('#FF5500').text('UPI ID: ', 50, curY, { continued: true })
      .fillColor('#000000').text(upi.upiId);
    curY += 20;
  }

  // Draw SBI SCAN & PAY Box on Right Side
  const qrSource = bank.qrCodeBuffer || bank.qrCodePath;
  drawImageSafely(doc, qrSource, 370, curY - 95, { width: 120 }, () => {
    doc.rect(360, curY - 95, 135, 100).stroke('#0066CC');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC').text('SBI SCAN & PAY', 365, curY - 90, { align: 'center', width: 125 });
  });

  // Terms & Conditions
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Terms & Conditions:', 50, curY);
  curY += 14;

  const defaultTerms = [
    '1) Material will be dispatched to the Buyer location only after 100% of the payment received in Cash / UPI / Loan.',
    '2) Upon receiving the material, Buyer is responsible for the material dispatched at his / her location until installation.',
    '3) No Refund / Exchange can be processed once after the Invoice is generated.',
    '4) Installation will be done in orderly process.',
    '5) Buyer must provide clean and obstacle free area for installation.',
  ];

  const terms = data.termsAndConditions || defaultTerms;
  doc.fontSize(8).font('Helvetica').fillColor('#444444');
  terms.forEach(t => {
    doc.text(t, 50, curY, { width: 495 });
    curY += 11;
  });

  // Round Seal & Authorised Signatory Footer
  const stampSource = company.stampBuffer || company.stampPath;
  drawImageSafely(doc, stampSource, 410, curY - 5, { width: 90 }, () => {
    doc.circle(450, curY + 25, 30).stroke('#0066CC');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#0066CC').text(company.name, 425, curY + 20, { align: 'center', width: 50 });
  });

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text(`For ${company.name.split(' ')[0] || 'SOLAR HUT'}`, 400, curY + 55, { align: 'center', width: 120 })
    .text('Authorised Signatory', 400, curY + 67, { align: 'center', width: 120 });

  return doc;
}

// --- TEMPLATES 2 & 3: STATUTORY TAX INVOICE & 70:30 SOLAR RTS TAX INVOICE (PDF 2 & 3 Spec) ---
function generateStatutoryTaxInvoice(doc: PDFDocumentType, data: InvoiceData): PDFDocumentType {
  const isSolar7030 = data.invoiceType === 'solar_7030_tax_invoice';

  const company: CompanyDetails = {
    name: 'SOLARHUT',
    gstin: '37AAKFS9782N1Z7',
    doorNo: '77-14-13, Ground Floor',
    street1: 'Shanthi Nagar, Pypula Road, Ajith Singh Nagar',
    cityState: 'Vijayawada, NTR District, Andhra Pradesh - 520015',
    mobile: '9848992333, 9966177225',
    website: 'www.solarhutsolutions.in',
    ...data.companyDetails,
  };

  const bank: BankDetails = {
    bankName: 'State Bank of India',
    accountName: 'Solar Hut Solutions LLP',
    accountNumber: '44513337275',
    ifsc: 'SBIN0012948',
    branch: 'Pantakalava Road, Vijayawada.',
    ...data.bankDetails,
  };

  const formattedDate = new Date(data.invoiceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const pageWidth = doc.page.width;
  const startY = 40;

  // Title: Tax Invoice
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000').text('Tax Invoice', 0, startY, { align: 'center', width: pageWidth });

  // Main Form Container Box
  const formY = startY + 25;
  const formWidth = 495;
  const leftColW = 250;
  const rightColW = 245;

  // Top Grid Section
  doc.lineWidth(0.5);
  doc.rect(50, formY, formWidth, 120).stroke('#000000');
  doc.moveTo(50 + leftColW, formY).lineTo(50 + leftColW, formY + 120).stroke('#000000');

  // Left Box: Company Info
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(company.name, 55, formY + 5);
  doc.fontSize(8).font('Helvetica').fillColor('#000000');
  let cY = formY + 18;
  if (company.gstin) { doc.text(`GSTIN: ${company.gstin}`, 55, cY); cY += 10; }
  if (company.doorNo) { doc.text(`Door No: ${company.doorNo}`, 55, cY); cY += 10; }
  if (company.street1) { doc.text(company.street1, 55, cY); cY += 10; }
  if (company.cityState) { doc.text(company.cityState, 55, cY); cY += 10; }
  if (company.mobile) { doc.text(`Mobile: ${company.mobile}`, 55, cY); cY += 10; }
  if (company.website) { doc.text(company.website, 55, cY); }

  // Right Box: Invoice Grid Fields
  const gridX = 50 + leftColW;
  doc.moveTo(gridX, formY + 30).lineTo(50 + formWidth, formY + 30).stroke('#000000');
  doc.moveTo(gridX, formY + 60).lineTo(50 + formWidth, formY + 60).stroke('#000000');
  doc.moveTo(gridX, formY + 90).lineTo(50 + formWidth, formY + 90).stroke('#000000');
  doc.moveTo(gridX + 120, formY).lineTo(gridX + 120, formY + 120).stroke('#000000');

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
    .text('Tax-Invoice No.', gridX + 5, formY + 3)
    .text(data.invoiceNo, gridX + 5, formY + 14)
    .text('Date', gridX + 125, formY + 3)
    .text(formattedDate, gridX + 125, formY + 14);

  doc.text('Mode/Terms of Payment', gridX + 5, formY + 33)
    .text(data.modeOfPayment || 'Cash / Loan', gridX + 5, formY + 44)
    .text('Delivery Note', gridX + 125, formY + 33)
    .text(data.deliveryNote || '-', gridX + 125, formY + 44);

  doc.text('Reference No. & Date.', gridX + 5, formY + 63)
    .text(data.referenceNo || '-', gridX + 5, formY + 74)
    .text('Other References', gridX + 125, formY + 63)
    .text('-', gridX + 125, formY + 74);

  doc.text("Buyer's Order No.", gridX + 5, formY + 93)
    .text(data.buyersOrderNo || '-', gridX + 5, formY + 104)
    .text('Dated', gridX + 125, formY + 93)
    .text(data.orderDate || '-', gridX + 125, formY + 104);

  // Consignee (Ship To) & Buyer (Bill To) Section
  const addrY = formY + 125;
  doc.rect(50, addrY, formWidth, 100).stroke('#000000');
  doc.moveTo(50, addrY + 50).lineTo(50 + formWidth, addrY + 50).stroke('#000000');

  const ship = data.shipTo;
  const bill = data.billTo;

  // Consignee
  doc.fontSize(9).font('Helvetica-Bold').text('Consignee (Ship to)', 55, addrY + 4);
  doc.fontSize(8).font('Helvetica')
    .text(toTitleCase(ship.name), 55, addrY + 15)
    .text(ship.address, 55, addrY + 25)
    .text(`${ship.cityDistrict || ''} ${ship.pincode || ''}`, 55, addrY + 35)
    .text(`State Name: ${ship.state || 'Andhra Pradesh'}, Code: ${ship.stateCode || '37'}`, 55, addrY + 45);

  // Buyer
  doc.fontSize(9).font('Helvetica-Bold').text('Buyer (Bill to)', 55, addrY + 54);
  doc.fontSize(8).font('Helvetica')
    .text(toTitleCase(bill.name), 55, addrY + 65)
    .text(bill.address, 55, addrY + 75)
    .text(`${bill.cityDistrict || ''} ${bill.pincode || ''}`, 55, addrY + 85)
    .text(`State Name: ${bill.state || 'Andhra Pradesh'}, Code: ${bill.stateCode || '37'}`, 55, addrY + 95);

  // Goods Table
  const tableY = addrY + 105;
  const cols = [
    { x: 50, w: 30, title: 'Sl\nNo.' },
    { x: 80, w: 170, title: 'Description of Goods' },
    { x: 250, w: 55, title: 'HSN/SAC' },
    { x: 305, w: 45, title: 'Quantity' },
    { x: 350, w: 65, title: 'Rate (Incl. of\nTax)' },
    { x: 415, w: 50, title: 'Rate' },
    { x: 465, w: 30, title: 'Per' },
    { x: 495, w: 50, title: 'Amount' },
  ];

  const headerHeight = 25;
  doc.rect(50, tableY, formWidth, headerHeight).fillAndStroke('#F5F5F5', '#000000');

  cols.forEach((col, idx) => {
    if (idx > 0) doc.moveTo(col.x, tableY).lineTo(col.x, tableY + headerHeight).stroke('#000000');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
      .text(col.title, col.x + 2, tableY + 4, { width: col.w - 4, align: idx >= 4 ? 'right' : 'left' });
  });

  let curY = tableY + headerHeight;

  // Prepare Items based on mode
  let itemsToRender: InvoiceItem[] = [];

  if (isSolar7030) {
    // 70:30 Rule Split Logic
    const capacityKw = data.systemCapacityKw || 3;
    const totalVal = data.totalAmount || 215000;

    // Tax calculation: Total Amount = Base + 5% GST on 70% + 18% GST on 30%
    // Base Goods = (Total * 0.70) / 1.05, Base Services = (Total * 0.30) / 1.18
    const baseGoods = (totalVal * 0.70) / 1.05;
    const baseServices = (totalVal * 0.30) / 1.18;
    const subtotal = baseGoods + baseServices;

    const cgstGoods = baseGoods * 0.025;
    const sgstGoods = baseGoods * 0.025;
    const cgstServices = baseServices * 0.09;
    const sgstServices = baseServices * 0.09;

    itemsToRender = [
      {
        slNo: 1,
        description: 'Supply of Solar Power GCRT Systems',
        hsnSac: '85414300',
        quantity: `${capacityKw} Kwp`,
        rateInclTax: (totalVal * 0.70) / capacityKw,
        rate: baseGoods / capacityKw,
        unit: 'kwp',
        amount: baseGoods + cgstGoods + sgstGoods,
        taxableValue: baseGoods,
        cgstRate: 2.5,
        cgstAmount: cgstGoods,
        sgstRate: 2.5,
        sgstAmount: sgstGoods,
      },
      {
        slNo: 2,
        description: 'Design Installation and Commissioning',
        hsnSac: '998739',
        quantity: '',
        rateInclTax: 0,
        rate: 0,
        unit: '',
        amount: baseServices + cgstServices + sgstServices,
        taxableValue: baseServices,
        cgstRate: 9.0,
        cgstAmount: cgstServices,
        sgstRate: 9.0,
        sgstAmount: sgstServices,
      }
    ];
  } else {
    itemsToRender = data.items.length > 0 ? data.items : [
      {
        slNo: 1,
        description: 'Vikram Solar Panels 550w+ M10 Bifacial G2G HC DCR (3 KW)',
        hsnSac: '85414300',
        quantity: '3 Kwp',
        rateInclTax: 116666.67,
        rate: 104166.67,
        unit: 'kwp',
        amount: 312500.00,
        taxableValue: 312500.00,
        cgstRate: 6.0,
        cgstAmount: 18750.00,
        sgstRate: 6.0,
        sgstAmount: 18750.00,
      },
      {
        slNo: 2,
        description: 'VIKRAM SOLAR PANELS',
        hsnSac: '998739',
        quantity: '',
        rateInclTax: 0,
        rate: 0,
        unit: '',
        amount: 133928.57,
        taxableValue: 133928.57,
        cgstRate: 6.0,
        cgstAmount: 8035.71,
        sgstRate: 6.0,
        sgstAmount: 8035.71,
      }
    ];
  }

  // Draw Items
  itemsToRender.forEach((item) => {
    const rH = 22;
    doc.rect(50, curY, formWidth, rH).stroke('#000000');
    cols.forEach((col, idx) => {
      if (idx > 0) doc.moveTo(col.x, curY).lineTo(col.x, curY + rH).stroke('#000000');
    });

    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    doc.text(String(item.slNo || 1), cols[0].x + 2, curY + 6, { width: cols[0].w - 4, align: 'center' });
    doc.text(item.description, cols[1].x + 2, curY + 6, { width: cols[1].w - 4 });
    doc.text(item.hsnSac || '', cols[2].x + 2, curY + 6, { width: cols[2].w - 4, align: 'center' });
    doc.text(String(item.quantity || ''), cols[3].x + 2, curY + 6, { width: cols[3].w - 4, align: 'center' });
    doc.text(item.rateInclTax ? formatAmountOnly(item.rateInclTax) : '', cols[4].x + 2, curY + 6, { width: cols[4].w - 4, align: 'right' });
    doc.text(item.rate ? formatAmountOnly(item.rate) : '', cols[5].x + 2, curY + 6, { width: cols[5].w - 4, align: 'right' });
    doc.text(item.unit || '', cols[6].x + 2, curY + 6, { width: cols[6].w - 4, align: 'center' });
    doc.text(formatAmountOnly(item.amount), cols[7].x + 2, curY + 6, { width: cols[7].w - 4, align: 'right' });

    curY += rH;
  });

  // Calculate Totals
  const taxableSum = itemsToRender.reduce((s, i) => s + (i.taxableValue || i.amount), 0);
  const cgstSum = itemsToRender.reduce((s, i) => s + (i.cgstAmount || 0), 0);
  const sgstSum = itemsToRender.reduce((s, i) => s + (i.sgstAmount || 0), 0);
  const totalTaxVal = cgstSum + sgstSum;
  const grandTotal = data.totalAmount || (taxableSum + totalTaxVal);

  // Subtotal, CGST, SGST, Total Rows
  const summaryRows = [
    { label: 'Subtotal', val: taxableSum },
    { label: 'CGST', val: cgstSum },
    { label: 'SGST', val: sgstSum },
    { label: 'Total', val: grandTotal, isTotal: true },
  ];

  summaryRows.forEach((r) => {
    doc.rect(50, curY, formWidth, 18).stroke('#000000');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
      .text(r.label, cols[1].x + 2, curY + 4)
      .text(formatAmountOnly(r.val), cols[7].x + 2, curY + 4, { width: cols[7].w - 4, align: 'right' });
    curY += 18;
  });

  curY += 10;

  // Chargeable Amount in Words
  doc.fontSize(9).font('Helvetica').fillColor('#000000')
    .text('Amount Chargeable (in words) : INR ', 50, curY, { continued: true })
    .font('Helvetica-Bold').text(numberToWords(grandTotal));

  curY += 18;

  // HSN / SAC Summary Table
  const hsnCols = [
    { x: 50, w: 75, title: 'HSN/SAC' },
    { x: 125, w: 85, title: 'Taxable Value' },
    { x: 210, w: 60, title: 'CGST Rate' },
    { x: 270, w: 70, title: 'CGST Amt' },
    { x: 340, w: 60, title: 'SGST Rate' },
    { x: 400, w: 70, title: 'SGST Amt' },
    { x: 470, w: 75, title: 'Total Tax' },
  ];

  doc.rect(50, curY, formWidth, 18).fillAndStroke('#F5F5F5', '#000000');
  hsnCols.forEach((col, idx) => {
    if (idx > 0) doc.moveTo(col.x, curY).lineTo(col.x, curY + 18).stroke('#000000');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
      .text(col.title, col.x + 2, curY + 5, { width: col.w - 4, align: idx > 0 ? 'right' : 'left' });
  });

  curY += 18;

  itemsToRender.forEach((item) => {
    doc.rect(50, curY, formWidth, 16).stroke('#000000');
    const taxLine = (item.cgstAmount || 0) + (item.sgstAmount || 0);

    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    doc.text(item.hsnSac || '85414300', hsnCols[0].x + 2, curY + 4);
    doc.text(formatAmountOnly(item.taxableValue || item.amount), hsnCols[1].x + 2, curY + 4, { width: hsnCols[1].w - 4, align: 'right' });
    doc.text(`${(item.cgstRate || 2.5).toFixed(2)}%`, hsnCols[2].x + 2, curY + 4, { width: hsnCols[2].w - 4, align: 'right' });
    doc.text(formatAmountOnly(item.cgstAmount || 0), hsnCols[3].x + 2, curY + 4, { width: hsnCols[3].w - 4, align: 'right' });
    doc.text(`${(item.sgstRate || 2.5).toFixed(2)}%`, hsnCols[4].x + 2, curY + 4, { width: hsnCols[4].w - 4, align: 'right' });
    doc.text(formatAmountOnly(item.sgstAmount || 0), hsnCols[5].x + 2, curY + 4, { width: hsnCols[5].w - 4, align: 'right' });
    doc.text(formatAmountOnly(taxLine), hsnCols[6].x + 2, curY + 4, { width: hsnCols[6].w - 4, align: 'right' });

    curY += 16;
  });

  // HSN TOTAL row
  doc.rect(50, curY, formWidth, 16).fillAndStroke('#F5F5F5', '#000000');
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text('TOTAL', hsnCols[0].x + 2, curY + 4);
  doc.text(formatAmountOnly(taxableSum), hsnCols[1].x + 2, curY + 4, { width: hsnCols[1].w - 4, align: 'right' });
  doc.text(formatAmountOnly(cgstSum), hsnCols[3].x + 2, curY + 4, { width: hsnCols[3].w - 4, align: 'right' });
  doc.text(formatAmountOnly(sgstSum), hsnCols[5].x + 2, curY + 4, { width: hsnCols[5].w - 4, align: 'right' });
  doc.text(formatAmountOnly(totalTaxVal), hsnCols[6].x + 2, curY + 4, { width: hsnCols[6].w - 4, align: 'right' });

  curY += 22;

  // Tax Amount in Words
  doc.fontSize(9).font('Helvetica').fillColor('#000000')
    .text('Tax Amount (in words) : INR ', 50, curY, { continued: true })
    .font('Helvetica-Bold').text(numberToWords(totalTaxVal));

  curY += 25;

  // Company Bank Details & Declaration
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Company Bank Details', 50, curY);
  curY += 14;

  doc.fontSize(8).font('Helvetica').fillColor('#000000');
  doc.text(`Bank Name: ${bank.bankName}`, 50, curY); curY += 11;
  doc.text(`Account Name: ${bank.accountName}`, 50, curY); curY += 11;
  doc.text(`Account Number: ${bank.accountNumber}`, 50, curY); curY += 11;
  doc.text(`IFSC: ${bank.ifsc}`, 50, curY); curY += 11;
  doc.text(`Branch: ${bank.branch || ''}`, 50, curY); curY += 16;

  doc.fontSize(9).font('Helvetica-Bold').text('Declaration', 50, curY); curY += 12;
  doc.fontSize(8).font('Helvetica').text('We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', 50, curY, { width: 300 });

  // Signatory Right Box
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text(`For ${company.name}`, 380, curY + 10, { align: 'center', width: 150 })
    .text('Authorised Signatory', 380, curY + 45, { align: 'center', width: 150 });

  return doc;
}

// --- MAIN EXPORTED GENERATOR FUNCTION ---
export function generateInvoicePDF(data: InvoiceData): PDFDocumentType {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    bufferPages: true,
  });

  const type = data.invoiceType || 'commercial';

  if (type === 'commercial') {
    return generateCommercialInvoice(doc, data);
  } else {
    return generateStatutoryTaxInvoice(doc, data);
  }
}

// Download helper for web browser environment
export function downloadInvoicePDF(data: InvoiceData) {
  const doc = generateInvoicePDF(data);
  const chunks: BlobPart[] = [];

  doc.on('data', (chunk: BlobPart) => chunks.push(chunk));
  doc.on('end', () => {
    const blob = new Blob(chunks, { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${data.invoiceNo}_${data.invoiceType || 'commercial'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });

  doc.end();
}
