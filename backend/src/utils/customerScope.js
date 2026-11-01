const Customer = require('../../models/Customer');

async function resolveOwnedCustomer(user) {
  if (!user) return null;
  let customer = await Customer.findOne({ user: user._id });
  if (!customer && user.email) {
    customer = await Customer.findOne({ email: user.email.toLowerCase().trim() });
  }
  return customer;
}

function customerIdOf(doc) {
  if (!doc) return null;
  const value = doc.customer || doc.installedAtCustomer || doc._id;
  return value?._id ? value._id.toString() : value?.toString();
}

function ownsResource(customer, resourceCustomerId) {
  if (!customer || !resourceCustomerId) return false;
  return customer._id.toString() === resourceCustomerId.toString();
}

module.exports = {
  resolveOwnedCustomer,
  customerIdOf,
  ownsResource
};
