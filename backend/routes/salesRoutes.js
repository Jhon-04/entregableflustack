const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const salesController = require('../controllers/salesController');

router.use(authenticate);

router.post('/', salesController.createSale);
router.get('/', salesController.getAllSales);
router.get('/:id', salesController.getSaleById);

module.exports = router;