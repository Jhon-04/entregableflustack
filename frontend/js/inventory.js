document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!localStorage.getItem('token') && window.location.pathname.includes('inventory.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos del DOM
    const productsTable = document.getElementById('productsTable');
    const productForm = document.getElementById('productForm');
    const productModal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeModal = document.querySelector('.close');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // Cargar productos al iniciar
    loadProducts();

    // Evento para abrir modal de agregar producto
    addProductBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Agregar Producto';
        document.getElementById('productId').value = '';
        productForm.reset();
        productModal.style.display = 'block';
    });

    // Evento para cerrar modal
    closeModal.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Manejar envío del formulario
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            min_stock: parseInt(document.getElementById('productMinStock').value)
        };

        try {
            if (productId) {
                // Actualizar producto existente
                await updateProduct(productId, productData);
            } else {
                // Crear nuevo producto
                await createProduct(productData);
            }
            
            productModal.style.display = 'none';
            loadProducts();
        } catch (error) {
            console.error('Error al guardar el producto:', error);
            alert('Error al guardar el producto');
        }
    });

    // Evento de búsqueda
    searchBtn.addEventListener('click', () => {
        loadProducts(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadProducts(searchInput.value);
        }
    });

    // Función para cargar productos
    async function loadProducts(searchTerm = '') {
        try {
            let url = 'http://localhost:3000/api/inventory';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }

            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error('Error:', error);
            productsTable.querySelector('tbody').innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: red;">Error al cargar los productos</td>
                </tr>
            `;
        }
    }

    // Función para renderizar productos en la tabla
function renderProducts(products) {
    const tbody = productsTable.querySelector('tbody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">No se encontraron productos</td>
            </tr>
        `;
        return;
    }

    products.forEach(product => {
        // Asegurar que el precio sea numérico
        const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${price.toFixed(2)}</td>
            <td class="${product.stock <= product.min_stock ? 'low-stock' : ''}">${product.stock}</td>
            <td>${product.min_stock}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${product.id}">Editar</button>
                <button class="action-btn delete-btn" data-id="${product.id}">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

        // Agregar eventos a los botones de editar y eliminar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }

    // Función para editar producto
    async function editProduct(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/inventory/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar el producto');
            }

            const product = await response.json();
            
            modalTitle.textContent = 'Editar Producto';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productMinStock').value = product.min_stock;
            
            productModal.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar el producto para editar');
        }
    }

    // Función para crear producto
    async function createProduct(productData) {
        const response = await fetch('http://localhost:3000/api/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Error al crear el producto');
        }
    }

    // Función para actualizar producto
    async function updateProduct(id, productData) {
        const response = await fetch(`http://localhost:3000/api/inventory/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el producto');
        }
    }

    // Función para eliminar producto
    async function deleteProduct(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/inventory/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el producto');
            }

            loadProducts();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el producto');
        }
    }
});