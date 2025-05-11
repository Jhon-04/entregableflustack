const pool = require('../config/db');

class Product {
    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY name');
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    }

    static async create({ name, description, category, price, stock, min_stock }) {
        const [result] = await pool.query(
            'INSERT INTO products (name, description, category, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, category, price, stock, min_stock]
        );
        return result.insertId;
    }

    static async update(id, { name, description, category, price, stock, min_stock }) {
        await pool.query(
            'UPDATE products SET name = ?, description = ?, category = ?, price = ?, stock = ?, min_stock = ? WHERE id = ?',
            [name, description, category, price, stock, min_stock, id]
        );
    }

    static async delete(id) {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
    }

    static async updateStock(id, quantity) {
        await pool.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, id]);
    }

    static async getLowStock() {
        const [rows] = await pool.query('SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC');
        return rows;
    }
}

module.exports = Product;