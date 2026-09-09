import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { GeneratedDocument, GeneratedDocType } from '@/src/types';
import { downloadInvoicePDF, InvoiceData } from './invoiceGenerator.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type GeneratedDocumentInput = Partial<Omit<GeneratedDocument, 'id' | 'createdAt' | 'updatedAt'>> & {
  type: GeneratedDocType;
  totalAmount: number;
  customerName: string;
  user?: any;
};

/**
 * Save a newly generated document (Quotation, Proposal, Invoice, Tax Invoice)
 * tagged user-wise with full creator attribution and customer details.
 * Performs an intelligent UPSERT by docNumber to avoid duplicate records.
 */
export async function saveGeneratedDocument(input: GeneratedDocumentInput): Promise<string> {
  try {
    const docPayload = {
      type: input.type,
      docNumber: input.docNumber || `DOC-${Date.now()}`,
      customerName: input.customerName || 'Valued Customer',
      customerEmail: input.customerEmail || '',
      customerPhone: input.customerPhone || '',
      customerAddress: input.customerAddress || '',
      city: input.city || '',
      district: input.district || '',
      state: input.state || 'Andhra Pradesh',
      pincode: input.pincode || '',
      customerId: input.customerId || '',
      leadId: input.leadId || '',
      projectId: input.projectId || '',
      totalAmount: Number(input.totalAmount) || 0,
      subtotal: Number(input.subtotal) || 0,
      taxAmount: Number(input.taxAmount) || 0,
      discount: Number(input.discount) || 0,
      systemCapacityKw: Number(input.systemCapacityKw) || 0,
      items: input.items || [],
      status: input.status || 'Generated',
      userId: input.userId || input.user?.uid || 'admin',
      userName: input.userName || input.user?.name || 'Administrator',
      userEmail: input.userEmail || input.user?.email || '',
      userRole: input.userRole || input.user?.role || 'Sales Executive',
      companyName: input.companyName || input.user?.companyName || input.user?.vendorAccount?.companyName || 'Meta Green Global HQ',
      metadata: input.metadata || {},
      pdfUrl: input.pdfUrl || ''
    };

    let targetId = '';

    // Check if a document with this docNumber already exists
    if (docPayload.docNumber) {
      const existingSnap = await getDocs(
        query(collection(db, 'generatedDocuments'), where('docNumber', '==', docPayload.docNumber))
      );
      if (!existingSnap.empty) {
        targetId = existingSnap.docs[0].id;
        await updateDoc(doc(db, 'generatedDocuments', targetId), {
          ...docPayload,
          updatedAt: serverTimestamp()
        });
      }
    }

    if (!targetId) {
      const docRef = await addDoc(collection(db, 'generatedDocuments'), {
        ...docPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      targetId = docRef.id;
    }

    // Also record in audit log
    try {
      await addDoc(collection(db, 'auditLogs'), {
        timestamp: new Date().toLocaleString(),
        user: input.userName || 'System User',
        action: `Generated / Updated ${input.type.toUpperCase()}`,
        details: `${input.type.toUpperCase()} #${input.docNumber} for ${input.customerName} (₹${Number(input.totalAmount || 0).toLocaleString()})`,
        createdAt: serverTimestamp()
      });
    } catch (auditErr) {
      console.warn('Could not write audit log:', auditErr);
    }

    return targetId;
  } catch (error) {
    console.error('Error saving generated document:', error);
    throw error;
  }
}

/**
 * Real-time subscription to all generated documents
 */
export function subscribeGeneratedDocuments(callback: (docs: GeneratedDocument[]) => void): () => void {
  const q = query(collection(db, 'generatedDocuments'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const documents: GeneratedDocument[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as GeneratedDocument));
    callback(documents);
  }, (error) => {
    console.error('Error listening to generated documents:', error);
  });
}

/**
 * Delete a generated document from Firestore
 */
export async function deleteGeneratedDocument(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'generatedDocuments', id));
  } catch (error) {
    console.error('Error deleting generated document:', error);
    throw error;
  }
}

/**
 * Update the status of a generated document (e.g. Sent, Approved, Paid)
 */
