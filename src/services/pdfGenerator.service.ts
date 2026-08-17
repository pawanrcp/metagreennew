import PDFDocument from "pdfkit";
import { METAGREEN_LOGO_BASE64 } from "@/src/assets/logoDataUrl";

export type PDFDocumentType = InstanceType<typeof PDFDocument>;

// --- Dynamic Interfaces ---

export interface CompanyDetails {
  name: string;
  gstin?: string;
  doorNo?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  cityState?: string;
  mobile?: string;
  email?: string;
  website?: string;
  logoPath?: string;
  logoBuffer?: Buffer | Uint8Array | ArrayBuffer;
  stampPath?: string;
  stampBuffer?: Buffer | Uint8Array | ArrayBuffer;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
  qrCodePath?: string;
  qrCodeBuffer?: Buffer | Uint8Array | ArrayBuffer;
}

export interface UpiDetails {
  upiId: string;
  payeeName?: string;
}

export interface Employee {
  first_name?: string;
  last_name?: string;
  name?: string;
  mobile?: string;
  email?: string;
  designation?: string;
  city?: string;
  state?: string;
}

export interface ProductItem {
  id?: string | number;
  description: string;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  tagColor?: string;
}

export interface WarrantyItem {
  component: string;
  standard: string;
  type: string;
  extended?: string;
}

export interface Estimation {
  id: string | number;
  created_at: string | Date;
  customer_name: string;
  mobile: string;
  door_no: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  product_description?: string;
  requested_watts?: string;
  structure?: string;
  amount: number | string;
  gst: number | string;
  civil_work_included?: boolean | number;
  products?: (string | ProductItem)[];
  companyDetails?: CompanyDetails;
  bankDetails?: BankDetails;
  upiDetails?: UpiDetails;
  warrantyData?: WarrantyItem[];
  warrantyCoverage?: string[];
  warrantyEligibility?: string[];
  exclusions?: string[];
  benefits?: string[];
  noteText?: string;
}

export interface PDFThemeConfig {
  brandColor?: string; // Default: e.g. "#008000"
  secondaryColor?: string; // Default: e.g. "#1a237e"
  textColor?: string; // Default: e.g. "#333333"
  borderColor?: string; // Default: e.g. "#888888"
  tableHeaderBg?: string; // Default: e.g. "#E0E0E0"
  accentBg?: string; // Default: e.g. "#FFE5CC"
  panelGradientColors?: string[];
}

export interface PDFGeneratorOptions {
  companyDetails?: CompanyDetails;
  bankDetails?: BankDetails;
  upiDetails?: UpiDetails;
  productList?: (string | ProductItem)[];
  warrantyData?: WarrantyItem[];
  warrantyCoverage?: string[];
  warrantyEligibility?: string[];
  exclusions?: string[];
  benefits?: string[];
  thankYouMessage?: string;
  proposalTitle?: string;
  estimatePrefix?: string;
  currencySymbol?: string;
  theme?: PDFThemeConfig;
}

// --- Text Formatting Helpers ---

export function toTitleCase(str?: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Convert numbers to words using Indian numbering system (Lakhs, Crores, Thousands)
export function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const amount = Math.round(num);
  if (amount === 0) return "Zero Rupees only";

  function convertHundreds(n: number): string {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      if (n % 10 !== 0) {
        result += " " + ones[n % 10];
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += ones[n];
    }
    return result.trim();
  }

  let result = "";
  let rem = amount;

  if (rem >= 10000000) {
    const crores = Math.floor(rem / 10000000);
    result += convertHundreds(crores) + " Crore ";
    rem %= 10000000;
  }

  if (rem >= 100000) {
    const lakhs = Math.floor(rem / 100000);
    result += convertHundreds(lakhs) + " Lakh ";
    rem %= 100000;
  }

  if (rem >= 1000) {
    const thousands = Math.floor(rem / 1000);
    result += convertHundreds(thousands) + " Thousand ";
    rem %= 1000;
  }

  if (rem > 0) {
    result += convertHundreds(rem);
  }

  return result.trim() + " Rupees only";
}

