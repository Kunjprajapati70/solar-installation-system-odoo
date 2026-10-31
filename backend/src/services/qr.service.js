/**
 * Smart Equipment QR Code Generation & Verification Service
 */

const QRCode = require('qrcode');

class QrService {
  /**
   * Generates safe QR code string identifier
   */
  static generateIdentifier(serialNumber, category, brand, model) {
    return JSON.stringify({
      prefix: 'SUNPOWER-SOLAR-EQ',
      serialNumber: serialNumber.toUpperCase().trim(),
      category: category.toLowerCase(),
      brand,
      model,
      lookupUrl: `/api/equipment/serial/${encodeURIComponent(serialNumber.toUpperCase().trim())}`
    });
  }

  /**
   * Generates Base64 Data URL (PNG image) for equipment label printing
   */
  static async generateQrDataUrl(dataString) {
    try {
      const qrDataUrl = await QRCode.toDataURL(dataString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff'
        },
        width: 320
      });
      return qrDataUrl;
    } catch (err) {
      console.error('QR Generation Error:', err);
      throw new Error(`Failed to generate QR code: ${err.message}`);
    }
  }

  /**
   * Generates SVG string for vector rendering
   */
  static async generateQrSvg(dataString) {
    try {
      const svgString = await QRCode.toString(dataString, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2
      });
      return svgString;
    } catch (err) {
      console.error('QR SVG Error:', err);
      throw new Error(`Failed to generate QR SVG: ${err.message}`);
    }
  }
}

module.exports = QrService;
