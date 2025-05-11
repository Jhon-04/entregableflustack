const Sale = require('../models/Sale');

const createSale = async (req, res) => {
    try {
        const { products, total } = req.body;

        // Validación básica
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Debe incluir al menos un producto' 
            });
        }

        // Validar y formatear productos
        const validatedProducts = products.map(product => {
            const quantity = parseInt(product.quantity);
            const price = parseFloat(product.price);
            const subtotal = parseFloat(product.subtotal);

            if (isNaN(quantity) || quantity <= 0) {
                throw new Error(`Cantidad inválida para producto ${product.id || 'N/A'}`);
            }

            if (isNaN(price) || price <= 0) {
                throw new Error(`Precio inválido para producto ${product.id || 'N/A'}`);
            }

            if (isNaN(subtotal) || subtotal <= 0) {
                throw new Error(`Subtotal inválido para producto ${product.id || 'N/A'}`);
            }

            return {
                id: parseInt(product.id),
                quantity,
                price,
                subtotal
            };
        });

        // Validar total
        const validatedTotal = parseFloat(total);
        if (isNaN(validatedTotal) || validatedTotal <= 0) {
            throw new Error('Total de venta inválido');
        }

        // Crear venta
        const saleId = await Sale.create(req.user.id, validatedTotal, validatedProducts);
        
        return res.status(201).json({ 
            success: true,
            saleId,
            message: 'Venta registrada exitosamente'
        });

    } catch (error) {
        console.error('Error en createSale:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Error al registrar la venta'
        });
    }
};

const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.getAll();
        return res.json({ 
            success: true,
            data: sales 
        });
    } catch (error) {
        console.error('Error en getAllSales:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Error al obtener el listado de ventas'
        });
    }
};

const getSaleById = async (req, res) => {
    try {
        const sale = await Sale.getById(req.params.id);
        if (!sale) {
            return res.status(404).json({ 
                success: false,
                error: 'Venta no encontrada' 
            });
        }
        return res.json({ 
            success: true,
            data: sale 
        });
    } catch (error) {
        console.error('Error en getSaleById:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Error al obtener los detalles de la venta'
        });
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById
};