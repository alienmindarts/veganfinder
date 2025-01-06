// Product Comparison Website - Main Script

// DOM Elements
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const clearSearch = document.getElementById('clear-search');
const resultsCount = document.getElementById('results-count');

// Store all products in memory
let allProducts = [];

// Product Card Template
// Clean price strings by removing all non-numeric characters except decimal points
function cleanPrice(price) {
    // Remove all non-numeric characters except decimal points
    let cleaned = price.replace(/[^0-9.,]/g, '');
    // Convert comma decimal separator to period
    cleaned = cleaned.replace(',', '.');
    // Remove any remaining non-numeric characters
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    // Ensure we have at least one digit
    if (!/\d/.test(cleaned)) {
        return '0';
    }
    return cleaned;
}

function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.produto}" class="product-image">
            <h3 class="product-name">${product.produto}</h3>
            <p class="product-price">Price: ${cleanPrice(product.preço)}</p>
            <p class="price-per-kg">Price per kg: ${product.preçokg}</p>
            <a href="${product.link}" target="_blank" class="store-link">View on ${product.store}</a>
        </div>
    `;
}

// Fetch and Display Products
async function loadProducts() {
    try {
        // Array of JSON files to load
        const stores = ['auchan', 'continente', 'Pingo Doce'];
        
        // Clear existing products and allProducts array
        productGrid.innerHTML = '';
        allProducts = [];
        
        // Load all products first
        for (const store of stores) {
            console.log(`Attempting to fetch data from Scraped/${store}.json`);
            const response = await fetch(`Scraped/${store}.json`);
            if (!response.ok) {
                console.error(`Failed to load ${store} products`, response);
                throw new Error(`Failed to load ${store} products`);
            }

            const products = await response.json();
            console.log(`Loaded ${products.length} products from ${store}`);
            products.forEach(product => {
                // Ensure consistent store name assignment
                const storeName = store === 'Pingo Doce' ? 'Pingo Doce' : store;
                product.store = storeName;
                console.log(`Assigned store: ${storeName} to product: ${product.produto}`);
                allProducts.push(product);
            });
        }
        
        // Display all products after loading
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        productGrid.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
    }
}

// Sort products based on selected criteria
function sortProducts(products, sortBy) {
    // Create a copy of the array to avoid mutating the original
    const sortedProducts = products.slice();
    
    switch(sortBy) {
        case 'price-low-high':
            return sortedProducts.sort((a, b) => {
                const priceA = parseFloat(cleanPrice(a.preço)) || 0;
                const priceB = parseFloat(cleanPrice(b.preço)) || 0;
                if (isNaN(priceA) || isNaN(priceB)) return 0;
                return priceA - priceB;
            });
        case 'price-high-low':
            return sortedProducts.sort((a, b) => {
                const priceA = parseFloat(cleanPrice(a.preço)) || 0;
                const priceB = parseFloat(cleanPrice(b.preço)) || 0;
                if (isNaN(priceA) || isNaN(priceB)) return 0;
                return priceB - priceA;
            });
        case 'price-per-kg-low-high':
            return sortedProducts.sort((a, b) => {
                const priceA = parseFloat(cleanPrice(a.preçokg)) || 0;
                const priceB = parseFloat(cleanPrice(b.preçokg)) || 0;
                if (isNaN(priceA) || isNaN(priceB)) return 0;
                return priceA - priceB;
            });
        case 'price-per-kg-high-low':
            return sortedProducts.sort((a, b) => {
                const priceA = parseFloat(cleanPrice(a.preçokg)) || 0;
                const priceB = parseFloat(cleanPrice(b.preçokg)) || 0;
                if (isNaN(priceA) || isNaN(priceB)) return 0;
                return priceB - priceA;
            });
        default:
            return sortedProducts;
    }
}

// Display products from array
function displayProducts(products) {
    const sortBy = document.getElementById('sort-by').value;
    
    // Create a single array of all filtered products
    const allFilteredProducts = products.slice();
    
    // Sort all products together
    const sortedProducts = sortProducts(allFilteredProducts, sortBy);
    
    // Clear existing products
    productGrid.innerHTML = '';
    
    // Create a document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    // Display products in the sorted order
    sortedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.innerHTML = createProductCard(product);
        fragment.appendChild(productCard);
    });
    
    // Append all products at once
    productGrid.appendChild(fragment);
    
    resultsCount.textContent = `Showing ${sortedProducts.length} of ${allProducts.length} products`;
}

// Get selected stores from checkboxes
function getSelectedStores() {
    const storeCheckboxes = document.querySelectorAll('.store-filter input[name="store"]:checked');
    const selectedStores = Array.from(storeCheckboxes).map(checkbox => checkbox.value);
    
    // If "All Stores" is selected or no stores are selected, return all stores
    if (selectedStores.includes('all') || selectedStores.length === 0) {
        return ['auchan', 'continente', 'Pingo Doce'];
    }
    return selectedStores.map(store => {
        if (store === 'pingo-doce' || store === 'Pingo Doce') {
            return 'Pingo Doce';
        }
        return store;
    });
}

// Search products by name and store
function searchProducts(query) {
    const searchTerm = query.toLowerCase().trim();
    const selectedStores = getSelectedStores();

    // First filter by search term across all products
    let filteredProducts = allProducts.filter(product => 
        product.produto.toLowerCase().includes(searchTerm)
    );
    
    // Then filter by selected stores
    filteredProducts = filteredProducts.filter(product =>
        selectedStores.includes(product.store)
    );
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p class="no-results">No products found matching your search.</p>';
        resultsCount.textContent = 'No results found';
    } else {
        displayProducts(filteredProducts);
    }
}

// Event listeners for store checkboxes
function setupStoreFilters() {
    const storeCheckboxes = document.querySelectorAll('.store-filter input[name="store"]');
    
    storeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Uncheck "All Stores" when individual stores are selected
            if (checkbox.value !== 'all' && checkbox.checked) {
                document.querySelector('.store-filter input[value="all"]').checked = false;
            }
            
            // Update products based on current selection
            searchProducts(searchInput.value);
        });
    });
}

// Event listeners
searchInput.addEventListener('input', (e) => {
    searchProducts(e.target.value);
});

clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchProducts('');
});

// Sort event listener
document.getElementById('sort-by').addEventListener('change', () => {
    searchProducts(searchInput.value);
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupStoreFilters();
});
