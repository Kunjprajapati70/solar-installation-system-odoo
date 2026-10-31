const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Enquiry = require('../models/Enquiry');
const SiteSurvey = require('../models/SiteSurvey');
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Equipment = require('../models/Equipment');
const Installation = require('../models/Installation');
const Warranty = require('../models/Warranty');
const ServiceTicket = require('../models/ServiceTicket');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Subsidy = require('../models/Subsidy');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_installation_db';

const generateQR = async (payload) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (err) {
    return '';
  }
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('⚡ Connected to MongoDB for seeding...');

    // Clear old data
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Enquiry.deleteMany({}),
      SiteSurvey.deleteMany({}),
      Quotation.deleteMany({}),
      Order.deleteMany({}),
      Inventory.deleteMany({}),
      Equipment.deleteMany({}),
      Installation.deleteMany({}),
      Warranty.deleteMany({}),
      ServiceTicket.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      Subsidy.deleteMany({}),
      Notification.deleteMany({}),
      Setting.deleteMany({})
    ]);

    console.log('🧹 Purged existing database collections.');

    // 1. Create Core Users & 15 Technicians
    const adminUser = await User.create({
      name: 'Aditya Singhania',
      email: 'admin@sunpower.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98201 12345',
      address: 'Corporate Headquarters, Bandra-Kurla Complex, Mumbai'
    });

    const salesUser = await User.create({
      name: 'Ananya Verma',
      email: 'sales@sunpower.com',
      password: 'sales123',
      role: 'sales',
      phone: '+91 98202 23456',
      address: 'Sales Regional Hub, Indiranagar, Bengaluru'
    });

    const customerUser = await User.create({
      name: 'Priya Sundaram',
      email: 'customer@sunpower.com',
      password: 'customer123',
      role: 'customer',
      phone: '+91 98203 34567',
      address: 'Villa 42, Palm Meadows Green, Whitefield, Bengaluru'
    });

    // 15 Technicians with realistic solar skill sets
    const technicianProfiles = [
      { name: 'Rajesh Sharma', email: 'tech@sunpower.com', phone: '+91 98111 00001', skills: ['Inverter Wiring', 'Three-Phase Sync', 'Earthing Pit Setup'], rating: 4.9, hours: 340, jobs: 42 },
      { name: 'Vikram Joshi', email: 'vikram.tech@sunpower.com', phone: '+91 98111 00002', skills: ['Mono PERC Mounting', 'RCC Structure Anchoring'], rating: 4.8, hours: 290, jobs: 36 },
      { name: 'Amitabh Roy', email: 'amitabh.tech@sunpower.com', phone: '+91 98111 00003', skills: ['Hybrid Inverter Calibration', 'LiFePO4 Storage'], rating: 4.9, hours: 310, jobs: 39 },
      { name: 'Karthik Raman', email: 'karthik.tech@sunpower.com', phone: '+91 98111 00004', skills: ['DC Cabling', 'Lightning Arrestors', 'Voc/Isc Testing'], rating: 4.7, hours: 250, jobs: 31 },
      { name: 'Manoj Pillai', email: 'manoj.tech@sunpower.com', phone: '+91 98111 00005', skills: ['Elevated HDG Structure', 'Roof Waterproofing'], rating: 4.8, hours: 280, jobs: 34 },
      { name: 'Suresh Patel', email: 'suresh.tech@sunpower.com', phone: '+91 98111 00006', skills: ['Net Metering Liaison', 'Grid-Tie Synchronization'], rating: 4.6, hours: 220, jobs: 28 },
      { name: 'Deepak Chauhan', email: 'deepak.tech@sunpower.com', phone: '+91 98111 00007', skills: ['Solar Testing', 'Safety Compliance', 'Micro Inverters'], rating: 4.9, hours: 330, jobs: 40 },
      { name: 'Naveen Reddy', email: 'naveen.tech@sunpower.com', phone: '+91 98111 00008', skills: ['Roof Survey', 'Azimuth Tilt Calibration'], rating: 4.8, hours: 270, jobs: 33 },
      { name: 'Rohan Deshmukh', email: 'rohan.tech@sunpower.com', phone: '+91 98111 00009', skills: ['ACDB/DCDB Assembly', 'Surge Protection Devices'], rating: 4.7, hours: 240, jobs: 30 },
      { name: 'Pradeep Nayak', email: 'pradeep.tech@sunpower.com', phone: '+91 98111 00010', skills: ['Off-Grid Battery Banks', 'BMS Diagnostics'], rating: 4.8, hours: 260, jobs: 32 },
      { name: 'Sachin Kulkarni', email: 'sachin.tech@sunpower.com', phone: '+91 98111 00011', skills: ['Earthing Resistance Measurement', 'Quality Signoff'], rating: 4.9, hours: 350, jobs: 44 },
      { name: 'Arun Kumar', email: 'arun.tech@sunpower.com', phone: '+91 98111 00012', skills: ['Module Clamping', 'Wind Deflectors'], rating: 4.6, hours: 210, jobs: 26 },
      { name: 'Farhan Sheikh', email: 'farhan.tech@sunpower.com', phone: '+91 98111 00013', skills: ['Solar Maintenance', 'Thermal IR Drone Imaging'], rating: 4.8, hours: 280, jobs: 35 },
      { name: 'Gaurav Tiwari', email: 'gaurav.tech@sunpower.com', phone: '+91 98111 00014', skills: ['Three Phase Inverters', 'Power Export Limiting'], rating: 4.7, hours: 230, jobs: 29 },
      { name: 'Harish Nair', email: 'harish.tech@sunpower.com', phone: '+91 98111 00015', skills: ['Troubleshooting Fault Codes', 'Field Rectification'], rating: 4.9, hours: 320, jobs: 38 }
    ];

    const technicians = [];
    for (const t of technicianProfiles) {
      const tech = await User.create({
        name: t.name,
        email: t.email,
        password: 'tech123',
        role: 'technician',
        phone: t.phone,
        address: 'Technician Regional Base Station',
        technicianDetails: {
          specialization: t.skills,
          rating: t.rating,
          totalJobsCompleted: t.jobs,
          certification: 'MNRE Certified Master Solar Installer'
        }
      });
      technicians.push(tech);
    }

    console.log(`👤 Created Admin, Sales, Customer, and ${technicians.length} Technicians.`);

    // 2. Create Primary Customer Profile
    const primaryCustomer = await Customer.create({
      user: customerUser._id,
      customerCode: 'CUST-2026-0001',
      name: customerUser.name,
      email: customerUser.email,
      phone: customerUser.phone,
      installationAddress: {
        street: 'Villa 42, Palm Meadows Green',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        landmark: 'Near Forum Shantiniketan',
        coordinates: { lat: 12.9716, lng: 77.7499 }
      },
      connectionType: 'on_grid',
      sanctionedLoadKw: 5,
      discomName: 'BESCOM (Bangalore Electricity Supply Company)',
      consumerNumber: 'BESCOM-BLR-8923412',
      currentPhase: 'three'
    });

    // Create 39 additional realistic customers (~40 projects)
    const customerCities = [
      { city: 'Bengaluru', state: 'Karnataka', discom: 'BESCOM', pincode: '560034' },
      { city: 'Pune', state: 'Maharashtra', discom: 'MSEDCL', pincode: '411038' },
      { city: 'Ahmedabad', state: 'Gujarat', discom: 'UGVCL', pincode: '380015' },
      { city: 'Hyderabad', state: 'Telangana', discom: 'TSSPDCL', pincode: '500081' },
      { city: 'Jaipur', state: 'Rajasthan', discom: 'JVVNL', pincode: '302020' },
      { city: 'Chennai', state: 'Tamil Nadu', discom: 'TANGEDCO', pincode: '600028' },
      { city: 'New Delhi', state: 'Delhi', discom: 'BSES Rajdhani', pincode: '110024' },
      { city: 'Kochi', state: 'Kerala', discom: 'KSEB', pincode: '682020' }
    ];

    const customerNames = [
      'Devendra Mukherjee', 'Sunita Rao', 'Arvind Mehra', 'Kavita Chawla', 'Siddharth Iyer',
      'Pooja Nair', 'Ramesh Chandra', 'Anand Kothari', 'Meera Bhatt', 'Harpreet Singh',
      'Vikas Agrawal', 'Shalini Kapoor', 'Girish Hegde', 'Geeta Sen', 'Alok Pandey',
      'Nandini Reddy', 'Prashant Kadam', 'Shweta Dixit', 'Kunal Shah', 'Bhavna Dave',
      'Raghavendra Rao', 'Deepa Nambiar', 'Manish Gupta', 'Preeti Bajaj', 'Tanmay Sen',
      'Varun Sethi', 'Sunil Godbole', 'Madhavi Menon', 'Ashok Saxena', 'Vinay Goel',
      'Sangeeta Jain', 'Nitin Gadgil', 'Radhika Swaminathan', 'Umesh Trivedi', 'Pallavi Shinde',
      'Tarun Mittal', 'Chitra Venkat', 'Hemant Patil', 'Anjali Namboodiri'
    ];

    const allCustomers = [primaryCustomer];
    for (let i = 0; i < customerNames.length; i++) {
      const loc = customerCities[i % customerCities.length];
      const cust = await Customer.create({
        customerCode: `CUST-2026-${String(i + 2).padStart(4, '0')}`,
        name: customerNames[i],
        email: `${customerNames[i].toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        installationAddress: {
          street: `House #${10 + i}, Green Park Layout`,
          city: loc.city,
          state: loc.state,
          pincode: loc.pincode,
          landmark: 'Solar Rooftop Colony',
          coordinates: { lat: 18.5204 + (Math.random() - 0.5) * 5, lng: 73.8567 + (Math.random() - 0.5) * 5 }
        },
        connectionType: i % 4 === 0 ? 'off_grid' : i % 5 === 0 ? 'hybrid' : 'on_grid',
        sanctionedLoadKw: (i % 5) + 1,
        discomName: loc.discom,
        consumerNumber: `${loc.discom}-CNS-${100000 + i}`,
        currentPhase: (i % 2 === 0) ? 'single' : 'three'
      });
      allCustomers.push(cust);
    }

    console.log(`🏡 Created ${allCustomers.length} Customer records.`);

    // 3. Create Inventory Items
    const inventoryData = [
      {
        itemCode: 'INV-PNL-0001',
        name: '540W Monocrystalline PERC Half-Cut Solar Panel',
        category: 'panel',
        brand: 'SunPower High-Yield Series',
        model: 'SP-PERC-540W',
        specifications: { wattage: 540, efficiencyPercent: 21.3, voltage: 49.8, warrantyYears: 25, dimensions: '2279 x 1134 x 35 mm' },
        unit: 'pcs',
        currentStock: 320,
        reservedStock: 64,
        reorderLevel: 50,
        unitCostPrice: 8500,
        unitSellingPrice: 11500,
        supplier: { name: 'Tier-1 Solar Photovoltaics Ltd.', contact: '+91 99000 11223' }
      },
      {
        itemCode: 'INV-PNL-0002',
        name: '440W Bifacial TOPCon N-Type Solar PV Module',
        category: 'panel',
        brand: 'SunPower Ultra Bifacial',
        model: 'SP-TOPCON-440B',
        specifications: { wattage: 440, efficiencyPercent: 22.4, voltage: 42.1, warrantyYears: 30, dimensions: '1903 x 1134 x 30 mm' },
        unit: 'pcs',
        currentStock: 180,
        reservedStock: 30,
        reorderLevel: 40,
        unitCostPrice: 7800,
        unitSellingPrice: 10400,
        supplier: { name: 'Tier-1 Solar Photovoltaics Ltd.', contact: '+91 99000 11223' }
      },
      {
        itemCode: 'INV-INV-0001',
        name: '3kW On-Grid Dual MPPT Solar Inverter',
        category: 'inverter',
        brand: 'SunPower SmartSync Pro',
        model: 'SP-INV-3KW-GT',
        specifications: { wattage: 3000, efficiencyPercent: 98.4, voltage: 230, warrantyYears: 5, dimensions: '380 x 330 x 150 mm' },
        unit: 'pcs',
        currentStock: 45,
        reservedStock: 12,
        reorderLevel: 15,
        unitCostPrice: 24000,
        unitSellingPrice: 32000,
        supplier: { name: 'CleanTech Power Systems', contact: '+91 99111 22334' }
      },
      {
        itemCode: 'INV-INV-0002',
        name: '5kW Three-Phase Grid-Tied Solar Inverter',
        category: 'inverter',
        brand: 'SunPower SmartSync Pro',
        model: 'SP-INV-5KW-3P',
        specifications: { wattage: 5000, efficiencyPercent: 98.6, voltage: 415, warrantyYears: 5, dimensions: '450 x 380 x 180 mm' },
        unit: 'pcs',
        currentStock: 35,
        reservedStock: 8,
        reorderLevel: 10,
        unitCostPrice: 38000,
        unitSellingPrice: 51000,
        supplier: { name: 'CleanTech Power Systems', contact: '+91 99111 22334' }
      },
      {
        itemCode: 'INV-INV-0003',
        name: '5kW Solar Hybrid Storage Inverter with MPPT',
        category: 'inverter',
        brand: 'SunPower HybridEdge',
        model: 'SP-HYB-5KW',
        specifications: { wattage: 5000, efficiencyPercent: 97.8, voltage: 48, warrantyYears: 5, dimensions: '500 x 420 x 200 mm' },
        unit: 'pcs',
        currentStock: 18,
        reservedStock: 4,
        reorderLevel: 8,
        unitCostPrice: 48000,
        unitSellingPrice: 65000,
        supplier: { name: 'CleanTech Power Systems', contact: '+91 99111 22334' }
      },
      {
        itemCode: 'INV-BAT-0001',
        name: '48V 100Ah LiFePO4 Lithium Solar Battery Pack (5.12 kWh)',
        category: 'battery',
        brand: 'SunPower PowerVault',
        model: 'SP-LFP-48100',
        specifications: { capacityAh: 100, voltage: 48, warrantyYears: 5, dimensions: '482 x 460 x 155 mm' },
        unit: 'pcs',
        currentStock: 24,
        reservedStock: 6,
        reorderLevel: 10,
        unitCostPrice: 42000,
        unitSellingPrice: 58000,
        supplier: { name: 'VoltEdge Energy Storage', contact: '+91 99222 33445' }
      },
      {
        itemCode: 'INV-STR-0001',
        name: 'HDG Elevating Solar Mounting Structure (80 Micron)',
        category: 'structure',
        brand: 'SunPower GalvaMount',
        model: 'SP-HDG-MMS',
        specifications: { warrantyYears: 10, dimensions: 'Custom modular rails' },
        unit: 'sets',
        currentStock: 90,
        reservedStock: 25,
        reorderLevel: 20,
        unitCostPrice: 2800,
        unitSellingPrice: 4200,
        supplier: { name: 'Prime Structurals Ltd.', contact: '+91 99333 44556' }
      },
      {
        itemCode: 'INV-CBL-0001',
        name: '4 sq mm TUV Certified Copper Solar DC Cable (Drum)',
        category: 'cables',
        brand: 'SunPower SolarFlex',
        model: 'SP-CBL-4MM',
        specifications: { voltage: 1500, warrantyYears: 25 },
        unit: 'meters',
        currentStock: 2800,
        reservedStock: 500,
        reorderLevel: 500,
        unitCostPrice: 45,
        unitSellingPrice: 65,
        supplier: { name: 'Anchor Cable Corp', contact: '+91 99444 55667' }
      }
    ];

    const inventoryDocs = [];
    for (const inv of inventoryData) {
      const item = await Inventory.create({
        ...inv,
        availableStock: inv.currentStock - inv.reservedStock
      });
      inventoryDocs.push(item);
    }

    console.log(`📦 Seeded ${inventoryDocs.length} Inventory SKUs.`);

    // 4. Create Serialized Equipment with QR Codes (Panels, Inverters, Batteries)
    const equipmentItems = [];
    const panelInv = inventoryDocs[0];
    const inverterInv = inventoryDocs[2];
    const batteryInv = inventoryDocs[5];

    // Seed 60 serialized Panels
    for (let i = 1; i <= 60; i++) {
      const serialNumber = `SP-PNL-2026-${String(i).padStart(5, '0')}`;
      const qrPayload = {
        serialNumber,
        category: 'panel',
        brand: panelInv.brand,
        model: panelInv.model,
        specs: panelInv.specifications,
        systemProvider: 'SunPower Solutions'
      };
      const qrCodeImage = await generateQR(qrPayload);

      const eq = await Equipment.create({
        serialNumber,
        qrCodeData: JSON.stringify(qrPayload),
        qrCodeImage,
        category: 'panel',
        inventoryItem: panelInv._id,
        brand: panelInv.brand,
        model: panelInv.model,
        specifications: panelInv.specifications,
        status: i <= 36 ? 'installed' : i <= 46 ? 'dispatched' : 'in_stock',
        movementHistory: [
          {
            action: 'CREATED_AND_SERIALIZED',
            timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            performedByName: 'Central Warehouse Staff',
            toStatus: 'in_stock',
            location: 'Central Solar Warehouse'
          }
        ]
      });
      equipmentItems.push(eq);
    }

    // Seed 20 serialized Inverters
    for (let i = 1; i <= 20; i++) {
      const serialNumber = `SP-INV-2026-${String(i).padStart(5, '0')}`;
      const qrPayload = {
        serialNumber,
        category: 'inverter',
        brand: inverterInv.brand,
        model: inverterInv.model,
        specs: inverterInv.specifications,
        systemProvider: 'SunPower Solutions'
      };
      const qrCodeImage = await generateQR(qrPayload);

      const eq = await Equipment.create({
        serialNumber,
        qrCodeData: JSON.stringify(qrPayload),
        qrCodeImage,
        category: 'inverter',
        inventoryItem: inverterInv._id,
        brand: inverterInv.brand,
        model: inverterInv.model,
        specifications: inverterInv.specifications,
        status: i <= 10 ? 'installed' : i <= 14 ? 'dispatched' : 'in_stock',
        movementHistory: [
          {
            action: 'CREATED_AND_SERIALIZED',
            timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            performedByName: 'Central Warehouse Staff',
            toStatus: 'in_stock',
            location: 'Central Solar Warehouse'
          }
        ]
      });
      equipmentItems.push(eq);
    }

    // Seed 10 serialized Batteries
    for (let i = 1; i <= 10; i++) {
      const serialNumber = `SP-BAT-2026-${String(i).padStart(5, '0')}`;
      const qrPayload = {
        serialNumber,
        category: 'battery',
        brand: batteryInv.brand,
        model: batteryInv.model,
        specs: batteryInv.specifications,
        systemProvider: 'SunPower Solutions'
      };
      const qrCodeImage = await generateQR(qrPayload);

      const eq = await Equipment.create({
        serialNumber,
        qrCodeData: JSON.stringify(qrPayload),
        qrCodeImage,
        category: 'battery',
        inventoryItem: batteryInv._id,
        brand: batteryInv.brand,
        model: batteryInv.model,
        specifications: batteryInv.specifications,
        status: i <= 5 ? 'installed' : 'in_stock',
        movementHistory: [
          {
            action: 'CREATED_AND_SERIALIZED',
            timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            performedByName: 'Central Warehouse Staff',
            toStatus: 'in_stock',
            location: 'Central Solar Warehouse'
          }
        ]
      });
      equipmentItems.push(eq);
    }

    console.log(`🏷️ Created ${equipmentItems.length} Serialized Equipment units with QR Code Badges.`);

    // 5. Seed 40 Projects across the Lifecycle
    // Stages:
    // 1-5: New Enquiries
    // 6-10: Scheduled Site Surveys
    // 11-15: Approved Site Surveys (Ready for quotation)
    // 16-20: Quotations Sent & Approved
    // 21-25: Confirmed Orders with Advance Paid
    // 26-30: Equipment Dispatched with Serial Numbers
    // 31-35: Installations In Progress / Testing
    // 36-40: Completed, Delivered, Active Warranties, Subsidies & Tickets

    const allOrders = [];
    const allInstallations = [];
    const allWarranties = [];

    for (let idx = 0; idx < allCustomers.length; idx++) {
      const cust = allCustomers[idx];
      const capacityKw = (idx % 5) + 1; // 1 kW to 5 kW
      const systemType = cust.connectionType;
      const assignedTech = technicians[idx % technicians.length];

      // Enquiry
      const enquiry = await Enquiry.create({
        enquiryNumber: `ENQ-2026-${String(idx + 1).padStart(4, '0')}`,
        customerName: cust.name,
        email: cust.email,
        phone: cust.phone,
        address: cust.installationAddress,
        proposedCapacityKw: capacityKw,
        systemType: systemType,
        monthlyElectricityBill: capacityKw * 2200,
        status: idx < 4 ? 'new' : idx < 8 ? 'survey_scheduled' : idx < 12 ? 'survey_completed' : 'converted',
        assignedSales: salesUser._id,
        linkedCustomer: cust._id,
        notes: `Customer interested in ${capacityKw} kW ${systemType} solar rooftop under PM Surya Ghar scheme.`
      });

      if (idx < 4) continue; // Just enquiry stage

      // Site Survey
      const isApproved = idx >= 10;
      const survey = await SiteSurvey.create({
        surveyNumber: `SURV-2026-${String(idx + 1).padStart(4, '0')}`,
        enquiry: enquiry._id,
        customer: cust._id,
        surveyor: assignedTech._id,
        scheduledDate: new Date(Date.now() - (40 - idx) * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - (38 - idx) * 24 * 60 * 60 * 1000),
        status: isApproved ? 'approved' : idx >= 7 ? 'completed' : 'scheduled',
        roofDetails: {
          roofType: 'flat_rcc',
          totalRoofAreaSqft: capacityKw * 250,
          shadowFreeAreaSqft: capacityKw * 200,
          tiltAngleDeg: 22,
          azimuthDeg: 180,
          structuralIntegrity: 'good'
        },
        electricalDetails: {
          phase: cust.currentPhase,
          sanctionedLoadKw: cust.sanctionedLoadKw,
          existingMeterType: 'digital_electronic',
          earthingStatus: 'required',
          distanceToPanelMeters: 18
        },
        surveyorNotes: `Roof structural strength is verified. Shadow-free area accommodates ${capacityKw} kW array.`,
        approvalDetails: {
          isApproved: isApproved,
          approvedBy: isApproved ? adminUser._id : null,
          approvedAt: isApproved ? new Date(Date.now() - (35 - idx) * 24 * 60 * 60 * 1000) : null,
          recommendedCapacityKw: capacityKw,
          recommendedSystemType: systemType,
          approvalNotes: isApproved ? 'Survey reviewed and verified by Chief Engineer. Approved for quotation.' : ''
        }
      });

      if (!isApproved) continue; // Surveys not yet approved cannot have quotations (Rule 1)

      // Quotation (Calculated from approved survey - Rule 2)
      const panelCount = Math.ceil((capacityKw * 1000) / 540);
      const equipmentTotal = panelCount * 11500 + 32000 + capacityKw * 4200 + 15000;
      const installationLabour = capacityKw * 5000 + 3500;
      const grossTotal = equipmentTotal + installationLabour + 4500;
      const estimatedSubsidy = systemType === 'on_grid' ? (capacityKw === 1 ? 30000 : capacityKw === 2 ? 60000 : 78000) : 0;
      const netPayable = grossTotal - estimatedSubsidy;

      const quotation = await Quotation.create({
        quotationNumber: `QUOT-2026-${String(idx + 1).padStart(4, '0')}`,
        siteSurvey: survey._id,
        customer: cust._id,
        systemCapacityKw: capacityKw,
        systemType,
        bom: [
          {
            category: 'panel',
            itemName: '540W Monocrystalline PERC Solar Panel',
            specs: '540W, 24V, Tier-1 Mono PERC',
            quantity: panelCount,
            unit: 'pcs',
            unitPrice: 11500,
            totalPrice: panelCount * 11500
          },
          {
            category: 'inverter',
            itemName: `${capacityKw}kW Solar Smart Inverter`,
            specs: 'Dual MPPT, IP65, Grid Sync',
            quantity: 1,
            unit: 'pcs',
            unitPrice: 32000,
            totalPrice: 32000
          },
          {
            category: 'structure',
            itemName: 'HDG Elevated Mounting Structure',
            specs: '80 Micron Galvanized Steel',
            quantity: capacityKw,
            unit: 'kW set',
            unitPrice: 4200,
            totalPrice: capacityKw * 4200
          }
        ],
        pricing: {
          equipmentTotal,
          installationLabour,
          transportAndLiaison: 4500,
          grossTotal,
          estimatedSubsidy,
          netPayable
        },
        status: idx >= 15 ? 'approved' : 'sent',
        approvedAt: idx >= 15 ? new Date() : null,
        createdBy: salesUser._id
      });

      if (idx < 15) continue; // Quotation sent, awaiting customer approval

      // Confirmed Order
      const advanceRequired = Math.round(netPayable * 0.3);
      const advancePaid = idx >= 18 ? advanceRequired : 0;
      const balanceAmount = netPayable - advancePaid;

      const isDispatched = idx >= 22;
      const isDelivered = idx >= 30;

      // Select allocated serialized equipment
      const panelEq = equipmentItems[(idx * 2) % 60];
      const invEq = equipmentItems[60 + (idx % 20)];

      const allocatedEquipment = [
        {
          equipment: panelEq._id,
          serialNumber: panelEq.serialNumber,
          category: 'panel',
          brand: panelEq.brand,
          model: panelEq.model
        },
        {
          equipment: invEq._id,
          serialNumber: invEq.serialNumber,
          category: 'inverter',
          brand: invEq.brand,
          model: invEq.model
        }
      ];

      const order = await Order.create({
        orderNumber: `ORD-2026-${String(idx + 1).padStart(4, '0')}`,
        quotation: quotation._id,
        customer: cust._id,
        systemCapacityKw: capacityKw,
        systemType,
        totalAmount: netPayable,
        advanceRequired,
        advancePaid,
        balanceAmount: isDelivered ? 0 : balanceAmount,
        paymentStatus: isDelivered ? 'fully_paid' : advancePaid > 0 ? 'advance_paid' : 'pending',
        orderStatus: isDelivered ? 'delivery_confirmed' : isDispatched ? 'dispatched' : 'confirmed',
        allocatedEquipment,
        dispatchedAt: isDispatched ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) : null,
        deliveryConfirmedAt: isDelivered ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null,
        deliveryConfirmedBy: isDelivered ? adminUser._id : null,
        milestones: [
          { stageName: 'Order Confirmed', status: 'completed', completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
          { stageName: 'Inventory Stock Verification', status: 'completed', completedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
          { stageName: 'Dispatch to Site', status: isDispatched ? 'completed' : 'pending', completedAt: isDispatched ? new Date() : null },
          { stageName: 'Installation & Testing', status: isDelivered ? 'completed' : 'in_progress' },
          { stageName: 'Delivery Confirmed & Handover', status: isDelivered ? 'completed' : 'pending' }
        ]
      });
      allOrders.push(order);

      // Installation Record
      const installation = await Installation.create({
        installationNumber: `INST-2026-${String(idx + 1).padStart(4, '0')}`,
        order: order._id,
        customer: cust._id,
        leadTechnician: assignedTech._id,
        scheduledDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        completedAt: isDelivered ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null,
        totalWorkingHours: isDelivered ? 7.5 : 4.0,
        status: isDelivered ? 'customer_accepted' : 'in_progress',
        systemCapacityKw: capacityKw,
        steps: [
          { id: 'step-1', title: 'Mounting Structure Alignment & Anchoring', status: 'completed', completedAt: new Date() },
          { id: 'step-2', title: 'Solar PV Module Clamping & Tilt Calibration', status: 'completed', completedAt: new Date() },
          { id: 'step-3', title: 'DC Solar Cabling & Conduit Routing', status: 'completed', completedAt: new Date() },
          { id: 'step-4', title: 'Inverter Mounting & AC/DC DB Interfacing', status: 'completed', completedAt: new Date() },
          { id: 'step-5', title: 'Chemical Earthing Pit Setup', status: 'completed', completedAt: new Date() },
          { id: 'step-6', title: 'Field Electrical Quality Tests (Voc/Isc)', status: isDelivered ? 'completed' : 'in_progress', completedAt: isDelivered ? new Date() : null },
          { id: 'step-7', title: 'Inverter Grid Synchronization', status: isDelivered ? 'completed' : 'pending', completedAt: isDelivered ? new Date() : null },
          { id: 'step-8', title: 'Customer Briefing & Digital Acceptance', status: isDelivered ? 'completed' : 'pending', completedAt: isDelivered ? new Date() : null }
        ],
        testingResults: {
          vocVolts: Math.round(capacityKw * 48.5 * 10) / 10,
          iscAmperes: 13.6,
          inverterSyncStatus: isDelivered ? 'synced' : 'pending',
          earthingResistanceOhms: 1.8,
          generationCheckKw: Math.round(capacityKw * 0.94 * 10) / 10,
          testedAt: isDelivered ? new Date() : null,
          testedBy: assignedTech.name,
          comments: 'DC & AC bus voltages steady. Earth pit resistance below 2 Ohms. Grid sync established.'
        },
        installationPhotos: [
          { url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800', caption: 'Roof PV Modules Alignment' },
          { url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32c?w=800', caption: 'Inverter & ACDB Wall Mounting' }
        ],
        customerAcceptance: {
          isAccepted: isDelivered,
          signedName: cust.name,
          signatureData: 'VERIFIED_CUSTOMER_DIGITAL_OTP',
          remarks: 'System running with steady generation. App monitoring active.',
          rating: 5,
          acceptedAt: isDelivered ? new Date() : null
        }
      });
      allInstallations.push(installation);

      order.installation = installation._id;
      await order.save();

      // Payments
      if (advancePaid > 0) {
        await Payment.create({
          receiptNumber: `RCPT-2026-${String(idx * 2 + 1).padStart(5, '0')}`,
          order: order._id,
          customer: cust._id,
          amount: advancePaid,
          paymentType: 'advance',
          paymentMethod: 'upi',
          transactionReference: `UPI-REF-${Date.now()}-${idx}`,
          status: 'completed',
          paidAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          notes: '30% Advance booking deposit'
        });
      }

      if (isDelivered) {
        await Payment.create({
          receiptNumber: `RCPT-2026-${String(idx * 2 + 2).padStart(5, '0')}`,
          order: order._id,
          customer: cust._id,
          amount: netPayable - advancePaid,
          paymentType: 'final',
          paymentMethod: 'bank_transfer',
          transactionReference: `NEFT-REF-${Date.now()}-${idx}`,
          status: 'completed',
          paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          notes: 'Final settlement on confirmed delivery'
        });

        // Expenses for project
        await Expense.create({
          expenseNumber: `EXP-2026-${String(idx + 1).padStart(5, '0')}`,
          category: 'technician_labour',
          order: order._id,
          amount: capacityKw * 3500,
          payee: assignedTech.name,
          description: `Technician installation labour compensation for ${order.orderNumber}`,
          expenseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          loggedBy: adminUser._id
        });

        // RULE 5: AUTOMATIC WARRANTY ACTIVATION UPON CONFIRMED DELIVERY!
        const startDate = order.deliveryConfirmedAt;

        // Panel Warranty (25 years)
        const panelExpiry = new Date(startDate.getTime());
        panelExpiry.setFullYear(panelExpiry.getFullYear() + 25);
        const pWarranty = await Warranty.create({
          certificateNumber: `WAR-2026-${String(idx * 2 + 1).padStart(5, '0')}`,
          equipment: panelEq._id,
          serialNumber: panelEq.serialNumber,
          customer: cust._id,
          order: order._id,
          category: 'panel',
          brand: panelEq.brand,
          model: panelEq.model,
          durationYears: 25,
          startDate,
          expiryDate: panelExpiry,
          status: 'active'
        });
        allWarranties.push(pWarranty);

        // Inverter Warranty (5 years)
        const invExpiry = new Date(startDate.getTime());
        invExpiry.setFullYear(invExpiry.getFullYear() + 5);
        const iWarranty = await Warranty.create({
          certificateNumber: `WAR-2026-${String(idx * 2 + 2).padStart(5, '0')}`,
          equipment: invEq._id,
          serialNumber: invEq.serialNumber,
          customer: cust._id,
          order: order._id,
          category: 'inverter',
          brand: invEq.brand,
          model: invEq.model,
          durationYears: 5,
          startDate,
          expiryDate: invExpiry,
          status: 'active'
        });
        allWarranties.push(iWarranty);

        // Subsidy Application
        if (systemType === 'on_grid') {
          await Subsidy.create({
            applicationNumber: `SUB-2026-${String(idx + 1).padStart(5, '0')}`,
            order: order._id,
            customer: cust._id,
            stateDiscom: cust.discomName,
            consumerNumber: cust.consumerNumber,
            capacityKw,
            subsidyEligibleAmount: estimatedSubsidy,
            subsidyDisbursedAmount: idx >= 36 ? estimatedSubsidy : 0,
            status: idx >= 36 ? 'disbursed' : 'inspection_completed',
            documents: [
              { docType: 'electricity_bill', fileName: 'BESCOM_Bill_Oct2026.pdf', fileUrl: '/uploads/sample_bill.pdf', verified: true },
              { docType: 'net_meter_test_report', fileName: 'BiDirectional_Meter_Test.pdf', fileUrl: '/uploads/meter_report.pdf', verified: true }
            ]
          });
        }
      }
    }

    // 6. Service Tickets (Both In-Warranty ₹0 and Out-of-Warranty Paid for demo)
    // In-Warranty Ticket for Primary Customer (Covered under 5 yr warranty -> ₹0)
    await ServiceTicket.create({
      ticketNumber: 'TCK-2026-00001',
      customer: primaryCustomer._id,
      equipmentSerialNumber: 'SP-INV-2026-00001',
      warrantyStatusAtTicket: 'in_warranty',
      issueCategory: 'inverter_fault',
      priority: 'high',
      title: 'Inverter Display Error Code E04 (Grid Over-voltage Transient)',
      description: 'The solar inverter tripped during afternoon peak sunshine and displayed Error E04.',
      assignedTechnician: technicians[0]._id,
      status: 'resolved',
      charges: {
        partsCost: 3500,
        labourCost: 1500,
        discountAmount: 5000,
        totalCustomerPayable: 0 // RULE 6: In-warranty customer charge is ZERO!
      },
      resolutionDetails: {
        actionTaken: 'Replaced AC varistor surge protector and updated inverter MPPT firmware.',
        partsReplaced: ['MOV Surge Protector Board', 'Control Ribbon Cable'],
        resolvedAt: new Date(),
        resolutionNotes: 'Under manufacturer warranty SLA. 100% cost absorbed by SunPower warranty reserve. Customer charged ₹0.'
      }
    });

    // Out-of-Warranty Ticket (Demo showing parts + labour charged)
    await ServiceTicket.create({
      ticketNumber: 'TCK-2026-00002',
      customer: allCustomers[2]._id,
      equipmentSerialNumber: 'SP-INV-2021-99881', // Older equipment
      warrantyStatusAtTicket: 'out_of_warranty',
      issueCategory: 'cable_earthing_fault',
      priority: 'medium',
      title: 'Physical Cable Insulation Chew Damage by Rodents',
      description: 'External AC conduit cable insulation frayed on terrace floor.',
      assignedTechnician: technicians[3]._id,
      status: 'resolved',
      charges: {
        partsCost: 1800,
        labourCost: 1200,
        discountAmount: 0,
        totalCustomerPayable: 3000 // RULE 7: Out-of-warranty charges parts + labour!
      },
      resolutionDetails: {
        actionTaken: 'Replaced 12 meters of 4 sq mm cable inside metallic GI flexible conduit.',
        partsReplaced: ['12m Solar DC Cable', 'GI Flexible Conduit'],
        resolvedAt: new Date(),
        resolutionNotes: 'Warranty expired in 2024. Billed standard parts and labour rates.'
      }
    });

    // Open In-Progress Ticket
    await ServiceTicket.create({
      ticketNumber: 'TCK-2026-00003',
      customer: primaryCustomer._id,
      equipmentSerialNumber: 'SP-PNL-2026-00001',
      warrantyStatusAtTicket: 'in_warranty',
      issueCategory: 'generation_drop',
      priority: 'medium',
      title: 'Routine Solar PV Efficiency & Dust Inspection',
      description: 'Scheduled semi-annual generation check and thermal hotspot scan.',
      assignedTechnician: technicians[0]._id,
      status: 'in_progress',
      charges: {
        partsCost: 0,
        labourCost: 0,
        discountAmount: 0,
        totalCustomerPayable: 0
      }
    });

    // 7. General Procurement & Operating Expenses
    const generalExpenses = [
      { payee: 'Tier-1 Solar Photovoltaics Ltd.', amount: 480000, category: 'equipment_procurement', description: 'Procurement of 60x 540W Mono PERC Half-Cut Modules' },
      { payee: 'CleanTech Power Systems', amount: 320000, category: 'equipment_procurement', description: 'Procurement of 10x 3kW & 5kW Smart Inverters' },
      { payee: 'VoltEdge Energy Storage', amount: 168000, category: 'equipment_procurement', description: 'Procurement of 4x 48V 100Ah LiFePO4 battery units' },
      { payee: 'Prime Logistics Express', amount: 38000, category: 'transportation_logistics', description: 'Site delivery freight across Bengaluru & Pune' },
      { payee: 'SafetyFirst Gears India', amount: 24000, category: 'tools_and_safety_gear', description: 'Rooftop safety harness kits & electrical PPE' }
    ];

    for (const exp of generalExpenses) {
      const expCount = await Expense.countDocuments();
      await Expense.create({
        expenseNumber: `EXP-2026-${String(expCount + 1).padStart(5, '0')}`,
        ...exp,
        expenseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        loggedBy: adminUser._id
      });
    }

    // 8. Default System Settings
    await Setting.create({
      companyName: 'SunPower Solutions',
      tagline: 'Enterprise Solar Rooftop Lifecycle Management',
      contactEmail: 'contact@sunpowersolutions.com',
      contactPhone: '+91 98765 43210',
      address: 'Solar Tech Park, Outer Ring Road, Bengaluru 560103',
      gstNumber: '29AABCS1234D1ZP',
      warrantyDurationsYears: {
        panel: 25,
        inverter: 5,
        battery: 3,
        structure: 10
      },
      subsidySlabs: [
        { minKw: 1, maxKw: 1, subsidyAmount: 30000, scheme: 'PM Surya Ghar: 1 kW Rooftop' },
        { minKw: 2, maxKw: 2, subsidyAmount: 60000, scheme: 'PM Surya Ghar: 2 kW Rooftop' },
        { minKw: 3, maxKw: 10, subsidyAmount: 78000, scheme: 'PM Surya Ghar: 3 kW+ Maximum National Cap' }
      ]
    });

    // 9. Initial Notifications
    await Notification.create([
      {
        targetRole: 'admin',
        title: 'New Site Survey Scheduled',
        message: 'Technician Rajesh Sharma has been assigned to survey CUST-2026-0005 (4 kW On-Grid).',
        type: 'info',
        link: '/surveys'
      },
      {
        targetRole: 'sales',
        title: 'Site Survey Approved',
        message: 'Survey SURV-2026-0012 was approved. Quotation generation is unlocked.',
        type: 'success',
        link: '/quotations'
      },
      {
        targetRole: 'technician',
        title: 'New Installation Assigned',
        message: 'Order ORD-2026-0024 has been assigned to you. Scheduled start tomorrow 09:30 AM.',
        type: 'warning',
        link: '/technician-portal'
      },
      {
        recipient: customerUser._id,
        targetRole: 'customer',
        title: 'Delivery Confirmed & Warranty Active',
        message: 'Your 5 kW Solar Rooftop has been successfully installed. Warranty is now active.',
        type: 'success',
        link: '/customer-portal'
      }
    ]);

    console.log('✅ Database seeded successfully with ~40 projects, 15 technicians, realistic orders, equipment, warranties, and analytics!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
