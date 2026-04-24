const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// Map the endpoints to the controller functions
// Static routes
router.get('/', workerController.getAllWorkers);
router.post('/', workerController.createWorker);
router.post('/login', workerController.loginWorker);
router.post('/attendance', workerController.recordAttendance);
router.get('/attendance', workerController.getAttendanceRecords);

// Parameterized routes (must come after static routes to avoid route hijacking)
router.get('/:id', workerController.getWorkerById);
router.put('/:id', workerController.updateWorker);
router.delete('/:id', workerController.deleteWorker);
router.get('/:id/face-data', workerController.getWorkerFaceData);

// IMPORTANT: You must export the router
module.exports = router;