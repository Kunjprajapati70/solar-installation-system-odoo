/**
 * Bill of Materials (BOM) & Quotation Calculation Service
 * Enforces server-side calculations for all totals, quantities, taxes, and subsidy rules
 */

const { rupeesToPaise, paiseToRupees } = require('../utils/currency');

class BomService {
  /**
   * Generates standard BOM items based on capacity and system type
   */
  static generateDefaultBom(capacityKw, systemType) {
    const kw = Number(capacityKw) || 3;
    const items = [];

    // 1. Solar Panels (540W Mono PERC half-cut cells)
    const panelWattage = 540;
    const panelCount = Math.ceil((kw * 1000) / panelWattage);
    const panelUnitPrice = 13500; // INR
    items.push({
      category: 'panel',
      itemName: `Tier-1 540W Mono-PERC Solar PV Module`,
      specs: `${panelWattage}W Bifacial Half-cut, IP68 Junction Box`,
      quantity: panelCount,
      unit: 'modules',
      unitPrice: panelUnitPrice,
      totalPrice: panelCount * panelUnitPrice
    });

    // 2. Solar Inverter
    const inverterPrice = Math.round(kw * 9500);
    items.push({
      category: 'inverter',
      itemName: `Smart Grid-Tied Solar Inverter ${kw}kW`,
      specs: `MPPT Efficiency > 98.6%, Wi-Fi & RS485 Monitoring`,
      quantity: 1,
      unit: 'unit',
      unitPrice: inverterPrice,
      totalPrice: inverterPrice
    });

    // 3. Battery Storage (if hybrid or off-grid)
    if (systemType === 'hybrid' || systemType === 'off_grid') {
      const batteryCount = kw <= 3 ? 2 : 4;
      const batteryUnitPrice = 32000;
      items.push({
        category: 'battery',
        itemName: `Lithium-Ion Solar Battery Pack 48V 100Ah`,
        specs: `4.8kWh usable capacity, 6000 cycles @ 80% DoD`,
        quantity: batteryCount,
        unit: 'units',
        unitPrice: batteryUnitPrice,
        totalPrice: batteryCount * batteryUnitPrice
      });
    }

    // 4. Mounting Structure (HDG 80 Micron)
    const structurePrice = Math.round(panelCount * 1800);
    items.push({
      category: 'structure',
      itemName: `Elevated Heavy-Duty Module Mounting Structure`,
      specs: `Hot-Dip Galvanized 80 Micron, Wind Resistance 150 km/h`,
      quantity: panelCount,
      unit: 'stands',
      unitPrice: 1800,
      totalPrice: structurePrice
    });

    // 5. AC/DC Cables, Earthing & Lightning Arrester
    const accessoriesPrice = Math.round(kw * 4200) + 6000;
    items.push({
      category: 'accessories',
      itemName: `BOS Kit: DC/AC Cables, Chemical Earthing & LA`,
      specs: `4sqmm UV Solar Cable, Dual Copper bonded earthing rods`,
      quantity: 1,
      unit: 'set',
      unitPrice: accessoriesPrice,
      totalPrice: accessoriesPrice
    });

    return items;
  }

  /**
   * Recalculates all pricing totals on server (Never trust frontend totals)
   */
  static calculatePricing(bomItems, capacityKw) {
    const kw = Number(capacityKw) || 3;

    // Equipment subtotal
    const equipmentTotal = bomItems.reduce((acc, item) => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      item.totalPrice = lineTotal;
      return acc + lineTotal;
    }, 0);

    // Standard Labour cost based on capacity
    const installationLabour = Math.round(kw * 4500) + 5000;
    const transportAndLiaison = 5000;

    const grossTotal = equipmentTotal + installationLabour + transportAndLiaison;

    // PM Surya Ghar Muft Bijli Yojana Central Subsidy Calculation
    // Up to 2kW: 30,000/kW (max 60,000)
    // 3kW and above: +18,000 for 3rd kW (max 78,000)
    let estimatedSubsidy = 0;
    if (kw <= 1) {
      estimatedSubsidy = 30000;
    } else if (kw <= 2) {
      estimatedSubsidy = 60000;
    } else {
      estimatedSubsidy = 78000;
    }

    const netPayable = Math.max(grossTotal - estimatedSubsidy, 0);

    return {
      equipmentTotal,
      installationLabour,
      transportAndLiaison,
      grossTotal,
      estimatedSubsidy,
      netPayable
    };
  }
}

module.exports = BomService;
