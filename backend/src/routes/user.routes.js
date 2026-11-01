const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', authorize('admin', 'sales'), UserController.listUsers);
router.post('/', authorize('admin', 'sales'), UserController.createUser);
router.put('/:id/status', authorize('admin'), UserController.updateUser);
router.put('/:id', authorize('admin'), UserController.updateUser);
router.delete('/:id', authorize('admin'), UserController.deleteUser);

module.exports = router;