// Helper to draw image safely from path or buffer, falling back to callback if unavailable
function drawImageSafely(
  doc: PDFDocumentType,
  imageSource: string | Buffer | Uint8Array | ArrayBuffer | undefined,
  x: number,
  y: number,
  options: PDFKit.Mixins.ImageOption,
  fallback: () => void,
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

// --- Main Watermark, Header, Footer Helpers ---

const addWatermark = (
  doc: PDFDocumentType,
  company: CompanyDetails,
  theme: PDFThemeConfig,
) => {
  doc.save();
  const brandColor = theme.brandColor || "#008000";
  const imageSource = company.logoBuffer || company.logoPath || METAGREEN_LOGO_BASE64;

  drawImageSafely(
    doc,
    imageSource,
    150,
    250,
    { width: 350 },
    () => {
      doc
        .fontSize(50)
        .fillColor(brandColor, 0.05)
        .rotate(-45, { origin: [300, 400] })
        .text(company.name.toUpperCase(), 50, 400, {
          align: "center",
          width: 500,
        });
    },
  );
  doc.restore();
};

const addHeader = (
  doc: PDFDocumentType,
  pageNumber: number,
  estimation: Estimation,
  company: CompanyDetails,
  options: PDFGeneratorOptions,
) => {
  const theme = options.theme || {};
  const brandColor = theme.brandColor || "#008000";
  const textColor = theme.textColor || "#333333";
  const prefix = options.estimatePrefix || "GES25-";
  const topY = 40;

  // Company Logo or Text Fallback
  const imageSource = company.logoBuffer || company.logoPath || METAGREEN_LOGO_BASE64;
  drawImageSafely(
    doc,
    imageSource,
    50,
    topY,
    { width: 130 },
    () => {
      doc
        .fontSize(16)
        .fillColor(theme.secondaryColor || "#FF6B00")
        .font("Helvetica-Bold")
        .text(company.name.toUpperCase(), 50, topY, { width: 250 });
    },
  );

  const logoBottom = topY + 90 + 15;
  const companyY = topY + 10;

  // Dynamic Company Details Right Aligned
  doc.fontSize(9).fillColor(textColor).font("Helvetica-Bold");

  let lineOffset = 0;
  if (company.gstin) {
    doc.text(`GSTIN: ${company.gstin}`, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
    });
    lineOffset += 12;
  }
  if (company.doorNo) {
    doc.text(`Door No: ${company.doorNo}`, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
    });
    lineOffset += 12;
  }
  if (company.street1) {
    doc.text(company.street1, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
    });
    lineOffset += 12;
  }
  if (company.cityState) {
    doc.text(company.cityState, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
    });
    lineOffset += 12;
  }
  if (company.mobile) {
    doc.text(`Mobile: ${company.mobile}`, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
    });
    lineOffset += 12;
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
    });
    lineOffset += 12;
  }
  if (company.website) {
    doc.text(company.website, 350, companyY + lineOffset, {
      align: "right",
      width: 195,
      link: company.website.startsWith("http")
        ? company.website
        : `http://${company.website}`,
    });
  }

  // Header separator line
  doc
    .strokeColor(brandColor)
    .lineWidth(2)
    .moveTo(50, logoBottom)
    .lineTo(545, logoBottom)
    .stroke();

  // Page 1 specific metadata bar
  if (pageNumber === 1) {
    const tableY = logoBottom + 10;
    const estimateNumber = `${prefix}${String(estimation.id).padStart(6, "0")}`;
    const estimateDate = new Date(estimation.created_at).toLocaleDateString(
      "en-GB",
      { day: "2-digit", month: "short", year: "numeric" },
    );
    const borderColor = theme.borderColor || "#888888";

    doc.rect(50, tableY, 140, 25).fillAndStroke("#F5F5F5", borderColor);
    doc.rect(190, tableY, 140, 25).fillAndStroke("#F5F5F5", borderColor);
    doc.rect(330, tableY, 215, 25).fillAndStroke("#F5F5F5", borderColor);

    doc
      .fontSize(9)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("Estimate ID", 55, tableY + 5, { width: 130 })
      .text("Date", 195, tableY + 5, { width: 130 })
      .text("Client District", 335, tableY + 5, { width: 205 });

    doc
      .font("Helvetica")
      .text(estimateNumber, 55, tableY + 15, { width: 130 })
      .text(estimateDate, 195, tableY + 15, { width: 130 })
      .text(
        `${toTitleCase(estimation.district)}, ${toTitleCase(estimation.state)}`,
        335,
        tableY + 15,
        { width: 205 },
      );
    doc.y = tableY + 30;
  } else {
    doc.y = logoBottom + 25;
  }
};

const addFooter = (doc: PDFDocumentType, pageNumber: number) => {
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text(`${pageNumber} | Page`, 50, 770, { align: "center" });
};

// --- Helper for rendering product item text with parenthesized color tags dynamically ---
function drawProductRowText(
  doc: PDFDocumentType,
  text: string,
  index: number,
  x: number,
  y: number,
  width: number,
  defaultFont: string = "Helvetica",
) {
  doc.fontSize(9).font(defaultFont).fillColor("#333333");
  const fullText = `${index + 1}) ${text}`;

  // Match dynamic parenthesized tags like (RED), (BLACK), (GREEN), (BLUE), etc.
  const tagRegex = /\((RED|BLACK|GREEN|BLUE|YELLOW|PURPLE|ORANGE)\)/i;
  const match = fullText.match(tagRegex);

  if (match && match.index !== undefined) {
    const tag = match[1].toUpperCase();
    const before = fullText.substring(0, match.index);
    const after = fullText.substring(match.index + match[0].length);

    let tagColor = "#333333";
    let isBold = false;
    switch (tag) {
      case "RED":
        tagColor = "#FF0000";
        break;
      case "BLACK":
        tagColor = "#000000";
        isBold = true;
        break;
      case "GREEN":
        tagColor = "#008000";
        break;
      case "BLUE":
        tagColor = "#0000FF";
        break;
      case "YELLOW":
        tagColor = "#D97706";
        break;
      default:
        tagColor = "#333333";
    }

    doc.text(before, x, y, { continued: true });
    if (isBold) doc.font("Helvetica-Bold");
    doc.fillColor(tagColor).text(`(${tag})`, { continued: true });
    doc.font("Helvetica").fillColor("#333333").text(after, { width });
  } else {
    doc.text(fullText, x, y, { width });
  }
}

// --- Main Generator Function ---

