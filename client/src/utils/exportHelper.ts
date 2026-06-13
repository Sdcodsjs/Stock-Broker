import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export class ExportHelper {
  /**
   * Export array of objects to CSV file
   */
  static toCSV(data: unknown[], filename: string) {
    const csv = Papa.unparse(data);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // include BOM for Excel support
    saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
  }

  /**
   * Export object/array to JSON file
   */
  static toJSON(data: unknown, filename: string) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
  }

  /**
   * Export to XML/HTML format that opens natively in Microsoft Excel
   */
  static toExcel(headers: string[], rows: unknown[][], sheetName: string, filename: string) {
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:search"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row ss:StyleID="Header">`;

    // Write Headers
    headers.forEach(h => {
      xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
    });
    xml += `</Row>`;

    // Write Data Rows
    rows.forEach(row => {
      xml += `<Row>`;
      row.forEach(val => {
        const type = typeof val === 'number' ? 'Number' : 'String';
        xml += `<Cell><Data ss:Type="${type}">${val}</Data></Cell>`;
      });
      xml += `</Row>`;
    });

    xml += `</Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    saveAs(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
  }
}
