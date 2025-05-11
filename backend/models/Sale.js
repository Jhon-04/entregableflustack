const pool = require('../config/db');

class Sale {
    static async create(userId, total, products) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Verificar stock de productos
            for (const product of products) {
                const [rows] = await connection.query(
                    'SELECT stock FROM products WHERE id = ? FOR UPDATE', 
                    [product.id]
                );
                
                if (rows.length === 0) {
                    throw new Error(`Producto ${product.id} no encontrado`);
                }
                
                if (rows[0].stock < product.quantity) {
                    throw new Error(`Stock insuficiente para producto ${product.id}`);
                }
            }

            // 2. Insertar venta principal
            const [saleResult] = await connection.query(
                'INSERT INTO sales (user_id, total, payment_method) VALUES (?, ?, ?)',
                [userId, total, 'cash']
            );
            const saleId = saleResult.insertId;

            // 3. Insertar productos vendidos y actualizar stock
            for (const product of products) {
                // En el método create, cambia la consulta a:
await connection.query(
    'INSERT INTO sale_products (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
    [saleId, product.id, product.quantity, product.price]
);

                const [updateResult] = await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [product.quantity, product.id]
                );

                if (updateResult.affectedRows === 0) {
                    throw new Error(`No se pudo actualizar stock para producto ${product.id}`);
                }
            }

            await connection.commit();
            return saleId;
        } catch (error) {
            await connection.rollback();
            console.error('Error en transacción de venta:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    s.id, 
                    s.total,
                    DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') as sale_date,
                    u.username as seller
                FROM sales s
                JOIN users u ON s.user_id = u.id
                ORDER BY s.created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [saleRows] = await pool.query(`
                SELECT 
                    s.id,
                    s.total,
                    DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') as sale_date,
                    u.username as seller
                FROM sales s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = ?
            `, [id]);

            if (saleRows.length === 0) return null;

            // En getById, cambia la consulta a:
const [detailRows] = await pool.query(`
    SELECT 
        p.name as product_name,
        sp.quantity,
        sp.unit_price,
        (sp.quantity * sp.unit_price) as subtotal
    FROM sale_products sp
    JOIN products p ON sp.product_id = p.id
    WHERE sp.sale_id = ?
`, [id]);

            return {
                ...saleRows[0],
                details: detailRows
            };
        } catch (error) {
            console.error('Error al obtener venta:', error);
            throw error;
        }
    }
}

module.exports = Sale;