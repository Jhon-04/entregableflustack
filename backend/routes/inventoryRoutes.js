const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const inventoryController = require('../controllers/inventoryController');

router.use(authenticate);

router.get('/', inventoryController.getAllProducts);
router.get('/low-stock', inventoryController.getLowStockProducts);
router.get('/:id', inventoryController.getProductById);
router.post('/', inventoryController.createProduct);
router.put('/:id', inventoryController.updateProduct);
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;