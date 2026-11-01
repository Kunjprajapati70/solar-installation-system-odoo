const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');

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

// Seed dataset generator
const seedLargeDatabase = async () => {
  try {
    console.log('⚡ Connecting to MongoDB for 1000+ Record Database Generation...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // Purge existing data
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
    console.log('🧹 Purged existing collections.');

    // 1. Core Users (Admin, Sales, Tech, Customer)
    console.log('👤 Seeding Users & Technicians (35+ staff)...');
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

    // 32 Additional Technicians & Field Staff
    const techNames = [
      'Rajesh Sharma', 'Vikram Joshi', 'Amitabh Roy', 'Karthik Raman', 'Manoj Pillai',
      'Suresh Patel', 'Gaurav Kulkarni', 'Deepak Chawla', 'Naveen Reddy', 'Siddharth Bose',
      'Arjun Nair', 'Prakash Mehra', 'Alok Deshmukh', 'Rohan Gupta', 'Tanmay Sen',
      'Manish Tiwari', 'Kunal Trivedi', 'Harish Vyas', 'Bhavesh Parmar', 'Jignesh Shah',
      'Pranav Bhat', 'Sunil Yadav', 'Mahesh Hegde', 'Rakesh Rawat', 'Sachin Gokhale',
      'Abhay Saxena', 'Nikhil Shinde', 'Hemant Patil', 'Jayant Muley', 'Anand Kadam',
      'Chetan Rathod', 'Nitin Chauhan'
    ];

    const technicians = [];
    // Primary demo technician
    const primeTech = await User.create({
      name: techNames[0],
      email: 'tech@sunpower.com',
      password: 'tech123',
      role: 'technician',
      phone: '+91 98111 00001',
      address: 'Solar Operations Center, SG Highway, Ahmedabad',
      technicianDetails: {
        specialization: ['Solar PV Installation', 'Electrical QA'],
        certification: 'Certified Solar Technician',
        rating: 4.8,
        totalJobsCompleted: 28
      }
    });
    technicians.push(primeTech);

    for (let i = 1; i < techNames.length; i++) {
      const emailId = `${techNames[i].toLowerCase().replace(/\s+/g, '.')}.${i}@sunpower.com`;
      const tech = await User.create({
        name: techNames[i],
        email: emailId,
        password: 'tech123',
        role: 'technician',
        phone: `+91 98111 ${String(10000 + i).slice(-5)}`,
        address: `Solar Hub Station ${i}, Zone ${String.fromCharCode(65 + (i % 6))}`,
        technicianDetails: {
          specialization: ['Solar PV Installation', 'Electrical QA'],
          certification: 'Certified Solar Technician',
          rating: 4.4 + ((i % 6) * 0.1),
          totalJobsCompleted: 8 + (i % 20)
        }
      });
      technicians.push(tech);
    }
    console.log(`✅ Seeded ${technicians.length + 3} users.`);

    // 2. Inventory Catalog (30 SKUs)
    const rawInventoryCatalogData = [
      { name: 'Waaree 540W Mono PERC Solar Module', category: 'panel', brand: 'Waaree', model: 'WS-540M', unitCostPrice: 11500, unitSellingPrice: 14800, currentStock: 650, reorderLevel: 80, specifications: { wattage: 540, warrantyYears: 25 } },
      { name: 'Adani 550W Bifacial High Efficiency PV Panel', category: 'panel', brand: 'Adani Solar', model: 'EL-550BF', unitCostPrice: 12200, unitSellingPrice: 15600, currentStock: 480, reorderLevel: 60, specifications: { wattage: 550, warrantyYears: 25 } },
      { name: 'Tata Power 450W Monocrystalline Rooftop Module', category: 'panel', brand: 'Tata Power', model: 'TP-450M', unitCostPrice: 9800, unitSellingPrice: 12500, currentStock: 320, reorderLevel: 50, specifications: { wattage: 450, warrantyYears: 25 } },
      { name: 'Vikram Solar 500W Half-Cut Cell PV Module', category: 'panel', brand: 'Vikram Solar', model: 'VS-500HC', unitCostPrice: 10800, unitSellingPrice: 13900, currentStock: 290, reorderLevel: 40, specifications: { wattage: 500, warrantyYears: 25 } },
      { name: 'Goldi Solar 400W High Irradiance Panel', category: 'panel', brand: 'Goldi Solar', model: 'GS-400HI', unitCostPrice: 8500, unitSellingPrice: 11000, currentStock: 18, reorderLevel: 30, specifications: { wattage: 400, warrantyYears: 25 } },

      { name: 'Growatt 5kW 3-Phase On-Grid Smart Inverter', category: 'inverter', brand: 'Growatt', model: 'MIN-5000TL3-X', unitCostPrice: 38000, unitSellingPrice: 48500, currentStock: 85, reorderLevel: 15, specifications: { wattage: 5000, warrantyYears: 10 } },
      { name: 'Sungrow 10kW Commercial Solar Inverter', category: 'inverter', brand: 'Sungrow', model: 'SG10RT', unitCostPrice: 62000, unitSellingPrice: 78000, currentStock: 6, reorderLevel: 10, specifications: { wattage: 10000, warrantyYears: 10 } },
      { name: 'Havells 3kW Single Phase String Inverter', category: 'inverter', brand: 'Havells', model: 'Enviro-GT3.0', unitCostPrice: 28000, unitSellingPrice: 35500, currentStock: 95, reorderLevel: 20, specifications: { wattage: 3000, warrantyYears: 10 } },
      { name: 'Microtek 8kW Hybrid Solar Inverter with MPPT', category: 'inverter', brand: 'Microtek', model: 'SunWatt-8K', unitCostPrice: 52000, unitSellingPrice: 66000, currentStock: 4, reorderLevel: 8, specifications: { wattage: 8000, warrantyYears: 7 } },
      { name: 'Luminous 3.5kVA Solar Hybrid PCU Inverter', category: 'inverter', brand: 'Luminous', model: 'Solarverter-3.5', unitCostPrice: 26000, unitSellingPrice: 33000, currentStock: 70, reorderLevel: 12, specifications: { wattage: 3500, warrantyYears: 5 } },

      { name: 'Livguard 5.12kWh LiFePO4 Lithium Battery Pack', category: 'battery', brand: 'Livguard', model: 'LG-LFP-5120', unitCostPrice: 85000, unitSellingPrice: 108000, currentStock: 35, reorderLevel: 8, specifications: { capacityAh: 100, voltage: 51.2, warrantyYears: 5 } },
      { name: 'Exide 4.8kWh Wall-Mounted Energy Storage', category: 'battery', brand: 'Exide', model: 'PowerSafe-48', unitCostPrice: 79000, unitSellingPrice: 99500, currentStock: 3, reorderLevel: 6, specifications: { capacityAh: 100, voltage: 48, warrantyYears: 5 } },
      { name: 'Okaya 10kWh Modular Lithium Storage Bank', category: 'battery', brand: 'Okaya', model: 'EcoLFP-100', unitCostPrice: 155000, unitSellingPrice: 195000, currentStock: 2, reorderLevel: 4, specifications: { capacityAh: 200, voltage: 51.2, warrantyYears: 7 } },

      { name: 'HDG Elevated Rooftop Mounting Structure 3kW', category: 'structure', brand: 'SunMount', model: 'HDG-3KW-E', unitCostPrice: 14000, unitSellingPrice: 19000, currentStock: 120, reorderLevel: 20, specifications: { warrantyYears: 10 } },
      { name: 'HDG Elevated Rooftop Mounting Structure 5kW', category: 'structure', brand: 'SunMount', model: 'HDG-5KW-E', unitCostPrice: 22000, unitSellingPrice: 29500, currentStock: 90, reorderLevel: 15, specifications: { warrantyYears: 10 } },
      { name: 'HDG Superstructure Elevated Pergola 10kW', category: 'structure', brand: 'SunMount', model: 'HDG-10KW-P', unitCostPrice: 42000, unitSellingPrice: 56000, currentStock: 40, reorderLevel: 8, specifications: { warrantyYears: 10 } },

      { name: 'Polycab 4 sq.mm Solar DC Cable (100m Roll)', category: 'cables', brand: 'Polycab', model: 'DC-4MM-100', unitCostPrice: 4200, unitSellingPrice: 5600, currentStock: 240, reorderLevel: 40, specifications: { warrantyYears: 10 } },
      { name: 'Havells 6 sq.mm Heavy Duty DC Cable (100m Roll)', category: 'cables', brand: 'Havells', model: 'DC-6MM-100', unitCostPrice: 5800, unitSellingPrice: 7800, currentStock: 180, reorderLevel: 30, specifications: { warrantyYears: 10 } },
      { name: 'Finolex 3-Core AC Output Cable (100m Roll)', category: 'cables', brand: 'Finolex', model: 'AC-3C-100', unitCostPrice: 6500, unitSellingPrice: 8500, currentStock: 150, reorderLevel: 25, specifications: { warrantyYears: 10 } },

      { name: 'Schneider Dual DC SPD Protection Box 1000V', category: 'accessories', brand: 'Schneider', model: 'DC-SPD-1000', unitCostPrice: 3800, unitSellingPrice: 5200, currentStock: 160, reorderLevel: 30, specifications: { warrantyYears: 5 } },
      { name: 'L&T 4-Pole AC Distribution Box with MCB', category: 'accessories', brand: 'L&T', model: 'ACDB-4P-32', unitCostPrice: 4500, unitSellingPrice: 6200, currentStock: 140, reorderLevel: 25, specifications: { warrantyYears: 5 } },
      { name: 'Copper Chemical Earthing Electrode with BFC 2m', category: 'accessories', brand: 'EarthSafe', model: 'CE-2M-CU', unitCostPrice: 2800, unitSellingPrice: 3900, currentStock: 220, reorderLevel: 40, specifications: { warrantyYears: 5 } },
      { name: 'ESE Early Streamer Lightning Protection Rod', category: 'accessories', brand: 'Forend', model: 'ESE-60M', unitCostPrice: 8500, unitSellingPrice: 11800, currentStock: 7, reorderLevel: 15, specifications: { warrantyYears: 10 } }
    ];

    const inventoryCatalogData = rawInventoryCatalogData.map((item, idx) => ({
      ...item,
      itemCode: `SKU-${item.category.toUpperCase().slice(0, 3)}-${String(1000 + idx)}`,
      availableStock: item.currentStock,
      reservedStock: 0,
      unit: 'pcs',
      supplier: { name: `${item.brand} Official Distributor`, contact: '+91 99000 11223' }
    }));

    const inventoryItems = await Inventory.create(inventoryCatalogData);
    console.log(`✅ Seeded ${inventoryItems.length} inventory SKUs.`);

    // 3. Customers (120+ Real Indian Customers)
    console.log('👥 Seeding Customers (120+ profiles)...');
    const indianCities = [
      { city: 'Ahmedabad', state: 'Gujarat', pin: '380015' },
      { city: 'Surat', state: 'Gujarat', pin: '395007' },
      { city: 'Vadodara', state: 'Gujarat', pin: '390001' },
      { city: 'Rajkot', state: 'Gujarat', pin: '360001' },
      { city: 'Bengaluru', state: 'Karnataka', pin: '560034' },
      { city: 'Pune', state: 'Maharashtra', pin: '411001' },
      { city: 'Hyderabad', state: 'Telangana', pin: '500081' },
      { city: 'Jaipur', state: 'Rajasthan', pin: '302001' },
      { city: 'Chandigarh', state: 'Punjab', pin: '160017' },
      { city: 'Chennai', state: 'Tamil Nadu', pin: '600028' },
      { city: 'Gurugram', state: 'Haryana', pin: '122002' },
      { city: 'Kochi', state: 'Kerala', pin: '682001' }
    ];

    const firstNames = [
      'Ramesh', 'Suresh', 'Pooja', 'Sunita', 'Devendra', 'Naveen', 'Ritu', 'Kavita',
      'Arun', 'Venkatesh', 'Kiran', 'Sanjay', 'Manish', 'Geeta', 'Meena', 'Bhupendra',
      'Nilesh', 'Mahesh', 'Bhavna', 'Paresh', 'Kamlesh', 'Dharmendra', 'Tarun', 'Anil',
      'Rekha', 'Deepak', 'Vijay', 'Shweta', 'Gopal', 'Rohit', 'Ashok', 'Neelam'
    ];
    const lastNames = [
      'Shah', 'Patel', 'Sharma', 'Verma', 'Joshi', 'Gupta', 'Mehta', 'Kulkarni',
      'Rao', 'Nair', 'Iyer', 'Reddy', 'Agarwal', 'Chawla', 'Desai', 'Bose',
      'Pandey', 'Mishra', 'Trivedi', 'Hegde', 'Choudhary', 'Singhal', 'Malhotra'
    ];

    const customerDocs = [];
    // Ensure primary demo customer is mapped
    customerDocs.push({
      customerCode: 'CUST-000001',
      user: customerUser._id,
      name: 'Priya Sundaram',
      email: 'customer@sunpower.com',
      phone: '+91 98203 34567',
      connectionType: 'on_grid',
      sanctionedLoadKw: 5,
      currentPhase: 'single',
      installationAddress: {
        street: 'Villa 42, Palm Meadows Green, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066'
      },
      createdAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000)
    });

    for (let i = 1; i < 250; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const loc = indianCities[i % indianCities.length];
      const daysAgo = Math.floor(Math.random() * 340) + 10;

      customerDocs.push({
        customerCode: `CUST-${String(100000 + i).slice(-5)}`,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
        phone: `+91 98${String(10000000 + i).slice(-8)}`,
        connectionType: ['on_grid', 'hybrid', 'off_grid'][i % 3],
        sanctionedLoadKw: [3, 5, 8, 10, 15][i % 5],
        currentPhase: i % 5 === 0 ? 'three' : 'single',
        installationAddress: {
          street: `House #${10 + (i % 80)}, Sector ${1 + (i % 25)}, Sunshine Avenue`,
          city: loc.city,
          state: loc.state,
          pincode: loc.pin
        },
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }

    const customers = await Customer.create(customerDocs);
    console.log(`✅ Seeded ${customers.length} customers.`);

    // 4. Enquiries (150+ Leads)
    console.log('📋 Seeding Enquiries (150+ leads)...');
    const enquiryDocs = [];
    for (let i = 0; i < 250; i++) {
      const cust = customers[i % customers.length];
      const daysAgo = Math.floor(Math.random() * 330) + 15;
      const capacity = [3, 5, 8, 10, 15][i % 5];
      const systemType = ['on_grid', 'hybrid', 'off_grid'][i % 3];

      enquiryDocs.push({
        enquiryNumber: `ENQ-${String(100000 + i).slice(-5)}`,
        customerName: cust.name,
        email: cust.email,
        phone: cust.phone,
        proposedCapacityKw: capacity,
        systemType,
        monthlyElectricityBill: capacity * 1100,
        linkedCustomer: cust._id,
        assignedSales: salesUser._id,
        address: cust.installationAddress,
        status: ['survey_scheduled', 'survey_completed', 'quoted', 'won'][i % 4],
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }
    const enquiries = await Enquiry.create(enquiryDocs);
    console.log(`✅ Seeded ${enquiries.length} enquiries.`);

    // 5. Site Surveys (160+ Surveys across 12 months)
    console.log('🔍 Seeding Site Surveys (160+ audits)...');
    const surveyDocs = [];
    for (let i = 0; i < 220; i++) {
      const cust = customers[i % customers.length];
      const enq = enquiries[i % enquiries.length];
      const tech = technicians[i % technicians.length];
      const daysAgo = Math.floor(Math.random() * 320) + 12;
      const capacity = [3, 5, 8, 10, 15][i % 5];
      const isApproved = i < 190;

      surveyDocs.push({
        surveyNumber: `SRV-${String(100000 + i).slice(-5)}`,
        enquiry: enq._id,
        customer: cust._id,
        surveyor: tech._id,
        scheduledDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        status: isApproved ? 'approved' : i % 2 === 0 ? 'scheduled' : 'rejected',
        roofDetails: {
          roofType: ['rcc_flat', 'tin_shed', 'tiled', 'elevated'][i % 4],
          totalRoofAreaSqft: 600 + (capacity * 100),
          shadowFreeAreaSqft: 500 + (capacity * 80),
          orientation: 'South',
          tiltAngleDeg: 18 + (i % 6),
          azimuthDeg: 180,
          structuralIntegrity: 'good'
        },
        electricalDetails: {
          phase: capacity > 5 ? 'three_phase' : 'single',
          sanctionedLoadKw: capacity,
          averageMonthlyConsumptionKwh: capacity * 120,
          monthlyBillAmount: capacity * 1100,
          existingMeterType: 'digital_bidirectional',
          earthingStatus: 'adequate',
          distanceToPanelMeters: 12 + (i % 10)
        },
        approvalDetails: {
          isApproved,
          approvedBy: isApproved ? adminUser._id : undefined,
          approvedAt: isApproved ? new Date(Date.now() - (daysAgo - 2) * 24 * 60 * 60 * 1000) : undefined,
          approvalNotes: isApproved
            ? 'Roof load bearing capacity and southern irradiance confirmed. Approved for commercial quotation.'
            : 'Pending structural engineer clearance.',
          recommendedCapacityKw: capacity,
          recommendedSystemType: enq.systemType || 'on_grid'
        },
        surveyorNotes: `Survey executed at ${cust.installationAddress.city}. Roof clear of obstacles.`
      });
    }
    const surveys = await SiteSurvey.create(surveyDocs);
    console.log(`✅ Seeded ${surveys.length} site surveys.`);

    // 6. Quotations (150+ Commercial Quotations)
    console.log('📑 Seeding Quotations (150+ records)...');
    const quotationDocs = [];
    for (let i = 0; i < 200; i++) {
      const surv = surveys[i];
      const cust = customers[i % customers.length];
      const capacity = surv.approvalDetails?.recommendedCapacityKw || 5;
      const type = surv.approvalDetails?.recommendedSystemType || 'on_grid';
      const daysAgo = Math.floor(Math.random() * 300) + 10;

      const gross = capacity * 55000;
      const subsidy = capacity <= 3 ? capacity * 26000 : 78000;
      const net = gross - subsidy;

      const bomItems = [
        { itemName: 'Waaree 540W Mono PERC Solar Module', name: 'Waaree 540W Mono PERC Solar Module', category: 'panel', quantity: Math.ceil((capacity * 1000) / 540), unitPrice: 14800, totalPrice: Math.ceil((capacity * 1000) / 540) * 14800 },
        { itemName: 'Growatt 5kW 3-Phase On-Grid Smart Inverter', name: 'Growatt 5kW 3-Phase On-Grid Smart Inverter', category: 'inverter', quantity: 1, unitPrice: 48500, totalPrice: 48500 },
        { itemName: 'HDG Elevated Rooftop Mounting Structure', name: 'HDG Elevated Rooftop Mounting Structure', category: 'structure', quantity: 1, unitPrice: 22000, totalPrice: 22000 },
        { itemName: 'Schneider DC/AC Protection SPD Switchgear', name: 'Schneider DC/AC Protection SPD Switchgear', category: 'accessories', quantity: 1, unitPrice: 8500, totalPrice: 8500 }
      ];

      const isApproved = surv.status === 'approved';
      const isConverted = isApproved && i < 180;

      quotationDocs.push({
        quotationNumber: `QUO-${String(100000 + i).slice(-5)}`,
        siteSurvey: surv._id,
        customer: cust._id,
        systemCapacityKw: capacity,
        systemType: type,
        bom: bomItems,
        pricing: {
          equipmentTotal: gross - 25000,
          installationLabour: 15000,
          laborCost: 15000,
          transportAndLiaison: 4000,
          transportCost: 4000,
          subtotal: gross - 6000,
          taxGst: Math.round(gross * 0.12),
          grossTotal: gross,
          estimatedSubsidy: subsidy,
          netPayable: net,
          discount: 0
        },
        paymentTerms: {
          advancePercent: 30,
          deliveryPercent: 50,
          installationCompletePercent: 20
        },
        status: isConverted ? 'converted' : isApproved ? 'approved' : 'draft',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        approvedAt: isApproved ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000) : undefined,
        createdBy: salesUser._id,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }
    const quotations = await Quotation.create(quotationDocs);
    console.log(`✅ Seeded ${quotations.length} quotations.`);

    // 7. Orders (125+ Confirmed Project Orders)
    console.log('🛍️ Seeding Orders (125+ orders)...');
    const orderDocs = [];
    for (let i = 0; i < 180; i++) {
      const q = quotations[i];
      const daysAgo = Math.floor(Math.random() * 280) + 10;
      const total = q.pricing.netPayable;
      const advance = Math.round(total * 0.3);
      const isCompleted = i < 120;
      const isDelivered = i < 150;

      orderDocs.push({
        orderNumber: `ORD-${String(100000 + i).slice(-5)}`,
        quotation: q._id,
        customer: q.customer,
        systemCapacityKw: q.systemCapacityKw,
        systemType: q.systemType,
        totalAmount: total,
        advanceRequired: advance,
        advancePaid: advance,
        balanceAmount: isCompleted ? 0 : total - advance,
        paymentStatus: isCompleted ? 'paid' : 'partially_paid',
        orderStatus: isCompleted ? 'completed' : isDelivered ? 'delivery_confirmed' : 'in_installation',
        deliveryConfirmedAt: isDelivered ? new Date(Date.now() - (daysAgo - 5) * 24 * 60 * 60 * 1000) : undefined,
        deliveryAcceptanceNotes: 'Physical delivery verified by customer on site.',
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        milestones: [
          { stageName: 'Order Confirmed', status: 'completed', completedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) },
          { stageName: 'Stock Check & BOM Allocation', status: 'completed', completedAt: new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000) },
          { stageName: 'Logistics & Dispatch', status: isDelivered ? 'completed' : 'in_progress' },
          { stageName: 'Installation & Quality Testing', status: isCompleted ? 'completed' : 'pending' },
          { stageName: 'Delivery & Customer Handover', status: isDelivered ? 'completed' : 'pending' },
          { stageName: 'Net Metering & Subsidy Commissioning', status: isCompleted ? 'completed' : 'pending' }
        ]
      });
    }
    const orders = await Order.create(orderDocs);
    console.log(`✅ Seeded ${orders.length} orders.`);

    // 8. Serialized Equipment (280+ Physical Units with QR)
    console.log('⚡ Generating 280+ Serialized Equipment with QR Codes...');
    const equipmentDocs = [];
    for (let i = 1; i <= 400; i++) {
      const order = orders[i % orders.length];
      const cust = customers[i % customers.length];
      const isPanel = i <= 150;
      const isInverter = i > 150 && i <= 230;
      const category = isPanel ? 'panel' : isInverter ? 'inverter' : 'battery';

      const prefix = isPanel ? 'SP-PAN-2026' : isInverter ? 'SP-INV-2026' : 'SP-BAT-2026';
      const serialNumber = `${prefix}-${String(10000 + i).slice(-5)}`;
      const brand = isPanel ? 'Waaree Solar' : isInverter ? 'Growatt' : 'Livguard';
      const model = isPanel ? '540W Mono PERC' : isInverter ? 'MIN-5000TL3-X' : 'LFP-5120';

      const qrPayload = {
        serialNumber,
        category,
        brand,
        model,
        customerName: cust.name,
        systemCapacity: `${order.systemCapacityKw} kW`,
        verifiedBy: 'SunPower Solutions QA'
      };
      const qrDataUrl = i <= 25 ? await generateQR(qrPayload) : `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='white'/><text x='8' y='68' font-size='10'>${serialNumber}</text></svg>`;

      equipmentDocs.push({
        serialNumber,
        qrCodeData: JSON.stringify(qrPayload),
        qrCodeImage: qrDataUrl,
        category,
        brand,
        model,
        specifications: {
          wattage: isPanel ? 540 : isInverter ? 5000 : undefined,
          warrantyYears: isPanel ? 25 : isInverter ? 10 : 5,
          details: `${category.toUpperCase()} Unit • ${model}`
        },
        customer: cust._id,
        installedAtCustomer: cust._id,
        order: order._id,
        allocatedToOrder: order._id,
        status: i <= 280 ? 'installed' : i <= 340 ? 'dispatched' : 'in_stock',
        installedAt: new Date(Date.now() - Math.floor(Math.random() * 200 + 10) * 24 * 60 * 60 * 1000)
      });
    }
    const equipmentList = await Equipment.create(equipmentDocs);
    console.log(`✅ Seeded ${equipmentList.length} equipment units with QR.`);

    // 9. Installations (110+ Records with QA assembly checklists)
    console.log('🔧 Seeding Installations (110+ jobs)...');
    const installationDocs = [];
    for (let i = 0; i < 160; i++) {
      const order = orders[i % orders.length];
      const cust = customers[i % customers.length];
      const tech = technicians[i % technicians.length];
      const daysAgo = Math.floor(Math.random() * 250) + 10;
      const isCompleted = i < 120;

      const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const finishTime = isCompleted ? new Date(startTime.getTime() + 6.5 * 60 * 60 * 1000) : undefined;

      installationDocs.push({
        installationNumber: `INS-${String(100000 + i).slice(-5)}`,
        order: order._id,
        customer: cust._id,
        leadTechnician: tech._id,
        scheduledDate: startTime,
        status: isCompleted ? 'customer_accepted' : 'in_progress',
        systemCapacityKw: order.systemCapacityKw,
        startedAt: startTime,
        completedAt: finishTime,
        totalWorkingHours: isCompleted ? 6.5 : 2.5,
        testingResults: {
          vocVolts: 242.8,
          iscAmperes: 13.5,
          inverterSyncStatus: 'synced',
          earthingResistanceOhms: 1.6,
          generationCheckKw: order.systemCapacityKw * 0.96,
          testedAt: isCompleted ? finishTime : startTime,
          testedBy: tech.name,
          comments: 'DC string open-circuit and short-circuit test passed within standard tolerance.'
        },
        installationPhotos: [
          { url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800', caption: 'Rooftop Array Mounting & Alignment', uploadedAt: startTime },
          { url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800', caption: 'Inverter & ACDB Termination', uploadedAt: startTime }
        ],
        customerAcceptance: {
          isAccepted: isCompleted,
          signedName: isCompleted ? cust.name : '',
          signatureData: isCompleted ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCAzMCBRIDMwIDUgNTAgMjAgVCA5MCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTA4OTgxIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=' : '',
          remarks: 'Satisfied with system generation and clean cable dressing.',
          rating: 5,
          acceptedAt: finishTime
        },
        steps: [
          { id: 'step-1', title: 'Mounting Structure Mechanical Assembly & Anchor Fastening', status: 'completed' },
          { id: 'step-2', title: 'Solar PV Modules Clamping & DC Array Stringing', status: 'completed' },
          { id: 'step-3', title: 'Smart Inverter & AC/DC Protection Box Mounting', status: 'completed' },
          { id: 'step-4', title: 'Chemical Earthing & Surge Protection Bonding', status: 'completed' },
          { id: 'step-5', title: 'Open Circuit Voltage (Voc) & Short Circuit (Isc) QA Testing', status: 'completed' },
          { id: 'step-6', title: 'Inverter Grid Synchronization & Generation Handover', status: isCompleted ? 'completed' : 'in_progress' }
        ]
      });
    }
    const installations = await Installation.create(installationDocs);
    console.log(`✅ Seeded ${installations.length} installations.`);

    // 10. Warranties (110+ Active/Expired Records on Confirmed Delivery)
    console.log('🛡️ Seeding Warranties (110+ certificates)...');
    const warrantyDocs = [];
    for (let i = 0; i < 160; i++) {
      const eq = equipmentList[i];
      const cust = customers[i % customers.length];
      const isExpired = i >= 95; // Last 20 expired
      const isUpcoming = i >= 80 && i < 95;

      const durationYears = eq.category === 'panel' ? 25 : eq.category === 'inverter' ? 5 : 3;
      const startDaysAgo = isExpired ? (durationYears * 365 + 30) : isUpcoming ? (durationYears * 365 - 20) : Math.floor(Math.random() * 200 + 10);
      const startDate = new Date(Date.now() - startDaysAgo * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(startDate.getTime() + durationYears * 365 * 24 * 60 * 60 * 1000);

      warrantyDocs.push({
        certificateNumber: `WARR-${String(100000 + i).slice(-5)}`,
        equipment: eq._id,
        serialNumber: eq.serialNumber,
        customer: cust._id,
        order: eq.allocatedToOrder || eq.order,
        category: eq.category,
        brand: eq.brand,
        model: eq.model,
        durationYears,
        startDate,
        expiryDate,
        status: isExpired ? 'expired' : 'active',
        coverageDetails: 'Complete SLA: Includes zero-charge customer parts, repair labour, and inverter replacement.',
        createdAt: startDate
      });
    }
    const warranties = await Warranty.create(warrantyDocs);
    console.log(`✅ Seeded ${warranties.length} warranties.`);

    // 11. Service Tickets (85+ Tickets with in-warranty ₹0 / out-of-warranty charges)
    console.log('🎫 Seeding Service Tickets (85+ repairs)...');
    const ticketDocs = [];
    const issueCategories = [
      'inverter_fault',
      'generation_drop',
      'cable_earthing_fault',
      'grid_sync_issue',
      'routine_maintenance'
    ];
    for (let i = 0; i < 120; i++) {
      const cust = customers[i % customers.length];
      const warr = warranties[i % warranties.length];
      const tech = technicians[i % technicians.length];
      const isInWarranty = warr.status === 'active';
      const isResolved = i < 85;
      const category = issueCategories[i % issueCategories.length];

      ticketDocs.push({
        ticketNumber: `TCK-${String(100000 + i).slice(-5)}`,
        customer: cust._id,
        equipmentSerialNumber: warr.serialNumber,
        warranty: warr._id,
        warrantyStatusAtTicket: isInWarranty ? 'in_warranty' : 'out_of_warranty',
        assignedTechnician: tech._id,
        issueCategory: category,
        priority: ['low', 'medium', 'high', 'critical'][i % 4],
        title: `Service Inspection for ${category.replace(/_/g, ' ').toUpperCase()}`,
        description: 'Observed intermittent generation drop and inverter error code during peak midday sunshine.',
        status: isResolved ? 'resolved' : 'in_progress',
        charges: {
          partsCost: isInWarranty ? 0 : 2500,
          labourCost: isInWarranty ? 0 : 1000,
          discountAmount: 0,
          totalCustomerPayable: isInWarranty ? 0 : 3500 // In-warranty is ₹0!
        },
        resolutionDetails: {
          actionTaken: isResolved ? 'Replaced blown DC MCB fuse and calibrated solar inverter firmware.' : '',
          resolvedAt: isResolved ? new Date() : undefined,
          resolutionNotes: isResolved ? 'System successfully tested and generation stabilized.' : ''
        },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 120 + 2) * 24 * 60 * 60 * 1000)
      });
    }
    const tickets = await ServiceTicket.create(ticketDocs);
    console.log(`✅ Seeded ${tickets.length} service tickets.`);

    // 12. Payments & Financial Transactions (220+ records)
    console.log('💳 Seeding Financial Payments (220+ transactions)...');
    const paymentDocs = [];
    const paymentTypes = ['advance', 'milestone', 'final'];
    const paymentMethods = ['upi', 'bank_transfer', 'cheque', 'cash', 'card'];
    for (let i = 0; i < 250; i++) {
      const order = orders[i % orders.length];
      const cust = customers[i % customers.length];
      const daysAgo = Math.floor(Math.random() * 260) + 5;
      const amount = [50000, 75000, 100000, 150000, 200000][i % 5];

      paymentDocs.push({
        receiptNumber: `REC-${String(100000 + i).slice(-5)}`,
        order: order._id,
        customer: cust._id,
        amount,
        paymentType: paymentTypes[i % paymentTypes.length],
        paymentMethod: paymentMethods[i % paymentMethods.length],
        transactionReference: `UTR${Date.now().toString().slice(-6)}${i}IND`,
        status: 'completed',
        paidAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        notes: `Payment recorded towards Order #${order.orderNumber}.`
      });
    }
    const payments = await Payment.create(paymentDocs);
    console.log(`✅ Seeded ${payments.length} payment transactions.`);

    // 13. Operational Expenses (110+ records)
    console.log('💰 Seeding Operational Expenses (110+ records)...');
    const expenseDocs = [];
    const expenseCategories = [
      'equipment_procurement',
      'technician_labour',
      'transportation_logistics',
      'tools_and_safety_gear',
      'permits_and_liaison'
    ];
    for (let i = 0; i < 130; i++) {
      const daysAgo = Math.floor(Math.random() * 260) + 5;
      const amount = [3500, 8500, 14000, 22000, 35000][i % 5];

      expenseDocs.push({
        expenseNumber: `EXP-${String(100000 + i).slice(-5)}`,
        category: expenseCategories[i % expenseCategories.length],
        order: orders[i % orders.length]._id,
        amount,
        payee: `Industrial Supply Corp ${i % 10 + 1}`,
        description: `Project logistics, structural anchoring materials, and high-voltage safety gear.`,
        expenseDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        loggedBy: adminUser._id
      });
    }
    const expenses = await Expense.create(expenseDocs);
    console.log(`✅ Seeded ${expenses.length} operating expenses.`);

    // 14. Notifications (60+ records)
    console.log('🔔 Seeding System Notifications (60+ records)...');
    const notificationDocs = [];
    for (let i = 0; i < 80; i++) {
      notificationDocs.push({
        title: [
          'Site Survey Approved',
          'Quotation Generated & Calculated',
          'Order Milestones Reached',
          'Quality Testing Validated',
          'Warranty Certificate Issued'
        ][i % 5],
        message: `System notification regarding project execution for client ${customers[i % customers.length].name}.`,
        type: ['success', 'info', 'warning'][i % 3],
        isRead: i < 35,
        recipient: adminUser._id,
        targetRole: 'admin',
        createdAt: new Date(Date.now() - (i * 4) * 60 * 60 * 1000)
      });
    }
    const notifications = await Notification.create(notificationDocs);
    console.log(`✅ Seeded ${notifications.length} system notifications.`);

    console.log('🏛️ Seeding Subsidy applications (90+ PM Surya Ghar files)...');
    const subsidyDocs = [];
    const subsidyStatuses = [
      'application_submitted',
      'feasibility_approved',
      'meter_installation_passed',
      'inspection_completed',
      'subsidy_approved',
      'disbursed'
    ];
    for (let i = 0; i < 90; i++) {
      const order = orders[i % orders.length];
      const cust = customers[i % customers.length];
      const eligible = order.systemCapacityKw <= 3 ? order.systemCapacityKw * 26000 : 78000;
      const status = subsidyStatuses[i % subsidyStatuses.length];
      subsidyDocs.push({
        applicationNumber: `SUB-${String(100000 + i).slice(-5)}`,
        order: order._id,
        customer: cust._id,
        portalScheme: 'PM Surya Ghar: Muft Bijli Yojana',
        stateDiscom: cust.installationAddress?.state === 'Gujarat' ? 'UGVCL' : 'State DISCOM',
        consumerNumber: `CNS-${String(200000 + i)}`,
        capacityKw: order.systemCapacityKw,
        subsidyEligibleAmount: eligible,
        subsidyDisbursedAmount: status === 'disbursed' ? eligible : 0,
        status,
        applicationDate: new Date(Date.now() - (20 + (i % 200)) * 24 * 60 * 60 * 1000),
        disbursementDate: status === 'disbursed' ? new Date() : undefined
      });
    }
    const subsidies = await Subsidy.create(subsidyDocs);
    console.log(`✅ Seeded ${subsidies.length} subsidy applications.`);

    // Final Record Count Summary
    const totalRecords =
      (technicians.length + 3) +
      inventoryItems.length +
      customers.length +
      enquiries.length +
      surveys.length +
      quotations.length +
      orders.length +
      equipmentList.length +
      installations.length +
      warranties.length +
      tickets.length +
      payments.length +
      expenses.length +
      notifications.length +
      subsidies.length;

    console.log('\n======================================================');
    console.log(`🎉 DATABASE SEEDING COMPLETE!`);
    console.log(`TOTAL RECORDS INSERTED: ${totalRecords} (Well exceeds 1000+ required)`);
    console.log('------------------------------------------------------');
    console.log(`Users & Technicians : ${technicians.length + 3}`);
    console.log(`Customers           : ${customers.length}`);
    console.log(`Enquiries           : ${enquiries.length}`);
    console.log(`Site Surveys        : ${surveys.length}`);
    console.log(`Quotations          : ${quotations.length}`);
    console.log(`Orders              : ${orders.length}`);
    console.log(`Inventory Items     : ${inventoryItems.length}`);
    console.log(`Equipment (with QR) : ${equipmentList.length}`);
    console.log(`Installations       : ${installations.length}`);
    console.log(`Warranties          : ${warranties.length}`);
    console.log(`Service Tickets     : ${tickets.length}`);
    console.log(`Payments            : ${payments.length}`);
    console.log(`Expenses            : ${expenses.length}`);
    console.log(`Notifications       : ${notifications.length}`);
    console.log(`Subsidies           : ${subsidies.length}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
};

seedLargeDatabase();
