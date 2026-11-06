import { EnrolledBuyerRecord } from '../contexts/NetVidyaStoreContext';

function crc32(bytes: Uint8Array): number {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

export function generateXlsxBlob(buyers: EnrolledBuyerRecord[]): Blob {
  const fileEntries: {
    localHeader: Uint8Array;
    data: Uint8Array;
    nameBuf: Uint8Array;
    crc: number;
    offset: number;
    size: number;
  }[] = [];
  let offset = 0;

  const encoder = new TextEncoder();

  function addFile(name: string, content: string) {
    const data = encoder.encode(content);
    const nameBuf = encoder.encode(name);
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBuf.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true); // Store (no compression)
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBuf.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBuf, 30);

    fileEntries.push({ localHeader, data, nameBuf, crc, offset, size: data.length });
    offset += localHeader.length + data.length;
  }

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Enrolled Buyers" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const escapeXml = (s: any) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const colNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const headers = ['Order ID', 'Candidate Name', 'Email Address', 'Mobile Number', 'Amount Paid (INR)', 'Payment Mode', 'Enrollment Date', 'Status'];

  let rowsXml = `<row r="1">`;
  headers.forEach((h, i) => {
    rowsXml += `<c r="${colNames[i]}1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
  });
  rowsXml += `</row>`;

  buyers.forEach((b, rowIdx) => {
    const rNum = rowIdx + 2;
    const values = [
      b.orderId || '',
      b.name || '',
      b.email || '',
      b.mobile || '',
      b.amountPaid ?? 799,
      b.paymentMethod || 'Razorpay',
      b.enrolledAt ? new Date(b.enrolledAt).toLocaleDateString('en-IN') : '',
      b.isActive ? 'Active' : 'Revoked'
    ];
    rowsXml += `<row r="${rNum}">`;
    values.forEach((v, colIdx) => {
      const col = colNames[colIdx];
      if (typeof v === 'number') {
        rowsXml += `<c r="${col}${rNum}"><v>${v}</v></c>`;
      } else {
        rowsXml += `<c r="${col}${rNum}" t="inlineStr"><is><t>${escapeXml(v)}</t></is></c>`;
      }
    });
    rowsXml += `</row>`;
  });

  const ws = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rowsXml}
  </sheetData>
</worksheet>`;

  addFile('[Content_Types].xml', contentTypes);
  addFile('_rels/.rels', rels);
  addFile('xl/_rels/workbook.xml.rels', wbRels);
  addFile('xl/workbook.xml', wb);
  addFile('xl/worksheets/sheet1.xml', ws);

  const centralRecords: Uint8Array[] = [];
  let cdSize = 0;
  for (const fe of fileEntries) {
    const cd = new Uint8Array(46 + fe.nameBuf.length);
    const view = new DataView(cd.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(16, fe.crc, true);
    view.setUint32(20, fe.size, true);
    view.setUint32(24, fe.size, true);
    view.setUint16(28, fe.nameBuf.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, fe.offset, true);
    cd.set(fe.nameBuf, 46);
    centralRecords.push(cd);
    cdSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, fileEntries.length, true);
  eocdView.setUint16(10, fileEntries.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  let totalLength = 0;
  for (const fe of fileEntries) {
    totalLength += fe.localHeader.length + fe.data.length;
  }
  for (const cd of centralRecords) {
    totalLength += cd.length;
  }
  totalLength += eocd.length;

  const finalZip = new Uint8Array(totalLength);
  let pos = 0;
  for (const fe of fileEntries) {
    finalZip.set(fe.localHeader, pos);
    pos += fe.localHeader.length;
    finalZip.set(fe.data, pos);
    pos += fe.data.length;
  }
  for (const cd of centralRecords) {
    finalZip.set(cd, pos);
    pos += cd.length;
  }
  finalZip.set(eocd, pos);

  return new Blob([finalZip], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export function downloadBuyersAsXlsx(buyers: EnrolledBuyerRecord[], filenamePrefix = 'NetVidya_Final_Pack_Buyers') {
  const blob = generateXlsxBlob(buyers);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
