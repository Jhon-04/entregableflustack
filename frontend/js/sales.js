document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const salesTable = document.getElementById('salesTable');
    const newSaleBtn = document.getElementById('newSaleBtn');
    const saleModal = document.getElementById('saleModal');
    const productSearch = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    const saleItemsTable = document.getElementById('saleItemsTable');
    const saleTotal = document.getElementById('saleTotal');
    const completeSaleBtn = document.getElementById('completeSaleBtn');
    const saleDetailModal = document.getElementById('saleDetailModal');
    const closeButtons = document.querySelectorAll('.close');

    // Variables de estado
    let currentSaleItems = [];

    // Inicialización
    checkAuth();
    loadSales();
    setupEventListeners();

    function checkAuth() {
        if (!localStorage.getItem('token')) {
            window.location.href = 'login.html';
        }
    }

    function setupEventListeners() {
        newSaleBtn.addEventListener('click', openNewSaleModal);
        completeSaleBtn.addEventListener('click', registerSale);
        productSearch.addEventListener('input', debounce(handleProductSearch, 300));
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                saleModal.style.display = 'none';
                saleDetailModal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === saleModal) saleModal.style.display = 'none';
            if (e.target === saleDetailModal) saleDetailModal.style.display = 'none';
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function loadSales() {
        try {
            showLoading(true);
            const response = await fetch('http://localhost:3000/api/sales', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al cargar ventas');
            }

            renderSales(result.data || []);
        } catch (error) {
            showError(error.message);
            console.error('Error al cargar ventas:', error);
        } finally {
            showLoading(false);
        }
    }

    async function registerSale() {
        if (currentSaleItems.length === 0) {
            showError('Debe agregar al menos un producto');
            return;
        }

        const saleData = {
            products: currentSaleItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            })),
            total: currentSaleItems.reduce((sum, item) => sum + item.subtotal, 0)
        };

        try {
            showLoading(true);
            const response = await fetch('http://localhost:3000/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(saleData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al registrar venta');
            }

            // Éxito: resetear y recargar
            currentSaleItems = [];
            renderSaleItems();
            await loadSales();
            saleModal.style.display = 'none';
            showSuccess('Venta registrada correctamente');
        } catch (error) {
            showError(error.message);
            console.error('Error al registrar venta:', error);
        } finally {
            showLoading(false);
        }
    }

    function openNewSaleModal() {
        currentSaleItems = [];
        renderSaleItems();
        productSearch.value = '';
        searchResults.innerHTML = '';
        saleModal.style.display = 'block';
    }

    async function handleProductSearch(e) {
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/inventory?search=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al buscar productos');
            }

            const products = await response.json();
            renderSearchResults(products);
        } catch (error) {
            console.error('Error al buscar productos:', error);
            searchResults.innerHTML = `<div class="error">${error.message}</div>`;
        }
    }

    function renderSales(sales) {
        const tbody = salesTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (!sales || sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay ventas registradas</td></tr>';
            return;
        }

        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.id}</td>
                <td>${formatDate(sale.sale_date)}</td>
                <td>$${formatCurrency(sale.total)}</td>
                <td>${sale.seller}</td>
                <td><button class="view-details-btn" data-id="${sale.id}">Ver Detalles</button></td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => viewSaleDetails(btn.dataset.id));
        });
    }

    async function viewSaleDetails(id) {
        try {
            showLoading(true);
            const response = await fetch(`http://localhost:3000/api/sales/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al cargar detalles');
            }

            const sale = result.data;
            
            // Mostrar detalles en el modal
            document.getElementById('saleId').textContent = sale.id;
            document.getElementById('saleDate').textContent = formatDate(sale.sale_date);
            document.getElementById('saleTotalDetail').textContent = `$${formatCurrency(sale.total)}`;
            document.getElementById('saleSeller').textContent = sale.seller;
            
            const tbody = document.getElementById('saleDetailItems');
            tbody.innerHTML = '';
            
            sale.details.forEach(detail => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${detail.product_name}</td>
                    <td>${detail.quantity}</td>
                    <td>$${formatCurrency(detail.unit_price)}</td>
                    <td>$${formatCurrency(detail.subtotal)}</td>
                `;
                tbody.appendChild(row);
            });
            
            saleDetailModal.style.display = 'block';
        } catch (error) {
            showError(error.message);
            console.error('Error al cargar detalles:', error);
        } finally {
            showLoading(false);
        }
    }

    function renderSearchResults(products) {
        searchResults.innerHTML = '';

        if (!products || products.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No se encontraron productos</div>';
            return;
        }

        products.forEach(product => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <strong>${product.name}</strong> - ${product.category}
                <div>Precio: $${formatCurrency(product.price)} | Stock: ${product.stock}</div>
            `;
            
            item.addEventListener('click', () => {
                addProductToSale({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    stock: product.stock
                });
                productSearch.value = '';
                searchResults.innerHTML = '';
            });
            
            searchResults.appendChild(item);
        });
    }

    function addProductToSale(product) {
        const existingItem = currentSaleItems.find(item => item.id === product.id);
        const price = parseFloat(product.price) || 0;
        const stock = parseInt(product.stock) || 0;

        if (existingItem) {
            if (existingItem.quantity >= stock) {
                showError('No hay suficiente stock disponible');
                return;
            }
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.quantity * price;
        } else {
            if (stock < 1) {
                showError('No hay stock disponible');
                return;
            }
            currentSaleItems.push({
                id: product.id,
                name: product.name,
                price: price,
                quantity: 1,
                subtotal: price
            });
        }
        
        renderSaleItems();
    }

    function renderSaleItems() {
        const tbody = saleItemsTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (currentSaleItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay productos en la venta</td></tr>';
            saleTotal.textContent = '0.00';
            return;
        }

        currentSaleItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td><input type="number" min="1" value="${item.quantity}" data-index="${index}"></td>
                <td>$${formatCurrency(item.price)}</td>
                <td>$${formatCurrency(item.subtotal)}</td>
                <td><button class="delete-btn" data-index="${index}">Eliminar</button></td>
            `;
            tbody.appendChild(row);
        });

        // Actualizar total
        const total = currentSaleItems.reduce((sum, item) => sum + item.subtotal, 0);
        saleTotal.textContent = formatCurrency(total);

        // Eventos para inputs y botones
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = e.target.dataset.index;
                const newQuantity = parseInt(e.target.value) || 1;
                
                if (newQuantity < 1) {
                    e.target.value = currentSaleItems[index].quantity;
                    return;
                }
                
                currentSaleItems[index].quantity = newQuantity;
                currentSaleItems[index].subtotal = newQuantity * currentSaleItems[index].price;
                renderSaleItems();
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentSaleItems.splice(e.target.dataset.index, 1);
                renderSaleItems();
            });
        });
    }

    // Funciones auxiliares
    function formatCurrency(value) {
        return (parseFloat(value) || 0).toFixed(2);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
    }

    function showLoading(show) {
        const loader = document.getElementById('loadingOverlay') || createLoader();
        loader.style.display = show ? 'flex' : 'none';
    }

    function createLoader() {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        overlay.innerHTML = '<div class="spinner">Cargando...</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert error';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert success';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
});