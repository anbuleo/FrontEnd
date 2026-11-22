import { useRef } from 'react';
import { FiPrinter } from 'react-icons/fi';
import logo from '../assets/skycommlogo1.png';

const formatMoney = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

const formatInvoiceDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  return `${dd}- ${mon} -${d.getFullYear()}`;
};

function GstInvoicePrint({ invoice }) {
  const printRef = useRef(null);

  if (!invoice) return null;

  const seller = invoice.seller || {};
  const buyer = invoice.buyer || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const isInterState = Boolean(invoice.isInterState);

  // Group tax summary by HSN/SAC
  const hsnSummaryMap = new Map();
  const invTaxable = Number(invoice.taxableValue) || 1;
  items.forEach((it) => {
    const code = it.hsnSac || '998422';
    const ratio = (Number(it.amount) || 0) / invTaxable;
    const prev = hsnSummaryMap.get(code) || {
      hsnSac: code,
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
    };
    prev.taxableValue += Number(it.amount) || 0;
    prev.cgstAmount += (Number(invoice.cgstAmount) || 0) * ratio;
    prev.sgstAmount += (Number(invoice.sgstAmount) || 0) * ratio;
    prev.igstAmount += (Number(invoice.igstAmount) || 0) * ratio;
    prev.totalTax += (Number(invoice.totalTax) || 0) * ratio;
    hsnSummaryMap.set(code, prev);
  });
  const hsnRows = Array.from(hsnSummaryMap.values());

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Georgia, serif;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .inv-wrapper { width: 100%; max-width: 780px; margin: 0 auto; position: relative; }
    .inv-box { border: 1.2px solid #000; width: 100%; border-collapse: collapse; }
    .inv-box td, .inv-box th { border: 1px solid #000; padding: 5px 8px; vertical-align: top; font-size: 12.5px; line-height: 1.35; }
    .inv-no-border td { border: none !important; }
    .seller-title { color: #6d28d9; font-weight: 700; font-size: 16px; margin: 0 0 2px 0; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .watermark {
      position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 64px; font-weight: 900; color: rgba(220, 38, 38, 0.22);
      border: 6px solid rgba(220, 38, 38, 0.28); padding: 8px 28px; pointer-events: none;
    }
    .footer-note { text-align: center; font-size: 11.5px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="inv-wrapper">${content}</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <p className="text-sm font-bold text-slate-900">Tax Invoice Preview</p>
          <p className="text-xs text-slate-500">
            {invoice.invoiceNumber} • FY {invoice.financialYear}
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold cursor-pointer"
        >
          <FiPrinter className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Exact Official Sky Communications GST Tax Invoice Layout */}
      <div className="overflow-x-auto bg-slate-100 p-3 sm:p-5 rounded-xl border border-slate-200">
        <div
          ref={printRef}
          className="bg-white text-black mx-auto relative shadow-sm p-3"
          style={{
            maxWidth: '780px',
            fontFamily: '"Times New Roman", Georgia, serif',
            fontSize: '12.5px',
            lineHeight: 1.35,
          }}
        >
          {invoice.isCancelled && (
            <div
              className="watermark"
              style={{
                position: 'absolute',
                top: '42%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-28deg)',
                fontSize: '56px',
                fontWeight: 900,
                color: 'rgba(220, 38, 38, 0.22)',
                border: '5px solid rgba(220, 38, 38, 0.3)',
                padding: '6px 24px',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              CANCELLED
            </div>
          )}

          {/* Header & Buyer Table */}
          <table
            className="inv-box"
            style={{ width: '100%', borderCollapse: 'collapse', border: '1.2px solid #000' }}
          >
            <tbody>
              <tr>
                <td
                  rowSpan={2}
                  style={{ width: '62%', border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img
                      src={logo}
                      alt="Sky Communications"
                      style={{ width: '74px', height: '74px', objectFit: 'contain', flexShrink: 0 }}
                    />
                    <div>
                      <div
                        className="seller-title"
                        style={{ color: '#6d28d9', fontWeight: 700, fontSize: '15.5px', marginBottom: '2px' }}
                      >
                        {seller.companyName || 'Sky Communications Internet Services'}
                      </div>
                      <div>{seller.addressLine1}</div>
                      <div>{seller.addressLine2}</div>
                      <div>{seller.addressLine3}</div>
                      <div>
                        GSTIN/UIN: <b>{seller.gstin}</b>
                      </div>
                      <div>Contact: {seller.contact}</div>
                      <div>E.Mail: {seller.email}</div>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    width: '38%',
                    border: '1px solid #000',
                    padding: '8px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  <div>Invoice No</div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', marginTop: '2px' }}>
                    {invoice.invoiceNumber}
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '8px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  <div>Dated</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>
                    {formatInvoiceDate(invoice.invoiceDate)}
                  </div>
                </td>
              </tr>

              {/* Buyer Details */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '8px 10px' }}>
                  <div style={{ textDecoration: 'underline', fontWeight: 700, marginBottom: '3px' }}>
                    Buyer
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', textTransform: 'uppercase' }}>
                    {buyer.companyName || buyer.contactName}
                  </div>
                  <div style={{ whiteSpace: 'pre-line', maxWidth: '460px' }}>{buyer.address}</div>
                  {buyer.gstin && (
                    <div style={{ fontWeight: 700, marginTop: '3px' }}>GSTIN: {buyer.gstin}</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Particulars & Line Items Table */}
          <table
            className="inv-box"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderLeft: '1.2px solid #000',
              borderRight: '1.2px solid #000',
              borderBottom: '1.2px solid #000',
            }}
          >
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '5px', width: '7%' }}>Sl.No</th>
                <th style={{ border: '1px solid #000', padding: '5px', width: '43%' }}>Particulars</th>
                <th style={{ border: '1px solid #000', padding: '5px', width: '13%' }}>HSN/SAC</th>
                <th style={{ border: '1px solid #000', padding: '5px', width: '10%' }}>Quantity</th>
                <th style={{ border: '1px solid #000', padding: '5px', width: '9%' }}>Rate</th>
                <th style={{ border: '1px solid #000', padding: '5px', width: '6%' }}>per</th>
                <th style={{ border: '1px solid #000', padding: '5px', width: '12%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 6px', textAlign: 'center' }}>
                    {String(idx + 1).padStart(2, '0')}.
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 8px' }}>
                    <div style={{ fontWeight: 700, textAlign: 'center' }}>{it.particulars}</div>
                    {it.periodLabel && (
                      <div style={{ textAlign: 'center', fontSize: '12px' }}>{it.periodLabel}</div>
                    )}
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 6px', textAlign: 'center' }}>
                    {it.hsnSac || '998422'}
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 6px', textAlign: 'center' }}>
                    {it.quantity > 1 ? it.quantity : ''}
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>
                    {it.quantity > 1 ? formatMoney(it.rate) : ''}
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 6px', textAlign: 'center' }}>
                    {it.quantity > 1 ? 'nos' : ''}
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px 8px', textAlign: 'right', fontWeight: 700 }}>
                    {formatMoney(it.amount)}
                  </td>
                </tr>
              ))}

              {/* Tax Output Rows */}
              {!isInterState ? (
                <>
                  <tr>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 6px 2px' }} />
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 8px 2px', textAlign: 'right', fontWeight: 700 }}>
                      SGST {invoice.sgstRate}% OUTPUT
                    </td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }} />
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }} />
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 6px 2px', textAlign: 'right' }}>
                      {invoice.sgstRate}
                    </td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 6px 2px', textAlign: 'center' }}>
                      %
                    </td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 8px 2px', textAlign: 'right', fontWeight: 700 }}>
                      {formatMoney(invoice.sgstAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '2px 6px 36px' }} />
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '2px 8px 36px', textAlign: 'right', fontWeight: 700 }}>
                      CGST {invoice.cgstRate}% OUTPUT
                    </td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }} />
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }} />
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '2px 6px 36px', textAlign: 'right' }}>
                      {invoice.cgstRate}
                    </td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '2px 6px 36px', textAlign: 'center' }}>
                      %
                    </td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '2px 8px 36px', textAlign: 'right', fontWeight: 700 }}>
                      {formatMoney(invoice.cgstAmount)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 6px 36px' }} />
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 8px 36px', textAlign: 'right', fontWeight: 700 }}>
                    IGST {invoice.igstRate}% OUTPUT
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }} />
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }} />
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 6px 36px', textAlign: 'right' }}>
                    {invoice.igstRate}
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 6px 36px', textAlign: 'center' }}>
                    %
                  </td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '18px 8px 36px', textAlign: 'right', fontWeight: 700 }}>
                    {formatMoney(invoice.igstAmount)}
                  </td>
                </tr>
              )}

              {/* Total Row */}
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }} />
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>
                  Total
                </td>
                <td style={{ border: '1px solid #000', padding: '6px' }} />
                <td style={{ border: '1px solid #000', padding: '6px' }} />
                <td style={{ border: '1px solid #000', padding: '6px' }} />
                <td style={{ border: '1px solid #000', padding: '6px' }} />
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: '13.5px' }}>
                  {formatMoney(invoice.grandTotal)}
                </td>
              </tr>

              {/* Amount in Words */}
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', padding: '6px 8px' }}>
                  <div>Amount chargeable (in words)</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.amountInWords}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* HSN Tax Breakdown Table */}
          <table
            className="inv-box"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderLeft: '1.2px solid #000',
              borderRight: '1.2px solid #000',
              borderBottom: '1.2px solid #000',
            }}
          >
            <thead>
              <tr>
                <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', width: '24%' }}>
                  HSN/SAC
                </th>
                <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', width: '16%' }}>
                  Taxable value
                </th>
                {!isInterState ? (
                  <>
                    <th colSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>
                      Central Tax
                    </th>
                    <th colSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>
                      State Tax
                    </th>
                  </>
                ) : (
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>
                    Integrated Tax (IGST)
                  </th>
                )}
                <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', width: '18%' }}>
                  Total Tax Amount
                </th>
              </tr>
              <tr>
                {!isInterState ? (
                  <>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Rate</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Amount</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Rate</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Amount</th>
                  </>
                ) : (
                  <>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Rate</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {hsnRows.map((row) => (
                <tr key={row.hsnSac}>
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    {row.hsnSac}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                    {formatMoney(row.taxableValue)}
                  </td>
                  {!isInterState ? (
                    <>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                        {invoice.cgstRate}%
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                        {formatMoney(row.cgstAmount)}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                        {invoice.sgstRate}%
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                        {formatMoney(row.sgstAmount)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                        {invoice.igstRate}%
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                        {formatMoney(row.igstAmount)}
                      </td>
                    </>
                  )}
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                    {formatMoney(row.totalTax)}
                  </td>
                </tr>
              ))}

              <tr>
                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 700 }}>
                  Total
                </td>
                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 700 }}>
                  {formatMoney(invoice.taxableValue)}
                </td>
                {!isInterState ? (
                  <>
                    <td style={{ border: '1px solid #000', padding: '5px' }} />
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 700 }}>
                      {formatMoney(invoice.cgstAmount)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px' }} />
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 700 }}>
                      {formatMoney(invoice.sgstAmount)}
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ border: '1px solid #000', padding: '5px' }} />
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 700 }}>
                      {formatMoney(invoice.igstAmount)}
                    </td>
                  </>
                )}
                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 700 }}>
                  {formatMoney(invoice.totalTax)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tax Amount in Words + PAN + Bank Details + Signatory */}
          <table
            className="inv-box"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderLeft: '1.2px solid #000',
              borderRight: '1.2px solid #000',
              borderBottom: '1.2px solid #000',
            }}
          >
            <tbody>
              <tr>
                <td colSpan={2} style={{ borderBottom: 'none', padding: '6px 8px' }}>
                  Tax Amount (in words): <b>{invoice.taxInWords}</b>
                </td>
              </tr>
              <tr>
                <td style={{ width: '52%', borderTop: 'none', borderRight: 'none', padding: '8px', verticalAlign: 'bottom' }}>
                  <div style={{ marginBottom: '26px' }}>
                    Company PAN : <b>{seller.pan}</b>
                  </div>
                  <div style={{ textDecoration: 'underline', marginBottom: '2px' }}>Declaration</div>
                  <div style={{ fontSize: '11.5px' }}>{seller.declaration}</div>
                </td>
                <td style={{ width: '48%', borderTop: 'none', borderLeft: 'none', padding: '8px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '10px', fontSize: '12px' }}>
                    <div style={{ marginBottom: '2px' }}>Company Bank Details</div>
                    <div>
                      Bank Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <b>{seller.bankName}</b>
                    </div>
                    <div>
                      AC/NO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <b>{seller.accountNumber}</b>
                    </div>
                    <div>
                      Branch &amp; IFSC Code : <b>{seller.branchAndIfsc}</b>
                    </div>
                  </div>

                  <div
                    style={{
                      border: '1px solid #000',
                      padding: '8px 10px',
                      textAlign: 'center',
                      minHeight: '96px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: '12px' }}>
                      For {seller.companyName || 'Sky Communications Internet Services'}
                    </div>
                    <div style={{ padding: '6px 0' }}>
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 100 100"
                        style={{ margin: '0 auto', display: 'block', opacity: 0.75 }}
                      >
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="2.5" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#1e293b" strokeWidth="1.2" />
                        <text x="50" y="45" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1e293b">
                          SKY COMM
                        </text>
                        <text x="50" y="58" textAnchor="middle" fontSize="7.5" fill="#1e293b">
                          DHARAPURAM
                        </text>
                      </svg>
                    </div>
                    <div style={{ fontSize: '12px' }}>Authorized Signatory</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="footer-note" style={{ textAlign: 'center', fontSize: '11.5px', marginTop: '6px' }}>
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
}

export default GstInvoicePrint;
