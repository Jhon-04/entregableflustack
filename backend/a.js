const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminUser() {
  // Configuración de la conexión a la base de datos
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nova_salud'
  });

  try {
    // Datos del usuario admin
    const username = 'admin';
    const email = 'admin@novasalud.com';
    const plainPassword = 'novasalud123'; // Contraseña en texto plano
    const role = 'admin';

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Consulta SQL para insertar el usuario
    const [result] = await connection.execute(
      `INSERT INTO users (username, email, password, role) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       email = VALUES(email), 
       password = VALUES(password), 
       role = VALUES(role)`,
      [username, email, hashedPassword, role]
    );

    if (result.affectedRows === 1) {
      console.log('✅ Usuario admin creado/actualizado exitosamente');
      console.log(`🔑 Usuario: ${username}`);
      console.log(`🔑 Contraseña: ${plainPassword}`);
    } else if (result.affectedRows === 2) {
      console.log('✅ Usuario admin actualizado exitosamente');
    }

  } catch (error) {
    console.error('❌ Error al crear el usuario admin:', error.message);
  } finally {
    await connection.end();
  }
}

// Ejecutar la función
createAdminUser();