export const generateEstimationPDF = (
  estimation: Estimation,
  employee?: Employee,
  options: PDFGeneratorOptions = {},
): PDFDocumentType => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
  });

  let pageNumber = 1;

  // Resolve dynamic Company, Bank, and Theme parameters
  const company: CompanyDetails = {
    name: "Energy Solutions",
    ...options.companyDetails,
    ...estimation.companyDetails,
  };

  const bank: BankDetails = {
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    ...options.bankDetails,
    ...estimation.bankDetails,
  };

  const theme: PDFThemeConfig = {
    brandColor: "#008000",
    secondaryColor: "#1a237e",
    textColor: "#333333",
    borderColor: "#888888",
    tableHeaderBg: "#E0E0E0",
    accentBg: "#FFE5CC",
    panelGradientColors: [
      "#4FC3F7",
      "#29B6F6",
      "#03A9F4",
      "#039BE5",
      "#0288D1",
      "#0277BD",
      "#01579B",
      "#1a237e",
    ],
    ...options.theme,
  };

  const brandColor = theme.brandColor || "#008000";
  const secondaryColor = theme.secondaryColor || "#1a237e";
  const currency = options.currencySymbol || "Rs.";
  const prefix = options.estimatePrefix || "GES25-";

  // GST & Total Calculations
  const totalAmount =
    typeof estimation.amount === "string"
      ? parseFloat(estimation.amount) || 0
      : estimation.amount || 0;
  const gstRate =
    typeof estimation.gst === "string"
      ? parseFloat(estimation.gst) || 0
      : estimation.gst || 0;

  addWatermark(doc, company, theme);

  // --- PAGE 1: Cover Page ---
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Clean background
  doc.rect(0, 0, pageWidth, pageHeight).fill("#FFFFFF");

  // Dynamic Solar Panel Grid Visual Overlay
  doc.save();
  doc.opacity(0.25);
  const panelWidth = 70;
  const panelHeight = 45;
  const startY = pageHeight * 0.5;
  const totalRows = 8;
  const gradientColors = theme.panelGradientColors || [
    "#4FC3F7",
    "#29B6F6",
    "#03A9F4",
    "#039BE5",
    "#0288D1",
    "#0277BD",
    "#01579B",
    "#1a237e",
  ];

  for (let row = 0; row < totalRows; row++) {
    const rowColor = gradientColors[row % gradientColors.length];
    for (let col = 0; col < 10; col++) {
      const x = col * panelWidth - 30;
      const y = startY + row * panelHeight;
      doc.rect(x, y, panelWidth - 3, panelHeight - 3).fill(rowColor);
      doc.strokeColor("#4a5568").lineWidth(1);
      doc
        .moveTo(x + panelWidth / 4, y)
        .lineTo(x + panelWidth / 4, y + panelHeight - 3)
        .stroke();
      doc
        .moveTo(x + panelWidth / 2, y)
        .lineTo(x + panelWidth / 2, y + panelHeight - 3)
        .stroke();
      doc
        .moveTo(x + (3 * panelWidth) / 4, y)
        .lineTo(x + (3 * panelWidth) / 4, y + panelHeight - 3)
        .stroke();
      doc
        .moveTo(x, y + panelHeight / 3)
        .lineTo(x + panelWidth - 3, y + panelHeight / 3)
        .stroke();
      doc
        .moveTo(x, y + (2 * panelHeight) / 3)
        .lineTo(x + panelWidth - 3, y + (2 * panelHeight) / 3)
        .stroke();
    }
  }
  doc.restore();

  // Top Logo on Cover Page
  const imageSource = company.logoBuffer || company.logoPath || METAGREEN_LOGO_BASE64;
  drawImageSafely(
    doc,
    imageSource,
    (pageWidth - 250) / 2,
    30,
    { width: 250 },
    () => {
      doc
        .fontSize(36)
        .font("Helvetica-Bold")
        .fillColor(brandColor)
        .text(company.name.toUpperCase(), 0, 40, {
          align: "center",
          width: pageWidth,
        });
    },
  );

  // Dynamic Metadata for Cover Page
  const estimateNumber = `${prefix}${String(estimation.id).padStart(6, "0")}`;
  const estimateDate = new Date(estimation.created_at).toLocaleDateString(
    "en-GB",
    { day: "2-digit", month: "short", year: "numeric" },
  );

  // Extract System Size
  let systemSize = estimation.product_description || "";
  if (estimation.product_description) {
    const match = estimation.product_description.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      systemSize = match[1];
    }
  } else if (estimation.requested_watts) {
    systemSize = estimation.requested_watts;
  }

  // Cover Page Title
  const title = options.proposalTitle || "Solar Proposal";
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .fillColor(brandColor)
    .text(title, 0, 260, { align: "center", width: pageWidth });

  if (systemSize) {
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text(`System Size: ${systemSize}`, 0, 310, {
        align: "center",
        width: pageWidth,
      });
  }

  // Estimate Info Box
  doc.save();
  doc.opacity(0.95);
  doc.roundedRect(60, 370, pageWidth - 120, 70, 10).fill("#FFFFFF");
  doc.restore();
  doc.roundedRect(60, 370, pageWidth - 120, 70, 10).stroke("#E0E0E0");

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#666666")
    .text("Estimate ID", 90, 382)
    .text("Date", pageWidth / 2 + 30, 382);

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor(secondaryColor)
    .text(estimateNumber, 90, 402)
    .text(estimateDate, pageWidth / 2 + 30, 402);

  doc
    .strokeColor("#E0E0E0")
    .lineWidth(1)
    .moveTo(pageWidth / 2, 378)
    .lineTo(pageWidth / 2, 432)
    .stroke();

  // Prepared For & Prepared By Sections
  const preparedByName = employee
    ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      employee.name ||
      company.name
    : company.name;
  const preparedByMobile =
    employee?.mobile || company.mobile || "Contact Company";

  doc.save();
  doc.opacity(0.92);
  doc.rect(0, 470, pageWidth, pageHeight - 470).fill("#FFFFFF");
  doc.restore();

  doc.rect(0, 470, pageWidth, 3).fill(brandColor);

  const footerY = 515;

  // Prepared For (Customer)
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(brandColor)
    .text("Prepared For", 60, footerY);

  doc
    .strokeColor(brandColor)
    .lineWidth(2)
    .moveTo(60, footerY + 18)
    .lineTo(160, footerY + 18)
    .stroke();

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor("#333333")
    .text(toTitleCase(estimation.customer_name), 60, footerY + 32, {
      width: 220,
    });

  doc.fontSize(11).font("Helvetica").fillColor("#666666");
  let customerYOffset = footerY + 52;
  if (estimation.mobile) {
    doc.text(`Mobile: ${estimation.mobile}`, 60, customerYOffset, {
      width: 220,
    });
    customerYOffset += 16;
  }
  if (estimation.door_no) {
    doc.text(`${toTitleCase(estimation.door_no)}`, 60, customerYOffset, {
      width: 220,
    });
    customerYOffset += 14;
  }
  if (estimation.area) {
    doc.text(`${toTitleCase(estimation.area)}`, 60, customerYOffset, {
      width: 220,
    });
    customerYOffset += 14;
  }
  if (estimation.city || estimation.district) {
    doc.text(
      `${toTitleCase(estimation.city || "")}${estimation.city && estimation.district ? ", " : ""}${toTitleCase(estimation.district || "")}`,
      60,
      customerYOffset,
      { width: 220 },
    );
    customerYOffset += 14;
  }
  if (estimation.state || estimation.pincode) {
    doc.text(
      `${toTitleCase(estimation.state || "")}${estimation.pincode ? ` - ${estimation.pincode}` : ""}`,
      60,
      customerYOffset,
      { width: 220 },
    );
  }

  // Prepared By (Employee / Company)
  const preparedByX = pageWidth / 2 + 30;
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(brandColor)
    .text("Prepared By", preparedByX, footerY);

  doc
    .strokeColor(brandColor)
    .lineWidth(2)
    .moveTo(preparedByX, footerY + 18)
    .lineTo(preparedByX + 100, footerY + 18)
    .stroke();

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor("#333333")
    .text(toTitleCase(preparedByName), preparedByX, footerY + 32, {
      width: 220,
    });

  doc.fontSize(12).font("Helvetica").fillColor("#666666");
  let prepYOffset = footerY + 52;
  if (preparedByMobile) {
    doc.text(`Mobile: ${preparedByMobile}`, preparedByX, prepYOffset, {
      width: 220,
    });
    prepYOffset += 40;
  }
  if (company.name) {
    doc.text(company.name, preparedByX, prepYOffset, { width: 220 });
    prepYOffset += 20;
  }
  if (company.cityState) {
    doc.text(company.cityState, preparedByX, prepYOffset, { width: 220 });
    prepYOffset += 20;
  }
  if (company.website) {
    doc.fillColor("#333333").text(company.website, preparedByX, prepYOffset, {
      width: 220,
      link: company.website.startsWith("http")
        ? company.website
        : `http://${company.website}`,
    });
  }

  // --- PAGE 2: Details & Products Table ---
  doc.addPage();
  pageNumber++;
  addWatermark(doc, company, theme);
  addHeader(doc, pageNumber, estimation, company, options);

  // Dynamic Info Table Header
  const infoY = doc.y + 10;
  const estimateNum = `${prefix}${String(estimation.id).padStart(6, "0")}`;
  const estDate = new Date(estimation.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const infoRowHeight = 25;
  const clientDistrict = `${toTitleCase(estimation.district)}, ${toTitleCase(estimation.state)}`;

  doc.fontSize(9).font("Helvetica");
  const estimateLabel = "Estimate: ";
  const dateLabel = "Date: ";
  const districtLabel = "Client District: ";

  doc.font("Helvetica-Bold");
  const estimateValueWidth = doc.widthOfString(estimateNum);
  const dateValueWidth = doc.widthOfString(estDate);
  const districtValueWidth = doc.widthOfString(clientDistrict);

  doc.font("Helvetica");
  const estimateLabelWidth = doc.widthOfString(estimateLabel);
  const dateLabelWidth = doc.widthOfString(dateLabel);
  const districtLabelWidth = doc.widthOfString(districtLabel);

  const infoPadding = 15;
  const infoCol1Width = estimateLabelWidth + estimateValueWidth + infoPadding;
  const infoCol2Width = dateLabelWidth + dateValueWidth + infoPadding;
  const infoCol3Width = districtLabelWidth + districtValueWidth + infoPadding;

  const infoCol1X = 50;
  const infoCol2X = infoCol1X + infoCol1Width;
  const infoCol3X = infoCol2X + infoCol2Width;

  const borderColor = theme.borderColor || "#888888";
  doc.lineWidth(0.5);
  doc
    .rect(infoCol1X, infoY, infoCol1Width, infoRowHeight)
    .fillAndStroke("#F5F5F5", borderColor);
  doc
    .rect(infoCol2X, infoY, infoCol2Width, infoRowHeight)
    .fillAndStroke("#F5F5F5", borderColor);
  doc
    .rect(infoCol3X, infoY, infoCol3Width, infoRowHeight)
    .fillAndStroke("#F5F5F5", borderColor);

  doc
    .fontSize(9)
    .fillColor("#000000")
    .font("Helvetica")
    .text(estimateLabel, infoCol1X + 5, infoY + 8, { continued: true })
    .font("Helvetica-Bold")
    .text(estimateNum);

  doc
    .fontSize(9)
    .fillColor("#000000")
    .font("Helvetica")
    .text(dateLabel, infoCol2X + 5, infoY + 8, { continued: true })
    .font("Helvetica-Bold")
    .text(estDate);

  doc
    .fontSize(9)
    .fillColor("#000000")
    .font("Helvetica")
    .text(districtLabel, infoCol3X + 5, infoY + 8, { continued: true })
    .font("Helvetica-Bold")
    .text(clientDistrict);

  doc.y = infoY + infoRowHeight + 10;

  // Bill To Section
  doc.moveDown(1);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#000000")
    .text("Bill To:", 50, doc.y);

  const fullCustomerAddress = [
    estimation.customer_name ? `Sri/Smt, ${toTitleCase(estimation.customer_name)} Garu` : "",
    toTitleCase(estimation.door_no),
    toTitleCase(estimation.area),
    toTitleCase(estimation.city),
    toTitleCase(estimation.district),
    `${toTitleCase(estimation.state)}${estimation.pincode ? `- ${estimation.pincode}` : ""}`,
    estimation.mobile ? `Ph: ${estimation.mobile}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  doc
    .font("Helvetica-Bold")
    .text(fullCustomerAddress, 50, doc.y, { width: 495 })
    .moveDown(1.8);

  // Note Section
  const civilIncluded = Boolean(estimation.civil_work_included);
  const noteText =
    estimation.noteText ||
    `Quote for Supply of ${estimation.product_description || "Solar"} RTS plant for Client${
      civilIncluded ? " including Civil Work" : ""
    }.`;

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#000000")
    .text("Note: ", 50, doc.y, { continued: true })
    .font("Helvetica-Bold")
    .text(noteText, { width: 495 })
    .moveDown(0.8);

  // Product List Table
  const products: (string | ProductItem)[] =
    options.productList || estimation.products || [];

  const tableStartY = doc.y;
  const col1X = 50;
  const col2X = 400;
  const col1Width = 350;
  const col2Width = 95;
  const rowHeight = 20;

  const headerBg = theme.tableHeaderBg || "#E0E0E0";
  doc.lineWidth(0.5);
  doc
    .rect(col1X, tableStartY, col1Width, rowHeight)
    .fillAndStroke(headerBg, borderColor);
  doc
    .rect(col2X, tableStartY, col2Width, rowHeight)
    .fillAndStroke(headerBg, borderColor);

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("Product Description", col1X + 5, tableStartY + 5, {
      width: col1Width - 10,
    })
    .text("Amount", col2X + 5, tableStartY + 5, {
      width: col2Width - 10,
      align: "right",
    });

  let currentY = tableStartY + rowHeight;
  const ROWS_PER_PAGE_1 = 15;

  products.forEach((prod, index) => {
    if ((pageNumber === 1 && index === ROWS_PER_PAGE_1) || currentY > 700) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);

      const tableStartY2 = doc.y;
      doc.lineWidth(0.5);
      doc
        .rect(col1X, tableStartY2, col1Width, rowHeight)
        .fillAndStroke(headerBg, borderColor);
      doc
        .rect(col2X, tableStartY2, col2Width, rowHeight)
        .fillAndStroke(headerBg, borderColor);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Product Description", col1X + 5, tableStartY2 + 5, {
          width: col1Width - 10,
        })
        .text("Amount", col2X + 5, tableStartY2 + 5, {
          width: col2Width - 10,
          align: "right",
        });
      currentY = tableStartY2 + rowHeight;
    }

    doc.lineWidth(0.5);
    doc.rect(col1X, currentY, col1Width, rowHeight).stroke(borderColor);
    doc.rect(col2X, currentY, col2Width, rowHeight).stroke(borderColor);

    const productText = typeof prod === "string" ? prod : prod.description;
    const itemAmount = typeof prod === "object" && prod.amount ? prod.amount : null;

    if (index === 0) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(
          `${index + 1}) ${estimation.product_description || productText}`,
          col1X + 5,
          currentY + 5,
          { width: col1Width - 10 },
        );

      const displayAmount = itemAmount ?? totalAmount;
      if (displayAmount) {
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#333333")
          .text(
            `${currency} ${displayAmount.toLocaleString("en-IN")}`,
            col2X + 5,
            currentY + 5,
            { width: col2Width - 10, align: "right" },
          );
      }
    } else if (index === 1 && estimation.structure) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(
          `${index + 1}) ${estimation.structure}`,
          col1X + 5,
          currentY + 5,
          { width: col1Width - 10 },
        );
    } else if (index === 2 && estimation.requested_watts) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(
          `${index + 1}) ${estimation.requested_watts}`,
          col1X + 5,
          currentY + 5,
          { width: col1Width - 10 },
        );
    } else {
      drawProductRowText(
        doc,
        productText,
        index,
        col1X + 5,
        currentY + 5,
        col1Width - 10,
      );
      if (itemAmount) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#333333")
          .text(
            `${currency} ${itemAmount.toLocaleString("en-IN")}`,
            col2X + 5,
            currentY + 5,
            { width: col2Width - 10, align: "right" },
          );
      }
    }

    currentY += rowHeight;
  });

  if (currentY > 680) {
    addFooter(doc, pageNumber);
    doc.addPage();
    pageNumber++;
    addWatermark(doc, company, theme);
    addHeader(doc, pageNumber, estimation, company, options);
    currentY = doc.y;
  }

  // Total Amount Row
  const accentBg = theme.accentBg || "#FFE5CC";
  doc.lineWidth(0.5);
  doc
    .rect(col1X, currentY, col1Width, rowHeight)
    .fillAndStroke(accentBg, borderColor);
  doc
    .rect(col2X, currentY, col2Width, rowHeight)
    .fillAndStroke(accentBg, borderColor);

  const gstLabel = gstRate ? ` (Incl. GST ${gstRate}%)` : "";
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(`Total Amount${gstLabel}`, col1X + 5, currentY + 4, {
      width: col1Width - 10,
    })
    .text(
      `${currency} ${totalAmount.toLocaleString("en-IN")} /-`,
      col2X + 5,
      currentY + 4,
      { width: col2Width - 10, align: "right" },
    );

  // Total in words
  doc.moveDown(1.5);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Total Amount in Words: ", 80, doc.y, { continued: true })
    .font("Helvetica-Bold")
    .text(numberToWords(totalAmount), { width: 465 });
  doc.moveDown(2);

  // Thank You Message
  if (doc.y > 700) {
    addFooter(doc, pageNumber);
    doc.addPage();
    pageNumber++;
    addWatermark(doc, company, theme);
    addHeader(doc, pageNumber, estimation, company, options);
  }

  const thankYouMsg =
    options.thankYouMessage ||
    `Thank you for your interest in doing business with ${company.name}. Waiting for your order confirmation…`;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(thankYouMsg, 50, doc.y, { width: 495 })
    .moveDown(2);

  // --- BANK DETAILS SECTION ---
  if (bank.bankName || bank.accountNumber) {
    if (doc.y > 700) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);
    }

    doc.moveDown(1.5);
    const bankDetailsY = doc.y;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(brandColor)
      .text("Bank Details for Payments:", 50, bankDetailsY);

    doc
      .strokeColor(brandColor)
      .lineWidth(1)
      .moveTo(50, bankDetailsY + 14)
      .lineTo(210, bankDetailsY + 14)
      .stroke();

    // QR Code rendering
    const qrSource = bank.qrCodeBuffer || bank.qrCodePath;
    if (qrSource) {
      drawImageSafely(doc, qrSource, 380, bankDetailsY - 10, { width: 120 }, () => {});
    }

    doc.moveDown(1);

    if (bank.bankName) {
      doc
        .fontSize(10)
        .fillColor("#333333")
        .font("Helvetica")
        .text("Bank Name: ", 50, doc.y, { continued: true })
        .font("Helvetica-Bold")
        .text(bank.bankName)
        .moveDown(0.3);
    }

    if (bank.accountName) {
      doc
        .font("Helvetica")
        .text("Account Name: ", 50, doc.y, { continued: true })
        .font("Helvetica-Bold")
        .text(bank.accountName)
        .moveDown(0.3);
    }

    if (bank.accountNumber) {
      doc
        .font("Helvetica")
        .text("A/C No: ", 50, doc.y, { continued: true })
        .font("Helvetica-Bold")
        .text(bank.accountNumber)
        .moveDown(0.3);
    }

    if (bank.ifsc) {
      doc
        .font("Helvetica")
        .text("IFSC: ", 50, doc.y, { continued: true })
        .font("Helvetica-Bold")
        .text(bank.ifsc)
        .moveDown(0.3);
    }

    if (bank.branch) {
      doc
        .font("Helvetica")
        .text("Branch: ", 50, doc.y, { continued: true })
        .font("Helvetica-Bold")
        .text(bank.branch)
        .moveDown(0.3);
    }

    const upi = options.upiDetails || estimation.upiDetails;
    if (upi?.upiId) {
      doc
        .font("Helvetica")
        .text("UPI ID: ", 50, doc.y, { continued: true })
        .font("Helvetica-Bold")
        .text(upi.upiId)
        .moveDown(0.3);
    }

    doc.moveDown(1);
  }

  // --- WARRANTY TERMS SECTION ---
  const warrantyData: WarrantyItem[] =
    options.warrantyData || estimation.warrantyData || [];

  if (warrantyData.length > 0) {
    if (doc.y > 650) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);
    }

    const warrantyY = doc.y;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(brandColor)
      .text("Warranty Terms and Conditions", 50, warrantyY);
    doc
      .strokeColor(brandColor)
      .lineWidth(1)
      .moveTo(50, warrantyY + 14)
      .lineTo(245, warrantyY + 14)
      .stroke();
    doc.moveDown(0.8);

    const prodWarrantyY = doc.y;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Product Warranty Details:", 50, prodWarrantyY);
    doc
      .strokeColor("#333333")
      .lineWidth(0.5)
      .moveTo(50, prodWarrantyY + 13)
      .lineTo(185, prodWarrantyY + 13)
      .stroke();
    doc.moveDown(0.7);

    // Table Configuration
    const warrantyTableY = doc.y;
    const wCol1X = 50;
    const wCol2X = 150;
    const wCol3X = 295;
    const wCol4X = 400;
    const wCol1W = 100;
    const wCol2W = 145;
    const wCol3W = 105;
    const wCol4W = 95;
    const wRowHeight = 35;
    const wHeaderHeight = 25;

    doc
      .rect(wCol1X, warrantyTableY, wCol1W, wHeaderHeight)
      .fillAndStroke(headerBg, borderColor);
    doc
      .rect(wCol2X, warrantyTableY, wCol2W, wHeaderHeight)
      .fillAndStroke(headerBg, borderColor);
    doc
      .rect(wCol3X, warrantyTableY, wCol3W, wHeaderHeight)
      .fillAndStroke(headerBg, borderColor);
    doc
      .rect(wCol4X, warrantyTableY, wCol4W, wHeaderHeight)
      .fillAndStroke(headerBg, borderColor);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Component", wCol1X + 5, warrantyTableY + 8, { width: wCol1W - 10 })
      .text("Standard Warranty", wCol2X + 5, warrantyTableY + 8, {
        width: wCol2W - 10,
        align: "center",
      })
      .text("Warranty Type", wCol3X + 5, warrantyTableY + 8, {
        width: wCol3W - 10,
        align: "center",
      })
      .text("Extended Warranty\n(Optional)", wCol4X + 5, warrantyTableY + 3, {
        width: wCol4W - 10,
        align: "center",
      });

    let wCurrentY = warrantyTableY + wHeaderHeight;

    warrantyData.forEach((row, index) => {
      const rowH = index === 0 ? wRowHeight + 10 : wRowHeight;

      if (wCurrentY + rowH > 700) {
        addFooter(doc, pageNumber);
        doc.addPage();
        pageNumber++;
        addWatermark(doc, company, theme);
        addHeader(doc, pageNumber, estimation, company, options);
        wCurrentY = doc.y;

        doc
          .rect(wCol1X, wCurrentY, wCol1W, wHeaderHeight)
          .fillAndStroke(headerBg, borderColor);
        doc
          .rect(wCol2X, wCurrentY, wCol2W, wHeaderHeight)
          .fillAndStroke(headerBg, borderColor);
        doc
          .rect(wCol3X, wCurrentY, wCol3W, wHeaderHeight)
          .fillAndStroke(headerBg, borderColor);
        doc
          .rect(wCol4X, wCurrentY, wCol4W, wHeaderHeight)
          .fillAndStroke(headerBg, borderColor);

        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("Component", wCol1X + 5, wCurrentY + 8, { width: wCol1W - 10 })
          .text("Standard Warranty", wCol2X + 5, wCurrentY + 8, {
            width: wCol2W - 10,
            align: "center",
          })
          .text("Warranty Type", wCol3X + 5, wCurrentY + 8, {
            width: wCol3W - 10,
            align: "center",
          })
          .text("Extended Warranty\n(Optional)", wCol4X + 5, wCurrentY + 3, {
            width: wCol4W - 10,
            align: "center",
          });

        wCurrentY += wHeaderHeight;
      }

      doc.rect(wCol1X, wCurrentY, wCol1W, rowH).stroke(borderColor);
      doc.rect(wCol2X, wCurrentY, wCol2W, rowH).stroke(borderColor);
      doc.rect(wCol3X, wCurrentY, wCol3W, rowH).stroke(borderColor);
      doc.rect(wCol4X, wCurrentY, wCol4W, rowH).stroke(borderColor);

      const textY = index === 0 ? wCurrentY + 8 : wCurrentY + 12;

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#333333")
        .text(row.component, wCol1X + 5, textY, { width: wCol1W - 10 })
        .text(row.standard, wCol2X + 5, textY, {
          width: wCol2W - 10,
          align: "center",
        })
        .text(row.type, wCol3X + 5, textY, {
          width: wCol3W - 10,
          align: "center",
        })
        .text(row.extended || "N/A", wCol4X + 5, textY, {
          width: wCol4W - 10,
          align: "center",
        });

      wCurrentY += rowH;
    });

    doc.y = wCurrentY + 15;
  }

  // --- WARRANTY COVERAGE ---
  const warrantyCoverage: string[] =
    options.warrantyCoverage || estimation.warrantyCoverage || [];
  if (warrantyCoverage.length > 0) {
    if (doc.y > 650) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);
    }

    const warrantyCoverageY = doc.y;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Warranty Coverage", 50, warrantyCoverageY);
    doc
      .strokeColor("#333333")
      .lineWidth(0.5)
      .moveTo(50, warrantyCoverageY + 13)
      .lineTo(155, warrantyCoverageY + 13)
      .stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Our warranty covers the following aspects:", 50, doc.y)
      .moveDown(0.3);

    warrantyCoverage.forEach((item, idx) => {
      if (doc.y > 700) {
        addFooter(doc, pageNumber);
        doc.addPage();
        pageNumber++;
        addWatermark(doc, company, theme);
        addHeader(doc, pageNumber, estimation, company, options);
      }
      doc
        .fontSize(10)
        .text(`${idx + 1}) ${item}`, 50, doc.y, { width: 495 })
        .moveDown(0.3);
    });
  }

  // --- WARRANTY ELIGIBILITY ---
  const eligibility: string[] =
    options.warrantyEligibility || estimation.warrantyEligibility || [];
  if (eligibility.length > 0) {
    if (doc.y > 650) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);
    }

    doc.moveDown(0.5);
    const warrantyEligibilityY = doc.y;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Warranty Eligibility", 50, warrantyEligibilityY);
    doc
      .strokeColor("#333333")
      .lineWidth(0.5)
      .moveTo(50, warrantyEligibilityY + 13)
      .lineTo(150, warrantyEligibilityY + 13)
      .stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "To claim warranty coverage, the following conditions must be met:",
        50,
        doc.y,
      )
      .moveDown(0.3);

    eligibility.forEach((item, idx) => {
      if (doc.y > 700) {
        addFooter(doc, pageNumber);
        doc.addPage();
        pageNumber++;
        addWatermark(doc, company, theme);
        addHeader(doc, pageNumber, estimation, company, options);
      }
      doc
        .fontSize(10)
        .text(`${idx + 1}) ${item}`, 50, doc.y, { width: 495 })
        .moveDown(0.3);
    });
  }

  // --- EXCLUSIONS ---
  const exclusions: string[] = options.exclusions || estimation.exclusions || [];
  if (exclusions.length > 0) {
    if (doc.y > 650) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);
    }

    doc.moveDown(0.5);
    const exclusionsY = doc.y;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Exclusions (What's NOT covered)", 50, exclusionsY);
    doc
      .strokeColor("#333333")
      .lineWidth(0.5)
      .moveTo(50, exclusionsY + 13)
      .lineTo(225, exclusionsY + 13)
      .stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "The following circumstances will avoid or limit the warranty coverage:",
        50,
        doc.y,
      )
      .moveDown(0.3);

    exclusions.forEach((item, idx) => {
      if (doc.y > 700) {
        addFooter(doc, pageNumber);
        doc.addPage();
        pageNumber++;
        addWatermark(doc, company, theme);
        addHeader(doc, pageNumber, estimation, company, options);
      }
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`${idx + 1}. ${item}`, 50, doc.y, { width: 495 })
        .moveDown(0.3);
    });
  }

  // --- BENEFITS SECTION ---
  const benefits: string[] = options.benefits || estimation.benefits || [];
  if (benefits.length > 0) {
    if (doc.y > 650) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addWatermark(doc, company, theme);
      addHeader(doc, pageNumber, estimation, company, options);
    }

    doc.moveDown(1);
    const benefitsY = doc.y;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(brandColor)
      .text(`Benefits of choosing ${company.name}`, 50, benefitsY);
    doc
      .strokeColor(brandColor)
      .lineWidth(1)
      .moveTo(50, benefitsY + 14)
      .lineTo(295, benefitsY + 14)
      .stroke();
    doc.moveDown(0.8);

    benefits.forEach((item, idx) => {
      if (doc.y > 700) {
        addFooter(doc, pageNumber);
        doc.addPage();
        pageNumber++;
        addWatermark(doc, company, theme);
        addHeader(doc, pageNumber, estimation, company, options);
      }
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`${idx + 1}) ${item}`, 50, doc.y, { width: 495 })
        .moveDown(0.5);
    });
  }

  doc.moveDown(4);

  if (doc.y > 700) {
    addFooter(doc, pageNumber);
    doc.addPage();
    pageNumber++;
    addWatermark(doc, company, theme);
    addHeader(doc, pageNumber, estimation, company, options);
  }

  // --- REGARDS SECTION & DYNAMIC STAMP ---
  const regardsY = doc.y;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Regards", 50, regardsY)
    .moveDown(2);

  const employeeName =
    toTitleCase(
      `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
        employee?.name ||
        company.name,
    ) || company.name;

  let regardsOffset = doc.y;
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#333333")
    .text(employeeName, 50, regardsOffset);
  regardsOffset += 14;

  const contactMobile = employee?.mobile || company.mobile;
  if (contactMobile) {
    doc.text(`Mobile: ${contactMobile}`, 50, regardsOffset);
    regardsOffset += 14;
  }
  if (company.name) {
    doc.text(company.name, 50, regardsOffset);
    regardsOffset += 14;
  }
  if (company.cityState) {
    doc.text(company.cityState, 50, regardsOffset);
    regardsOffset += 14;
  }
  if (company.website) {
    doc.fillColor("#333333").text(company.website, 50, regardsOffset, {
      link: company.website.startsWith("http")
        ? company.website
        : `http://${company.website}`,
    });
  }

  // Dynamic Stamp rendering
  const stampSource = company.stampBuffer || company.stampPath;
  drawImageSafely(
    doc,
    stampSource,
    380,
    regardsY - 20,
    { width: 120 },
    () => {
      // Dynamic Seal graphic if no image path/buffer provided
      doc.save();
      doc.circle(430, regardsY + 20, 45).stroke("#333333");
      doc.circle(430, regardsY + 20, 40).stroke("#333333");
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(company.name.toUpperCase(), 385, regardsY + 5, {
          width: 90,
          align: "center",
        });
      if (company.city) {
        doc.text(company.city.toUpperCase(), 385, regardsY + 30, {
          width: 90,
          align: "center",
        });
      }
      doc.restore();
    },
  );

  addFooter(doc, pageNumber);

  return doc;
};
