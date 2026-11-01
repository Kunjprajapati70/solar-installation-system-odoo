/**
 * SunPower Solutions - Enterprise Solar Installation Management System
 * Express Application Architecture
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file uploads directory
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'online',
    service: 'SunPower Solutions Enterprise Solar Management Architecture',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Documentation / Swagger Spec Endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'SunPower Solutions Solar Installation Management API',
    version: '2.0.0',
    description: 'Enterprise REST API supporting Admin, Technician, and Customer portals with QR code tracking, warranty automation, and financial reconciliation.',
    documentation: '/api/docs/postman'
  });
});

// ==========================================
// MOUNT MODULAR API ROUTES
// ==========================================

// 1. Authentication & Users
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/approvals', require('./routes/approval.routes'));

// 2. Customer Management & Dedicated Customer Portal
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/customer-portal', require('./routes/customerPortal.routes'));

// 3. Technician Portal & Installations
app.use('/api/technicians', require('./routes/technicianPortal.routes'));
app.use('/api/installations', require('./routes/installation.routes'));

// 4. Surveys, Quotations & Orders
app.use('/api/surveys', require('./routes/survey.routes'));
app.use('/api/quotations', require('./routes/quotation.routes'));
app.use('/api/orders', require('./routes/order.routes'));

// 5. Smart Equipment Tracking & Warranties
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/warranty', require('./routes/warranty.routes'));
app.use('/api/warranties', require('./routes/warranty.routes')); // Alias

// 6. Service Complaints & Diagnostics
app.use('/api/service-tickets', require('./routes/serviceTicket.routes'));

// 7. Financials, Transactions & Expenses
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/payments', require('./routes/transaction.routes')); // Alias
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/finance', require('./routes/finance.routes'));

// 8. Real-Time Analytics & Reporting
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/analytics', require('./routes/dashboard.routes')); // Alias
app.use('/api/reports', require('./routes/report.routes'));

// 9. Inventory, Subsidies, Enquiries, Notifications & Settings
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/subsidies', require('./routes/subsidy.routes'));
app.use('/api/enquiries', require('./routes/enquiry.routes'));
app.use('/api/leads', require('./routes/enquiry.routes')); // Alias for Customer Leads Management
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/settings', require('./routes/setting.routes'));

// Serve the built frontend so opening the API port still shows the app
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