export async function updateGeneratedDocumentStatus(
  id: string, 
  status: GeneratedDocument['status']
): Promise<void> {
  try {
    await updateDoc(doc(db, 'generatedDocuments', id), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}

/**
 * Re-download Commercial Invoice PDF with itemized breakdown using vector generator
 */
export function downloadCommercialInvoiceJsPDF(docItem: GeneratedDocument, logos?: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(docItem.companyName || logos?.companyName || 'META GREEN SOLAR SOLUTIONS LLP', 14, 15);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('OFFICIAL COMMERCIAL INVOICE / BILL OF SUPPLY', 14, 23);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.text(`Invoice No: ${docItem.docNumber} | Ref / PO: ${docItem.metadata?.poReferenceNo || docItem.metadata?.referenceNo || 'PO-ONLINE'}`, 14, 31);

  // Date and status top right
  const formattedDate = docItem.createdAt?.toDate 
    ? docItem.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Date: ${docItem.metadata?.invoiceDate || formattedDate}`, pageWidth - 14, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Due Date: ${docItem.metadata?.dueDate || 'Immediate'}`, pageWidth - 14, 23, { align: 'right' });
  doc.text(`Status: ${(docItem.status || 'Generated').toUpperCase()}`, pageWidth - 14, 31, { align: 'right' });

  // Bill To & Ship To Card
  let curY = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 28, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (CUSTOMER):', 18, curY + 6);
  doc.text('PAYMENT & SYSTEM DETAILS:', 110, curY + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(docItem.customerName || 'Valued Customer', 18, curY + 12);
  doc.text(`${docItem.systemCapacityKw || 5} kW System Capacity`, 110, curY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(docItem.customerPhone ? `Ph: ${docItem.customerPhone}` : 'Contact: On file', 18, curY + 18);
  doc.text(docItem.customerAddress || `${docItem.city || ''}, ${docItem.state || 'Andhra Pradesh'}`, 18, curY + 23);
  doc.text(`Payment Terms: ${docItem.metadata?.paymentTerms || 'Bank Transfer / Loan'}`, 110, curY + 18);
  doc.text(`Generated By: ${docItem.userName || 'Admin'} (${docItem.userRole || 'Sales'})`, 110, curY + 23);

  curY += 34;

  // Items Table
  const rawItems = docItem.items && docItem.items.length > 0 ? docItem.items : [
    { description: 'Solar PV Modules 550W Mono PERC (Supply Component)', quantity: 10, unit: 'Pcs', rate: 14500, amount: 145000 },
    { description: 'On-Grid Solar Inverter 5kW Grid-Tied (Supply Component)', quantity: 1, unit: 'Nos', rate: 48000, amount: 48000 },
    { description: 'Installation, Civil Grouting & Commissioning Services', quantity: 1, unit: 'Job', rate: 22000, amount: 22000 }
  ];

  const tableRows = rawItems.map((it: any, i: number) => {
    const qty = Number(it.quantity) || 1;
    const rate = Number(it.rate || it.unitPrice || (it.amount ? it.amount / qty : 0));
    const total = Number(it.amount || (qty * rate));
    return [
      String(i + 1),
      it.description || it.name || 'Solar Hardware / Service Component',
      String(qty),
      it.unit || 'Nos',
      `Rs. ${rate.toLocaleString('en-IN')}`,
      `Rs. ${total.toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Item Description', 'Qty', 'Unit', 'Rate (Rs)', 'Amount (Rs)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || curY + 60;
  curY = finalTableY + 6;

  // Bank Details Box (Left)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, 105, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("COMPANY'S BANK DETAILS:", 18, curY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank Name: State Bank of India`, 18, curY + 12);
  doc.text(`Account Name: ${docItem.companyName || 'Meta Green Solar Solutions LLP'}`, 18, curY + 17);
  doc.text(`A/C No: 44513337275 | IFSC: SBIN0012948`, 18, curY + 22);
  doc.text(`Branch: Pantakalava Road, Vijayawada`, 18, curY + 27);
  doc.text(`Payment Mode: Direct RTGS / NEFT / IMPS`, 18, curY + 32);

  // Financial Summary Box (Right)
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(123, curY, 73, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('INVOICE TOTAL SUMMARY', 127, curY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  const subTotal = docItem.subtotal || (docItem.totalAmount - (docItem.taxAmount || 0));
  const taxVal = docItem.taxAmount || (docItem.totalAmount - subTotal);
  doc.text(`Subtotal: Rs. ${Number(subTotal).toLocaleString('en-IN')}`, 127, curY + 13);
  if (docItem.discount) {
    doc.text(`Discount: (-) Rs. ${Number(docItem.discount).toLocaleString('en-IN')}`, 127, curY + 18);
  }
  doc.text(`GST Tax: Rs. ${Number(taxVal).toLocaleString('en-IN')}`, 127, curY + (docItem.discount ? 23 : 19));

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`Grand Total: Rs. ${Number(docItem.totalAmount).toLocaleString('en-IN')}`, 127, curY + 31);

  curY += 42;

  // Terms & Conditions
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & CONDITIONS:', 14, curY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('1. Material dispatched only after confirmed payment received in bank account.', 14, curY + 5);
  doc.text('2. Buyer is responsible for site readiness and material safety until installation completion.', 14, curY + 9);
  doc.text('3. Certified that particulars given above are true, accurate and complete in all respects.', 14, curY + 13);

  // Signature
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - 65, curY + 24, pageWidth - 14, curY + 24);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`For ${docItem.companyName || 'Meta Green Solar'}`, pageWidth - 65, curY + 28);
  doc.text('Authorised Signatory', pageWidth - 65, curY + 32);

  doc.save(`Commercial_Invoice_${docItem.docNumber}_${docItem.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Re-download Statutory GST 70:30 Tax Invoice PDF using vector generator
 */
export function downloadTaxInvoiceJsPDF(docItem: GeneratedDocument, logos?: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(docItem.companyName || logos?.companyName || 'META GREEN SOLAR SOLUTIONS LLP', 14, 15);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('TAX INVOICE (RULE 46 OF CGST ACT, 2017 & SECTION 31)', 14, 23);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.text(`Invoice No: ${docItem.docNumber} | Ref / PO: ${docItem.metadata?.referenceNo || 'PO-ONLINE'} | State Code: 37 (Andhra Pradesh)`, 14, 31);

  // Date and status top right
  const formattedDate = docItem.createdAt?.toDate 
    ? docItem.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Date: ${docItem.metadata?.invoiceDate || formattedDate}`, pageWidth - 14, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Mode: ${docItem.metadata?.modeOfPayment || 'Bank Transfer'}`, pageWidth - 14, 23, { align: 'right' });
  doc.text(`Status: ${(docItem.status || 'Generated').toUpperCase()}`, pageWidth - 14, 31, { align: 'right' });

  // Bill To & Ship To Card
  let curY = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 28, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO / SHIP TO (RECIPIENT):', 18, curY + 6);
  doc.text('GST STATUTORY 70:30 SPLIT DETAILS:', 110, curY + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(docItem.customerName || 'Valued Customer', 18, curY + 12);
  doc.text(`${docItem.systemCapacityKw || 5} kW Grid-Tied Solar RTS System`, 110, curY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(docItem.customerPhone ? `Ph: ${docItem.customerPhone}` : 'Contact: On file', 18, curY + 18);
  doc.text(docItem.customerAddress || `${docItem.city || ''}, ${docItem.state || 'Andhra Pradesh'}`, 18, curY + 23);
  doc.text(`Notification No. 24/2018-Central Tax (Rate)`, 110, curY + 18);
  doc.text(`Generated By: ${docItem.userName || 'Admin'} (${docItem.userRole || 'Finance Manager'})`, 110, curY + 23);

  curY += 34;

  // 70:30 Statutory Items Table
  const totalTaxable = docItem.subtotal || (docItem.totalAmount / 1.138);
  const supply70 = totalTaxable * 0.70;
  const service30 = totalTaxable * 0.30;
  const supplyCgst = supply70 * 0.06;
  const supplySgst = supply70 * 0.06;
  const serviceCgst = service30 * 0.09;
  const serviceSgst = service30 * 0.09;

  const tableRows = [
    [
      '1',
      `Supply Component (70%): Grid Connected Solar Rooftop PV Power Plant ${docItem.systemCapacityKw || 5} kW System (Modules, Inverter & Balance of System)`,
      '85414300',
      '1 Unit',
      `Rs. ${Math.round(supply70).toLocaleString('en-IN')}`,
      '6%',
      `Rs. ${Math.round(supplyCgst).toLocaleString('en-IN')}`,
      '6%',
      `Rs. ${Math.round(supplySgst).toLocaleString('en-IN')}`,
      `Rs. ${Math.round(supply70 + supplyCgst + supplySgst).toLocaleString('en-IN')}`
    ],
    [
      '2',
      `Service Component (30%): Installation, Erection, Civil Grouting, Testing & Commissioning Services for ${docItem.systemCapacityKw || 5} kW System`,
      '9954',
      '1 Job',
      `Rs. ${Math.round(service30).toLocaleString('en-IN')}`,
      '9%',
      `Rs. ${Math.round(serviceCgst).toLocaleString('en-IN')}`,
      '9%',
      `Rs. ${Math.round(serviceSgst).toLocaleString('en-IN')}`,
      `Rs. ${Math.round(service30 + serviceCgst + serviceSgst).toLocaleString('en-IN')}`
    ]
  ];

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Description of Goods & Services', 'HSN/SAC', 'Qty', 'Taxable Val', 'CGST%', 'CGST Amt', 'SGST%', 'SGST Amt', 'Total (Rs)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 24, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || curY + 60;
  curY = finalTableY + 6;

  // Bank Details Box (Left)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, 105, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("COMPANY'S BANK DETAILS:", 18, curY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank Name: State Bank of India`, 18, curY + 12);
  doc.text(`Account Name: ${docItem.companyName || 'Meta Green Solar Solutions LLP'}`, 18, curY + 17);
  doc.text(`A/C No: 44513337275 | IFSC: SBIN0012948`, 18, curY + 22);
  doc.text(`Branch: Pantakalava Road, Vijayawada`, 18, curY + 27);
  doc.text(`Declaration: Values stated are true, accurate and complete.`, 18, curY + 32);

  // Financial Grand Total Box (Right)
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(123, curY, 73, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('TOTAL TAX INVOICE AMOUNT', 127, curY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  const totalCgst = Math.round(supplyCgst + serviceCgst);
  const totalSgst = Math.round(supplySgst + serviceSgst);
  doc.text(`Total Taxable Value: Rs. ${Math.round(totalTaxable).toLocaleString('en-IN')}`, 127, curY + 13);
  doc.text(`Total CGST Amount: Rs. ${totalCgst.toLocaleString('en-IN')}`, 127, curY + 18);
  doc.text(`Total SGST Amount: Rs. ${totalSgst.toLocaleString('en-IN')}`, 127, curY + 23);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`Invoice Total: Rs. ${Number(docItem.totalAmount).toLocaleString('en-IN')}`, 127, curY + 31);

  curY += 42;

  // Statutory Declaration & Signatory
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY DECLARATION:', 14, curY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('We declare that this invoice shows the actual price of the goods and services described and that all particulars are true and correct.', 14, curY + 5);
  doc.text('Whether tax is payable under Reverse Charge: NO. All supply is deemed inter/intra-state under GST rules.', 14, curY + 9);

  // Signature
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - 65, curY + 24, pageWidth - 14, curY + 24);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`For ${docItem.companyName || 'Meta Green Solar'}`, pageWidth - 65, curY + 28);
  doc.text('Authorised Signatory', pageWidth - 65, curY + 32);

  doc.save(`Tax_Invoice_${docItem.docNumber}_${docItem.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Re-download Commercial Invoice or Official Tax Invoice PDF using vector generator
 */
export function downloadInvoiceOrTaxPDF(docItem: GeneratedDocument, logos?: any) {
  if (docItem.type === 'tax-invoice') {
    downloadTaxInvoiceJsPDF(docItem, logos);
  } else {
    downloadCommercialInvoiceJsPDF(docItem, logos);
  }
}

/**
 * Re-download Solar System Estimate & Quotation PDF with 70:30 Statutory Split
 */
export function downloadQuotationPDF(docItem: GeneratedDocument, logos?: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  
  // Header Navy Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(docItem.companyName || logos?.companyName || 'META GREEN SOLAR SOLUTIONS LLP', 14, 15);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('OFFICIAL SOLAR PV SYSTEM ESTIMATE & 70:30 QUOTATION', 14, 23);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.text(`Doc Ref: ${docItem.docNumber} | Consultant: ${docItem.userName || 'MetaGreen'} (${docItem.userRole || 'Sales'})`, 14, 30);

  // Date top right
  const formattedDate = docItem.createdAt?.toDate ? docItem.createdAt.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Date: ${formattedDate}`, pageWidth - 14, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Status: ${(docItem.status || 'Generated').toUpperCase()}`, pageWidth - 14, 23, { align: 'right' });

  // Customer Card & Project Details Box
  let curY = 43;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED FOR CLIENT:', 18, curY + 6);
  doc.text('PROJECT CAPACITY & SPECS:', 110, curY + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(docItem.customerName || 'Valued Customer', 18, curY + 12);
  doc.text(`${docItem.systemCapacityKw || 5} kWp Grid Connected Solar System`, 110, curY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const contactText = [docItem.customerPhone, docItem.customerEmail].filter(Boolean).join(' | ');
  doc.text(contactText || 'Contact: On file', 18, curY + 18);
  doc.text(docItem.customerAddress || `${docItem.city || ''}, ${docItem.state || 'Andhra Pradesh'}`, 18, curY + 23);
  doc.text(`Module Type: ${docItem.metadata?.panelType || 'Monocrystalline Half-Cut PV'}`, 110, curY + 18);
  doc.text(`Inverter: ${docItem.metadata?.inverterType || 'On-Grid String Inverter'}`, 110, curY + 23);

  curY += 32;

  // Equipment Items Table
  const rawItems = docItem.items && docItem.items.length > 0 ? docItem.items : [
    { name: 'Tier-1 Mono PERC Solar PV Modules (540Wp+)', quantity: Math.round((docItem.systemCapacityKw || 5) * 2), unitPrice: Math.round(docItem.totalAmount * 0.45 / Math.max(1, (docItem.systemCapacityKw || 5) * 2)) },
    { name: 'Grid-Tied Solar String Inverter (MPPT)', quantity: 1, unitPrice: Math.round(docItem.totalAmount * 0.15) },
    { name: 'Module Mounting HDG Structure (Wind Res. 150 km/h)', quantity: 1, unitPrice: Math.round(docItem.totalAmount * 0.10) },
    { name: 'AC/DC Distribution Box, Cables & Earthing Kit', quantity: 1, unitPrice: Math.round(docItem.totalAmount * 0.10) },
    { name: 'Installation, Civil Works, Testing & Commissioning', quantity: 1, unitPrice: Math.round(docItem.totalAmount * 0.20) }
  ];

  const tableRows = rawItems.map((it: any, i: number) => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unitPrice || it.rate || (docItem.totalAmount / rawItems.length));
    const total = it.amount ? Number(it.amount) : qty * price;
    return [
      String(i + 1),
      it.description || it.name || 'Solar PV Hardware / Service Component',
      String(qty),
      `Rs. ${price.toLocaleString('en-IN')}`,
      `Rs. ${total.toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Item & Equipment Description', 'Qty', 'Unit Rate', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || curY + 60;
  curY = finalTableY + 6;

  // 70:30 Statutory Tax Split Summary Box (Left)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, 105, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY 70:30 SPLIT SUMMARY:', 18, curY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const supplyVal = docItem.totalAmount * 0.70;
  const serviceVal = docItem.totalAmount * 0.30;
  doc.text(`- Supply Component (70%): Rs. ${Math.round(supplyVal).toLocaleString('en-IN')} (GST @ 12%)`, 18, curY + 12);
  doc.text(`- Service & Installation (30%): Rs. ${Math.round(serviceVal).toLocaleString('en-IN')} (GST @ 18%)`, 18, curY + 18);
  doc.text(`- Composite Effective GST Rate: ~13.80%`, 18, curY + 24);
  doc.text(`- Net Govt. Subsidy Eligible: Up to Rs. 78,000`, 18, curY + 29);

  // Financial Grand Total Box (Right)
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(123, curY, 73, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('TOTAL FINANCIAL SUMMARY', 127, curY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  const subTotal = docItem.subtotal || Math.round(docItem.totalAmount / 1.138);
  const gstTax = docItem.taxAmount || (docItem.totalAmount - subTotal);
  doc.text(`Taxable Subtotal: Rs. ${subTotal.toLocaleString('en-IN')}`, 127, curY + 13);
  doc.text(`Estimated Taxes (GST): Rs. ${gstTax.toLocaleString('en-IN')}`, 127, curY + 19);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`Total Value: Rs. ${Number(docItem.totalAmount).toLocaleString('en-IN')}`, 127, curY + 27);

  curY += 38;

  // Commercial Terms & Signatures
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('COMMERCIAL TERMS & WARRANTY:', 14, curY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('1. 25 Years Performance Warranty on Solar PV Modules (min 80% output at 25 yrs).', 14, curY + 5);
  doc.text('2. 5 Years Comprehensive Warranty on Grid-Tied Inverter & System Workmanship.', 14, curY + 9);
  doc.text('3. Payment Terms: 30% Advance with Purchase Order, 60% on Material Delivery, 10% after Net Metering.', 14, curY + 13);
  doc.text('4. Estimate is valid for 15 days from issue date.', 14, curY + 17);

  // Signature lines
  doc.setDrawColor(203, 213, 225);
  doc.line(14, curY + 32, 60, curY + 32);
  doc.line(pageWidth - 65, curY + 32, pageWidth - 14, curY + 32);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Acceptance Signature', 14, curY + 36);
  doc.text(`For ${docItem.companyName || 'Meta Green Solar'}`, pageWidth - 65, curY + 36);

  doc.save(`Quotation_${docItem.docNumber}_${docItem.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Re-download Solar Proposal PDF with Feasibility & Financial Payback
 */
export function downloadProposalPDF(docItem: GeneratedDocument, logos?: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  
  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(docItem.companyName || logos?.companyName || 'META GREEN SOLAR SOLUTIONS', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153);
  doc.text('SOLAR PHOTOVOLTAIC (PV) TECHNO-COMMERCIAL FEASIBILITY PROPOSAL', 14, 23);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Proposal Ref: ${docItem.docNumber} | Consultant: ${docItem.userName || 'MetaGreen'}`, 14, 30);

  const formattedDate = docItem.createdAt?.toDate ? docItem.createdAt.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Date: ${formattedDate}`, pageWidth - 14, 15, { align: 'right' });

  let curY = 43;
  const capacityKw = docItem.systemCapacityKw || 5;
  const dailyUnits = (capacityKw * 4.2).toFixed(1);
  const monthlyUnits = Math.round(capacityKw * 126);
  const annualUnits = Math.round(capacityKw * 1512);
  const monthlySavings = Math.round(monthlyUnits * 7.5);
  const annualSavings = Math.round(annualUnits * 7.5);
  const co2Offset = (capacityKw * 1.25).toFixed(1);

  // Client Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PROPOSAL PREPARED EXCLUSIVELY FOR:', 18, curY + 6);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${docItem.customerName} | ${docItem.customerPhone || ''}`, 18, curY + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(docItem.customerAddress || `${docItem.city || ''}, ${docItem.state || 'Andhra Pradesh'}`, 18, curY + 17);

  curY += 28;

  // Key KPI Cards (4 columns)
  const kpis = [
    { title: 'RECOMMENDED CAPACITY', val: `${capacityKw} kWp System` },
    { title: 'EST. MONTHLY UNITS', val: `${monthlyUnits} kWh / Mo` },
    { title: 'EST. ANNUAL SAVINGS', val: `Rs. ${annualSavings.toLocaleString('en-IN')}` },
    { title: 'ANNUAL CO2 OFFSET', val: `${co2Offset} Tons / Yr` }
  ];

  const cardW = (pageWidth - 28 - 9) / 4;
  kpis.forEach((k, idx) => {
    const kX = 14 + idx * (cardW + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(kX, curY, cardW, 18, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, kX + cardW / 2, curY + 6, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(k.val, kX + cardW / 2, curY + 13, { align: 'center' });
  });

  curY += 24;

  // Generation & Financial Breakdown Table
  const subsidyVal = Math.min(78000, capacityKw >= 3 ? 78000 : capacityKw * 30000);
  const netInvestment = Math.max(0, docItem.totalAmount - subsidyVal);

  const proposalRows = [
    ['System Type & Grid Configuration', 'On-Grid Rooftop Solar PV with Net Metering'],
    ['Solar PV Module Specifications', 'High-Efficiency Tier-1 Bifacial / Mono PERC (540Wp+)'],
    ['Solar Inverter Technology', 'Three-Phase / Single-Phase On-Grid String Inverter (>98% Eff.)'],
    ['Estimated Daily Energy Yield', `~${dailyUnits} Units / Day`],
    ['Estimated 25-Year Cumulative Output', `${(annualUnits * 25).toLocaleString('en-IN')} Units (kWh)`],
    ['Estimated 25-Year Electricity Bill Savings', `Rs. ${(annualSavings * 25).toLocaleString('en-IN')}`],
    ['Gross Project Value (Incl. 70:30 GST)', `Rs. ${Number(docItem.totalAmount).toLocaleString('en-IN')}`],
    ['Central Govt. PM Surya Ghar Subsidy', `Rs. ${subsidyVal.toLocaleString('en-IN')}`],
    ['Net Customer Investment After Subsidy', `Rs. ${netInvestment.toLocaleString('en-IN')}`],
    ['Estimated Simple Payback Period', '~3.2 to 3.8 Years']
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Feasibility Parameter', 'Engineering & Financial Details']],
    body: proposalRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || curY + 90;
  curY = finalTableY + 8;

  // Environmental Impact & Next Steps
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, curY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('ENVIRONMENTAL CONTRIBUTION & NEXT STEPS:', 18, curY + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text(`1. Environmental Effect: Installing this ${capacityKw} kWp system is equivalent to planting ~${Math.round(capacityKw * 35)} fully grown trees.`, 18, curY + 13);
  doc.text('2. Approvals & DISCOM Liaison: Meta Green handles entire Net Metering application and CEIG/DISCOM approvals.', 18, curY + 18);
  doc.text('3. Direct Subsidy Credit: Central Government subsidy is directly deposited into client bank account post-commissioning.', 18, curY + 23);

  doc.save(`Proposal_${docItem.docNumber}_${docItem.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Universal document re-download dispatcher
 * Intelligently downloads the previously generated / requested document
 * with the client's exact data, items, calculations, and branding.
 */
export function downloadDocumentPDF(docItem: GeneratedDocument, logos?: any) {
  // If hosted/external PDF URL exists
  if (docItem.pdfUrl && (docItem.pdfUrl.startsWith('http://') || docItem.pdfUrl.startsWith('https://') || docItem.pdfUrl.startsWith('blob:'))) {
    const a = document.createElement('a');
    a.href = docItem.pdfUrl;
    a.download = `${docItem.type.toUpperCase()}_${docItem.docNumber}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Commercial Invoice or Tax Invoice
  if (docItem.type === 'invoice' || docItem.type === 'tax-invoice') {
    downloadInvoiceOrTaxPDF(docItem, logos);
    return;
  }

  // Quotation
  if (docItem.type === 'quotation') {
    downloadQuotationPDF(docItem, logos);
    return;
  }

  // Proposal
  if (docItem.type === 'proposal') {
    downloadProposalPDF(docItem, logos);
    return;
  }
}
