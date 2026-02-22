const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const dataController = require('../controllers/dataController');

router.get('/insights', analyticsController.getDashboardInsights);
router.get('/teachers', analyticsController.getTeachersList);
router.post('/upload', dataController.uploadData);

module.exports = router;