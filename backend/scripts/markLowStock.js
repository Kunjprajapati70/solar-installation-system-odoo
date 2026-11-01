const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

const drops = [
  { model: 'GS-400HI', stock: 18 },
  { model: 'SG10RT', stock: 6 },
  { model: 'SunWatt-8K', stock: 4 },
  { model: 'PowerSafe-48', stock: 3 },
  { model: 'EcoLFP-100', stock: 2 },
  { model: 'ESE-60M', stock: 7 }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_installation_db');
  for (const d of drops) {
    const item = await Inventory.findOne({ model: d.model });
    if (!item) {
      console.log('missing', d.model);
      continue;
    }
    item.currentStock = d.stock;
    item.availableStock = d.stock;
    await item.save();
    console.log(`${item.model}: ${item.availableStock} <= ${item.reorderLevel}`);
  }
  const n = await Inventory.countDocuments({
    $expr: {
      $lte: [
        { $ifNull: ['$availableStock', '$currentStock'] },
        { $ifNull: ['$reorderLevel', 0] }
      ]
    }
  });
  console.log('LOW_STOCK', n);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
