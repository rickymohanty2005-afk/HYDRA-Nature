import { Order } from '../types';

/* ==========================================================================
 * EDIT THESE CONSTANTS TO CHANGE THE LOOK OF THE INVOICE
 * ========================================================================== */

/** Logo appearance. Change `shape` to 'plain' | 'rounded' | 'circle'. */
const LOGO_CONFIG = {
  /** URL of the logo (transparent PNG recommended). */
  src: '/images/home/Logo.png',
  /**
   * 'rounded' -> white logo inside a green rounded badge (default)
   * 'circle'  -> white logo inside a green circular badge
   * 'plain'   -> green logo with no background container
   */
  shape: 'rounded' as 'plain' | 'rounded' | 'circle',
  /** Badge / bounding-box size in invoice units (page is 1400 wide). */
  rounded: { width: 250, height: 96, padding: 20, radius: 18 },
  circle: { diameter: 108, padding: 24 },
  plain: { maxWidth: 240, maxHeight: 84 },
};

const COMPANY = {
  name: 'Hydra Luxury Botanical Skincare Private Limited',
  tagline: 'NATURE • SCIENCE • RADIANCE  |  CLINICAL BOTANICAL FORMULATIONS',
  gstin: '27AABCH1234F1Z8',
  cin: 'U24246MH2024PTC392811',
  fssai: '11522000000000',
  address: 'Regd Office: BKC Corporate Hub, Bandra East, Mumbai, Maharashtra 400051',
  email: 'concierge@hydraskincare.com',
  phone: '+91 (800) 493-7200',
  hours: 'Mon - Sat (9:00 AM - 8:00 PM IST)',
  website: 'www.hydraskincare.com',
};

const COLORS = {
  green: '#13382B',
  greenMid: '#2E6B48',
  gold: '#C2A264',
  paper: '#FCFBF8',
  card: '#FAF8F4',
  border: '#EAE4D9',
  borderSoft: '#F0EBE1',
  textDark: '#1A211D',
  textBody: '#3E4D44',
  textMuted: '#6F7E75',
  textFaint: '#8A968E',
  white: '#FFFFFF',
};

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const SERIF = '"Playfair Display", Georgia, serif';

/** Logical page size (A4 ratio). Rendered at SCALE x for print-sharp output. */
const PAGE_W = 1400;
const PAGE_H = 1980;
const SCALE = 2;

const ITEMS_PER_PAGE = 8;

/* ==========================================================================
 * Helpers
 * ========================================================================== */

const font = (weight: string | number, size: number, serif = false, italic = false) =>
  `${italic ? 'italic ' : ''}${weight} ${size}px ${serif ? SERIF : SANS}`;

const inr = (n: number) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Shortens text with an ellipsis so it never exceeds maxWidth. */
const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
};

/** Indian-system amount in words, e.g. 12,450.50 -> "Twelve Thousand Four Hundred Fifty Rupees and Fifty Paise Only" */
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n: number): string =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;

