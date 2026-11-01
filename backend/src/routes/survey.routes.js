const express = require('express');
const router = express.Router();
const SurveyController = require('../controllers/survey.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', SurveyController.listSurveys);
router.get('/:id', SurveyController.getById);

router.post('/', authorize('admin', 'sales', 'technician'), SurveyController.createSurvey);
router.put('/:id', authorize('admin', 'sales', 'technician'), SurveyController.updateSurvey);

// Accept both PUT and POST for approval/rejection workflows
router.route('/:id/approve')
  .put(authorize('admin'), SurveyController.approveSurvey)
  .post(authorize('admin'), SurveyController.approveSurvey);

router.route('/:id/reject')
  .put(authorize('admin'), SurveyController.rejectSurvey)
  .post(authorize('admin'), SurveyController.rejectSurvey);

module.exports = router;