const threeDigits = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${h ? `${ONES[h]} Hundred${r ? ' ' : ''}` : ''}${r ? twoDigits(r) : ''}`;
};

export const amountInWords = (amount: number): string => {
  const totalPaise = Math.round(Math.abs(Number(amount) || 0) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let n = rupees;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));

  let out = rupees ? `${parts.join(' ')} ${rupees === 1 ? 'Rupee' : 'Rupees'}` : '';
  if (paise) out += `${rupees ? ' and ' : ''}${twoDigits(paise)} Paise`;
  return `${out} Only`;
};

/** Makes sure web fonts are ready before drawing, otherwise canvas falls back to Georgia. */
const ensureFonts = async (): Promise<void> => {
  try {
    const fonts = (typeof document !== 'undefined' ? (document as any).fonts : null) as FontFaceSet | null;
    if (fonts?.load) {
      await Promise.all([
        fonts.load(`bold 30px ${SERIF}`),
        fonts.load(`italic 16px ${SERIF}`),
      ]);
    }
  } catch {
    // Fall back to system serif silently
  }
};

/**
 * Loads the brand logo.
 */
const loadLogoImage = (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = LOGO_CONFIG.src;
  });
};

/**
 * Creates a recoloured copy of the logo (every visible pixel becomes tintColor).
 * Rendered at SCALE x so the logo stays sharp in print.
 */
const createTintedImage = (
  img: HTMLImageElement,
  pxWidth: number,
  pxHeight: number,
  tintColor: string
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(pxWidth));
  canvas.height = Math.max(1, Math.round(pxHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = tintColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

/**
 * Draws the logo (fitted, never stretched) inside the configured shape.
 * Returns the size of the area used so the header can be laid out beside it.
 */
const drawLogo = (
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement | null,
  x: number,
  centerY: number
): { width: number; height: number } => {
  const { shape } = LOGO_CONFIG;

  // Container size and the inner box the logo must fit in
  let boxW: number;
  let boxH: number;
  let innerW: number;
  let innerH: number;

  if (shape === 'circle') {
    const { diameter, padding } = LOGO_CONFIG.circle;
    boxW = diameter;
    boxH = diameter;
    innerW = diameter - padding * 2;
    innerH = diameter - padding * 2;
  } else if (shape === 'rounded') {
    const { width, height, padding } = LOGO_CONFIG.rounded;
    boxW = width;
    boxH = height;
    innerW = width - padding * 2;
    innerH = height - padding * 2;
  } else {
    const { maxWidth, maxHeight } = LOGO_CONFIG.plain;
    boxW = maxWidth;
    boxH = maxHeight;
    innerW = maxWidth;
    innerH = maxHeight;
  }

  const boxY = centerY - boxH / 2;

  // Container
  if (shape === 'circle') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + boxW / 2, centerY, boxW / 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'rounded') {
    drawRoundedRect(ctx, x, boxY, boxW, boxH, LOGO_CONFIG.rounded.radius, COLORS.green, COLORS.gold, 1.5);
  }

  // Logo itself
  if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
    const ratio = Math.min(innerW / logoImg.width, innerH / logoImg.height);
    const drawW = logoImg.width * ratio;
    const drawH = logoImg.height * ratio;
    const tint = shape === 'plain' ? COLORS.green : COLORS.white;
    const tinted = createTintedImage(logoImg, drawW * SCALE, drawH * SCALE, tint);
    ctx.drawImage(tinted, x + (boxW - drawW) / 2, centerY - drawH / 2, drawW, drawH);
  } else {
    // Fallback wordmark if the image fails to load
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font('bold', 34, true);
    ctx.fillStyle = shape === 'plain' ? COLORS.green : COLORS.white;
    ctx.fillText('HYDRA', x + boxW / 2, centerY);
    ctx.restore();
  }

  return { width: boxW, height: boxH };
};

/**
 * Crisp rounded rectangle.
 */
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth = 1
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
};

/** Vector check mark (replaces emoji, which render differently on every device). */
const drawCheck = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  lineWidth = 2
) => {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(cx - size * 0.45, cy);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.35);
  ctx.lineTo(cx + size * 0.5, cy - size * 0.35);
  ctx.stroke();
  ctx.restore();
};

/** Circle with a check mark inside, used for the info banners. */
const drawCheckBadge = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  drawCheck(ctx, cx, cy, r * 0.9, color, 2.2);
};

/* ==========================================================================
 * PDF assembly (unchanged logic)
 * ========================================================================== */

/**
 * Generates an ISO/RFC-compliant PDF 1.4 binary file embedding page JPEGs
 */
const createPdfBinary = (
  pages: { jpegBytes: Uint8Array; width: number; height: number }[]
): Uint8Array => {
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const encoder = new TextEncoder();

  function pushString(str: string) {
    const bytes = encoder.encode(str);
    parts.push(bytes);
    currentOffset += bytes.length;
  }

  function pushBytes(bytes: Uint8Array) {
    parts.push(bytes);
    currentOffset += bytes.length;
  }

  pushString('%PDF-1.4\n');
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const pageCount = pages.length;
  const totalObjs = 2 + pageCount * 3;
  const kidsStr = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');

  offsets[1] = currentOffset;
  pushString(`1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n`);

  offsets[2] = currentOffset;
  pushString(`2 0 obj\n<<\n  /Type /Pages\n  /Kids [${kidsStr}]\n  /Count ${pageCount}\n>>\nendobj\n`);

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 3 + i * 3;
    const imgObjId = 4 + i * 3;
    const contentObjId = 5 + i * 3;
    const { jpegBytes, width, height } = pages[i];

    offsets[pageObjId] = currentOffset;
    pushString(
      `${pageObjId} 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 595.28 841.89]\n  /Resources <<\n    /ProcSet [/PDF /ImageC]\n    /XObject <<\n      /Im${i + 1} ${imgObjId} 0 R\n    >>\n  >>\n  /Contents ${contentObjId} 0 R\n>>\nendobj\n`
    );

    offsets[imgObjId] = currentOffset;
    pushString(
      `${imgObjId} 0 obj\n<<\n  /Type /XObject\n  /Subtype /Image\n  /Width ${width}\n  /Height ${height}\n  /ColorSpace /DeviceRGB\n  /BitsPerComponent 8\n  /Filter /DCTDecode\n  /Length ${jpegBytes.length}\n>>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushString('\nendstream\nendobj\n');

    const contentStream = `q\n595.28 0 0 841.89 0 0 cm\n/Im${i + 1} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    offsets[contentObjId] = currentOffset;
    pushString(
      `${contentObjId} 0 obj\n<<\n  /Length ${contentBytes.length}\n>>\nstream\n${contentStream}endstream\nendobj\n`
    );
  }

  const startXref = currentOffset;
  pushString(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let objId = 1; objId <= totalObjs; objId++) {
    const off = offsets[objId] || 0;
    const offStr = off.toString().padStart(10, '0');
    pushString(`${offStr} 00000 n \n`);
  }

  pushString(
    `trailer\n<<\n  /Size ${totalObjs + 1}\n  /Root 1 0 R\n>>\nstartxref\n${startXref}\n%%EOF\n`
  );

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
};

const canvasToJpegBytes = (canvas: HTMLCanvasElement): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas serialization failed'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(new Uint8Array(reader.result));
          } else {
            reject(new Error('FileReader returned non-ArrayBuffer'));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      },
      'image/jpeg',
      0.95
    );
  });
};

/* ==========================================================================
 * Invoice page renderer
 * ========================================================================== */

const renderInvoicePageCanvas = (
  order: Order,
  pageItems: Order['items'],
  pageIndex: number,
  totalPages: number,
  logoImg: HTMLImageElement | null
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W * SCALE;
  canvas.height = PAGE_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Draw everything in logical units; the canvas itself is SCALE x sharper.
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.textBaseline = 'alphabetic';

  const isStoreVisit = Boolean(
    (order as any).isStoreVisit ||
      (order.orderNumber &&
        (order.orderNumber.startsWith('HYD-POS') || order.orderNumber.startsWith('HYD-VISIT')))
  );
  const isCod = (order.paymentMethod || '').toLowerCase() === 'cod';
  const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
  const isCancelled = (order.status || '').toLowerCase() === 'cancelled';

  // 1. Background and frame
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  drawRoundedRect(ctx, 40, 40, 1320, 1900, 20, undefined, COLORS.border, 1.5);
  drawRoundedRect(ctx, 52, 52, 1296, 1876, 16, COLORS.white, COLORS.borderSoft, 1);
  drawRoundedRect(ctx, 52, 52, 1296, 8, 4, COLORS.green);

  // 2. Header — logo on the left, company details beside it
  const HEADER_CENTER_Y = 142;
  const logoBox = drawLogo(ctx, logoImg, 85, HEADER_CENTER_Y);
  const textX = 85 + logoBox.width + 28;

  ctx.textAlign = 'left';
  ctx.font = font('bold', 17, true);
  ctx.fillStyle = COLORS.green;
  ctx.fillText(COMPANY.name, textX, 104);

  ctx.font = font(600, 10);
  ctx.fillStyle = COLORS.greenMid;
  ctx.fillText(COMPANY.tagline, textX, 126);

  ctx.font = font(400, 11);
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(`GSTIN: ${COMPANY.gstin}   |   FSSAI: ${COMPANY.fssai}`, textX, 152);
  ctx.fillText(`CIN: ${COMPANY.cin}`, textX, 170);
  ctx.fillText(COMPANY.address, textX, 188);

  // Right: invoice title and references
  ctx.textAlign = 'right';
  ctx.font = font('bold', 30, true);
  ctx.fillStyle = COLORS.green;
  ctx.fillText(isStoreVisit ? 'STORE TAX INVOICE' : 'TAX INVOICE', 1315, 115);

  ctx.font = font(600, 13);
  ctx.fillStyle = COLORS.textDark;
  const invoiceNoDisplay =
    order.orderNumber.startsWith('INV-') || order.orderNumber.startsWith('HYD-')
      ? order.orderNumber
      : `INV-${order.orderNumber}`;
  ctx.fillText(`Invoice No: ${invoiceNoDisplay}`, 1315, 142);

  ctx.font = font(400, 12);
  ctx.fillStyle = '#5F6E65';
  ctx.fillText(isStoreVisit ? `Counter Ref: #${order.orderNumber}` : `Order Ref: #${order.orderNumber}`, 1315, 162);

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  ctx.fillText(`Invoice Date: ${formattedDate}`, 1315, 180);

  // Status badge
  let badge = { bg: '#EBF5EE', border: '#B7DEC4', text: '#1E5A38', label: 'PAYMENT RECEIVED (PREPAID)', check: true };
  if (isStoreVisit) {
    badge = {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#047857',
      label: `PAID IN STORE (${(order.paymentMethod || 'cash').toUpperCase()})`,
      check: true,
    };
  } else if (isCancelled) {
    badge = { bg: '#FEF2F2', border: '#F87171', text: '#DC2626', label: 'ORDER CANCELLED', check: false };
  } else if (isCod) {
    badge = isPaid
      ? { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', label: 'COD PAYMENT COLLECTED', check: true }
      : { bg: '#FEF7ED', border: '#FCD34D', text: '#9A3412', label: 'CASH ON DELIVERY (PENDING)', check: false };
  } else if (!isPaid) {
    badge = { bg: '#FEF9C3', border: '#FACC15', text: '#854D0E', label: 'PAYMENT PENDING', check: false };
  }

  const badgeW = 250;
  const badgeH = 28;
  const badgeX = 1315 - badgeW;
  const badgeY = 198;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 14, badge.bg, badge.border, 1);
  ctx.font = font('bold', 10);
  ctx.fillStyle = badge.text;
  ctx.textAlign = 'center';
  const labelCenterX = badgeX + badgeW / 2 + (badge.check ? 8 : 0);
  ctx.fillText(badge.label, labelCenterX, badgeY + 18);
  if (badge.check) {
    const labelW = ctx.measureText(badge.label).width;
    drawCheck(ctx, labelCenterX - labelW / 2 - 14, badgeY + 14, 8, badge.text, 2);
  }

  // 3. Double separator
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2;
  ctx.moveTo(85, 248);
  ctx.lineTo(1315, 248);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1;
  ctx.moveTo(85, 252);
  ctx.lineTo(1315, 252);
  ctx.stroke();
  ctx.restore();

  // 4. Information cards
  const cardY = 268;
  const cardH = 175;
  const cardW = 595;

  drawRoundedRect(ctx, 85, cardY, cardW, cardH, 12, COLORS.card, COLORS.border, 1);

  ctx.textAlign = 'left';
  ctx.font = font('bold', 11);
  ctx.fillStyle = COLORS.greenMid;
  ctx.fillText(isStoreVisit ? 'BILL TO / WALK-IN PATRON' : 'BILL TO / SHIPPING DESTINATION', 105, cardY + 28);

  ctx.font = font('bold', 15);
  ctx.fillStyle = COLORS.green;
  const customerDisplayName =
    order.shippingAddress?.fullName ||
    (order.shippingAddress as any)?.name ||
    (order.user as any)?.name ||
    'Walk-in Patron';
  ctx.fillText(fitText(ctx, customerDisplayName, cardW - 40), 105, cardY + 52);

  ctx.font = font(400, 12);
  ctx.fillStyle = COLORS.textBody;
  const aptText = order.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : '';
  const streetDisplay = order.shippingAddress?.street
    ? `${order.shippingAddress.street}${aptText}`
    : isStoreVisit
    ? 'Physical Boutique Walk-in Purchase'
    : 'Standard Delivery';
  ctx.fillText(fitText(ctx, streetDisplay, cardW - 40), 105, cardY + 76);

  const cityDisplay = isStoreVisit
    ? `${order.shippingAddress?.city || 'Hydra Flagship Boutique'}`
    : `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.postalCode || ''}`;
  ctx.fillText(fitText(ctx, cityDisplay, cardW - 40), 105, cardY + 98);
  ctx.fillText(
    isStoreVisit ? 'Boutique Over-the-Counter Handover' : order.shippingAddress?.country || 'India',
    105,
    cardY + 120
  );

  ctx.font = font(600, 12);
  ctx.fillStyle = COLORS.green;
  ctx.fillText(
    `Contact: +91 ${order.shippingAddress?.phone || (order as any).customerPhone || 'N/A'}`,
    105,
    cardY + 146
  );

  const card2X = 720;
  drawRoundedRect(ctx, card2X, cardY, cardW, cardH, 12, COLORS.card, COLORS.border, 1);

  ctx.font = font('bold', 11);
  ctx.fillStyle = COLORS.greenMid;
  ctx.fillText(
    isStoreVisit ? 'STORE LOCATION & PAYMENT SPECS' : 'ORDER LOGISTICS & PAYMENT SPECIFICATIONS',
    card2X + 20,
    cardY + 28
  );

  const logisticsRows = isStoreVisit
    ? [
        { label: 'Sales Channel:', val: 'Physical Flagship Store Walk-in' },
        { label: 'Store Location:', val: order.shippingAddress?.city || 'Hydra Flagship Store' },
        { label: 'Payment Method:', val: (order.paymentMethod || 'Cash').toUpperCase() },
        { label: 'Attending Staff:', val: (order as any).servedByName || 'Boutique Administrator' },
        { label: 'Handover Status:', val: 'HANDED OVER OVER-THE-COUNTER' },
      ]
    : [
        { label: 'Payment Gateway:', val: isCod ? 'Cash on Delivery (COD)' : 'Razorpay Official Online' },
        {
          label: 'Transaction ID:',
          val: order.paymentDetails?.razorpayPaymentId || (isCod ? 'Pending at Delivery' : 'Verified'),
        },
        { label: 'Courier Partner:', val: order.shiprocket?.courierName || 'Priority Air Express Courier' },
        {
          label: 'AWB Tracking Code:',
          val: order.shiprocket?.awbCode || order.trackingNumber || 'SR-PRIORITY-DISPATCH',
        },
        { label: 'Fulfillment Status:', val: (order.status || 'placed').toUpperCase() },
      ];

  logisticsRows.forEach((row, rIdx) => {
    const curY = cardY + 54 + rIdx * 22;
    ctx.font = font(600, 12);
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(row.label, card2X + 20, curY);

    ctx.fillStyle = COLORS.textDark;
    ctx.fillText(fitText(ctx, String(row.val), cardW - 165 - 20), card2X + 165, curY);
  });

  // 5. Items table
  const tableY = 465;
  const tableH = 42;
  const tableW = 1230;

  drawRoundedRect(ctx, 85, tableY, tableW, tableH, 8, COLORS.green);

  ctx.font = font('bold', 11);
  ctx.fillStyle = '#FAF9F6';
  ctx.textAlign = 'center';
  ctx.fillText('#', 115, tableY + 26);
  ctx.textAlign = 'left';
  ctx.fillText('FORMULATION & ACTIVE BOTANICAL ITEM', 165, tableY + 26);
  ctx.textAlign = 'center';
  ctx.fillText('VOLUME', 740, tableY + 26);
  ctx.fillText('QTY', 840, tableY + 26);
  ctx.textAlign = 'right';
  ctx.fillText('UNIT PRICE', 1040, tableY + 26);
  ctx.fillText('NET AMOUNT', 1285, tableY + 26);

  const rowHeight = 56;
  pageItems.forEach((item, idx) => {
    const itemRowY = tableY + tableH + idx * rowHeight;

    ctx.fillStyle = idx % 2 === 0 ? COLORS.white : '#FAF8F5';
    ctx.fillRect(85, itemRowY, tableW, rowHeight);

    ctx.beginPath();
    ctx.strokeStyle = '#EFEBE4';
    ctx.lineWidth = 1;
    ctx.moveTo(85, itemRowY + rowHeight);
    ctx.lineTo(1315, itemRowY + rowHeight);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = font(600, 12);
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(`${pageIndex * ITEMS_PER_PAGE + idx + 1}`, 115, itemRowY + 33);

    ctx.textAlign = 'left';
    ctx.font = font('bold', 13);
    ctx.fillStyle = COLORS.green;
    ctx.fillText(fitText(ctx, item.name, 520), 165, itemRowY + 25);

    ctx.font = font(400, 10);
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText('Clinically validated pure organic bio-active extract', 165, itemRowY + 42);

    ctx.textAlign = 'center';
    ctx.font = font(500, 12);
    ctx.fillStyle = COLORS.textBody;
    ctx.fillText(item.size || '50ml', 740, itemRowY + 33);

    ctx.font = font('bold', 13);
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText(`${item.quantity}`, 840, itemRowY + 33);

    ctx.textAlign = 'right';
    ctx.font = font(500, 13);
    ctx.fillStyle = COLORS.textBody;
    ctx.fillText(inr(item.price), 1040, itemRowY + 33);

    ctx.font = font('bold', 14);
    ctx.fillStyle = COLORS.green;
    ctx.fillText(inr(item.price * item.quantity), 1285, itemRowY + 33);
  });

  const itemsEndRowY = tableY + tableH + pageItems.length * rowHeight;
  ctx.beginPath();
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 1.5;
  ctx.moveTo(85, itemsEndRowY);
  ctx.lineTo(1315, itemsEndRowY);
  ctx.stroke();

  // 6. Summary (last page only) — sits directly under the table
  if (pageIndex === totalPages - 1) {
    const summaryStartY = itemsEndRowY + 40;
    const leftBlockW = 580;

    // Banner
    const bannerBg = isStoreVisit || (isCod && isPaid) ? '#ECFDF5' : COLORS.card;
    const bannerBorder = isStoreVisit || (isCod && isPaid) ? '#A7F3D0' : COLORS.border;
    const bannerAccent = isStoreVisit || (isCod && isPaid) ? '#047857' : COLORS.green;
    drawRoundedRect(ctx, 85, summaryStartY, leftBlockW, 64, 10, bannerBg, bannerBorder, 1.5);
    drawCheckBadge(ctx, 113, summaryStartY + 32, 13, bannerAccent);

    let bannerTitle = '100% CLINICAL BOTANICAL AUTHENTICITY';
    let bannerBody = 'Batch tested, cold-pressed bioactive formulations. Cruelty-free & dermatologist approved.';
    if (isStoreVisit) {
      bannerTitle = 'PHYSICAL BOUTIQUE PURCHASE — OVER-THE-COUNTER';
      bannerBody = 'Formulation inspected, sealed, and handed directly to patron at Hydra Flagship Boutique.';
    } else if (isCod && isPaid) {
      bannerTitle = 'COD PAYMENT COLLECTED & RECONCILED';
      bannerBody = 'Cash on Delivery payment has been marked as received and verified by courier.';
    }
    ctx.textAlign = 'left';
    ctx.font = font('bold', 12);
    ctx.fillStyle = isStoreVisit || (isCod && isPaid) ? '#065F46' : COLORS.green;
    ctx.fillText(bannerTitle, 140, summaryStartY + 27);
    ctx.font = font(400, 11);
    ctx.fillStyle = isStoreVisit || (isCod && isPaid) ? '#047857' : COLORS.textMuted;
    ctx.fillText(fitText(ctx, bannerBody, leftBlockW - 70), 140, summaryStartY + 48);

    // Concierge box
    const careY = summaryStartY + 80;
    drawRoundedRect(ctx, 85, careY, leftBlockW, 76, 10, COLORS.card, COLORS.border, 1);
    ctx.font = font('bold', 12);
    ctx.fillStyle = COLORS.greenMid;
    ctx.fillText('HYDRA CLIENT CONCIERGE & SUPPORT', 105, careY + 26);
    ctx.font = font(400, 11);
    ctx.fillStyle = COLORS.textBody;
    ctx.fillText(
      isStoreVisit
        ? `Boutique Inquiries & Concierge: ${COMPANY.email}`
        : `Inquiries, routine advice or returns: ${COMPANY.email}`,
      105,
      careY + 45
    );
    ctx.fillText(`Direct Support Line: ${COMPANY.phone}  |  ${COMPANY.hours}`, 105, careY + 62);

    // Totals card
    const summaryRightX = 720;
    const summaryRightW = 595;
    drawRoundedRect(ctx, summaryRightX, summaryStartY, summaryRightW, 156, 12, COLORS.card, COLORS.border, 1);

    const subtotalVal =
      typeof order.subtotal === 'number' ? order.subtotal : Number((order as any).subtotalAmount) || 0;
    const discountVal =
      typeof order.discount === 'number' ? order.discount : Number((order as any).discountAmount) || 0;
    const taxVal = Number((order as any).taxAmount) || 0;
    const totalVal =
      typeof order.total === 'number'
        ? order.total
        : Number((order as any).totalAmount) || Math.max(0, subtotalVal - discountVal + taxVal);

    const calcRows = isStoreVisit
      ? [
          { label: 'Formulations Subtotal:', val: inr(subtotalVal), isGreen: false },
          { label: 'Store Visit Discount:', val: discountVal > 0 ? `-${inr(discountVal)}` : '₹0', isGreen: true },
          { label: 'Delivery / Handover:', val: 'In-Store Handover (Complimentary)', isGreen: true },
          {
            label: 'Integrated Taxes (GST):',
            val: taxVal > 0 ? inr(taxVal) : 'Included in Item MRP',
            isGreen: false,
          },
        ]
      : [
          { label: 'Formulations Subtotal:', val: inr(subtotalVal), isGreen: false },
          {
            label: `Voucher Discount (${order.couponCode || 'APPLIED'}):`,
            val: discountVal > 0 ? `-${inr(discountVal)}` : '₹0',
            isGreen: true,
          },
          { label: 'Priority Courier Shipping:', val: 'FREE (Complimentary)', isGreen: true },
          { label: 'Integrated GST (18% Inclusive):', val: 'Included in Item MRP', isGreen: false },
        ];

    calcRows.forEach((r, idx) => {
      const lineY = summaryStartY + 30 + idx * 28;
      ctx.textAlign = 'left';
      ctx.font = font(500, 13);
      ctx.fillStyle = '#5F6E65';
      ctx.fillText(r.label, summaryRightX + 24, lineY);

      ctx.textAlign = 'right';
      ctx.font = font('bold', 13);
      ctx.fillStyle = r.isGreen ? COLORS.greenMid : COLORS.textDark;
      ctx.fillText(r.val, summaryRightX + summaryRightW - 24, lineY);
    });

    // Grand total
    const totalBoxY = summaryStartY + 168;
    const totalBoxH = 68;
    drawRoundedRect(ctx, summaryRightX, totalBoxY, summaryRightW, totalBoxH, 12, COLORS.green, COLORS.gold, 1.5);

    ctx.textAlign = 'left';
    ctx.font = font('bold', 14);
    ctx.fillStyle = '#FAF9F6';
    const totalTitle = isStoreVisit
      ? 'GRAND TOTAL (PAID IN STORE)'
      : isCod && !isPaid
      ? 'GRAND TOTAL (PAYABLE ON DELIVERY)'
      : 'GRAND TOTAL (PAID)';
    ctx.fillText(totalTitle, summaryRightX + 24, totalBoxY + 41);

    ctx.textAlign = 'right';
    ctx.font = font('bold', 26, true);
    ctx.fillStyle = COLORS.white;
    ctx.fillText(inr(totalVal), summaryRightX + summaryRightW - 24, totalBoxY + 44);

    // Amount in words
    const wordsY = summaryStartY + 252;
    drawRoundedRect(ctx, 85, wordsY, 1230, 50, 10, COLORS.card, COLORS.border, 1);
    ctx.textAlign = 'left';
    ctx.font = font('bold', 10);
    ctx.fillStyle = COLORS.greenMid;
    ctx.fillText('AMOUNT IN WORDS', 105, wordsY + 21);
    ctx.font = font(600, 13);
    ctx.fillStyle = COLORS.green;
    ctx.fillText(fitText(ctx, amountInWords(totalVal), 1190), 105, wordsY + 40);

    // Seal and signature
    const stampY = summaryStartY + 332;

    ctx.save();
    ctx.beginPath();
    ctx.arc(190, stampY + 40, 48, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(190, stampY + 40, 42, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = font('bold', 8);
    ctx.fillStyle = COLORS.green;
    ctx.fillText('• HYDRA BOTANICAL •', 190, stampY + 28);
    ctx.font = font('bold', 10, true);
    ctx.fillStyle = COLORS.greenMid;
    ctx.fillText('AUTHENTIC', 190, stampY + 42);
    ctx.font = font('bold', 8);
    ctx.fillStyle = COLORS.green;
    ctx.fillText('TAX INVOICE SEAL', 190, stampY + 56);
    ctx.restore();

    ctx.textAlign = 'right';
    ctx.font = font('bold', 13, true);
    ctx.fillStyle = COLORS.green;
    ctx.fillText('For Hydra Luxury Botanical Skincare Pvt. Ltd.', 1315, stampY + 30);

    ctx.beginPath();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.moveTo(1015, stampY + 62);
    ctx.lineTo(1315, stampY + 62);
    ctx.stroke();

    ctx.font = font(400, 12, true, true);
    ctx.fillStyle = COLORS.greenMid;
    ctx.fillText('Authorized Signatory', 1315, stampY + 80);

    ctx.font = font(400, 10);
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText('Digitally generated & authenticated electronic invoice', 1315, stampY + 96);
  }

  // 7. Footer
  const footerY = 1845;
  ctx.beginPath();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.moveTo(85, footerY);
  ctx.lineTo(1315, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = font(400, 10);
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText(
    'This is a digitally generated legal Tax Invoice issued under Section 31 of the Central Goods and Services Tax Act, 2017.',
    PAGE_W / 2,
    footerY + 22
  );
  ctx.fillText(
    `Page ${pageIndex + 1} of ${totalPages}  •  ${COMPANY.name}  •  ${COMPANY.website}`,
    PAGE_W / 2,
    footerY + 38
  );

  return canvas;
};

/* ==========================================================================
 * Public API (same signatures as before)
 * ========================================================================== */

/**
 * Downloads the Tax Invoice directly as a .pdf file (no new tab, no print dialog)
 */
export const downloadOrderInvoicePdf = async (order: Order): Promise<void> => {
  try {
    const [logoImg] = await Promise.all([loadLogoImage(), ensureFonts()]);

    const items = order.items && order.items.length > 0 ? order.items : [];
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

    const jpegPages: { jpegBytes: Uint8Array; width: number; height: number }[] = [];
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageItems = items.slice(pageIdx * ITEMS_PER_PAGE, (pageIdx + 1) * ITEMS_PER_PAGE);
      const canvas = renderInvoicePageCanvas(order, pageItems, pageIdx, totalPages, logoImg);
      const jpegBytes = await canvasToJpegBytes(canvas);
      jpegPages.push({ jpegBytes, width: canvas.width, height: canvas.height });
    }

    const pdfBytes = createPdfBinary(jpegPages);

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Invoice-${order.orderNumber}.pdf`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 2000);
  } catch (error) {
    console.error('Failed to generate and download invoice PDF:', error);
    alert(`Unable to generate invoice PDF. Please try again or contact ${COMPANY.email}`);
  }
};

/**
 * Downloads a Physical Store Walk-in Customer Tax Invoice directly as a .pdf file
 */
export const downloadStoreVisitInvoicePdf = async (inv: any): Promise<void> => {
  const items = (inv.items || []).map((it: any) => {
    const qty = Math.max(1, Number(it.quantity) || 1);
    const unitPrice = Math.max(0, Number(it.unitPrice !== undefined ? it.unitPrice : it.price) || 0);
    const lineTotal = Math.max(0, Number(it.total) || qty * unitPrice);
    return {
      product: it.product,
      name: it.name || 'Skincare Formulation',
      quantity: qty,
      price: unitPrice,
      total: lineTotal,
      size: it.size || 'Standard',
      sku: it.sku || '',
    };
  });

  const subtotalVal = Number(inv.subtotal) || items.reduce((s: number, i: any) => s + i.total, 0);
  const discountVal = Number(inv.discountAmount) || 0;
  const taxVal = Number(inv.taxAmount) || 0;
  const totalVal = Number(inv.totalAmount) || Math.max(0, subtotalVal - discountVal + taxVal);

  const mappedOrder: any = {
    _id: inv._id,
    orderNumber: inv.invoiceNumber,
    createdAt: inv.createdAt || new Date().toISOString(),
    status: 'delivered',
    paymentStatus: inv.paymentStatus || 'paid',
    paymentMethod: inv.paymentMethod || 'cash',
    isStoreVisit: true,
    servedByName: inv.servedByName || 'Boutique Staff',
    items,
    subtotal: subtotalVal,
    discount: discountVal,
    discountAmount: discountVal,
    shippingAmount: 0,
    taxAmount: taxVal,
    total: totalVal,
    totalAmount: totalVal,
    shippingAddress: {
      fullName: inv.customerName || 'Walk-in Patron',
      name: inv.customerName || 'Walk-in Patron',
      phone: inv.customerPhone || '',
      email: inv.customerEmail || 'store@hydraskincare.com',
      street: inv.customerAddress || 'Physical Boutique Walk-in',
      city: inv.storeLocation || 'Hydra Flagship Boutique',
      state: 'In-Store Counter',
      postalCode: '560001',
      country: 'India',
    },
    user: {
      name: inv.customerName || 'Walk-in Patron',
      email: inv.customerEmail || '',
      phone: inv.customerPhone || '',
    },
  };

  return downloadOrderInvoicePdf(mappedOrder);
};