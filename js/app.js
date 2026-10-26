// Xuper TV Web - Main Application Module

const App = {
    // State
    currentTab: 'home',
    content: [],
    categories: [],
    favorites: [],
    history: [],
    currentUser: null,

    // Initialize app
    init() {
        // Load saved data
        this.loadData();
        
        // Setup tabs
        this.setupTabs();
        
        // Setup search
        this.setupSearch();
        
        // Setup Google search integration
        this.setupGoogleSearch();
        
        // Initialize content
        this.initContent();
    },

    // Update user info
    updateUserInfo(user) {
        this.currentUser = user;
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            userInfoElement.textContent = user.displayName || user.username;
        }
    },

    // Load saved data
    loadData() {
        // Load favorites
        const savedFavorites = localStorage.getItem('xuper_tv_favorites');
        this.favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
        
        // Load history
        const savedHistory = localStorage.getItem('xuper_tv_history');
        this.history = savedHistory ? JSON.parse(savedHistory) : [];
    },

    // Save data
    saveData() {
        localStorage.setItem('xuper_tv_favorites', JSON.stringify(this.favorites));
        localStorage.setItem('xuper_tv_history', JSON.stringify(this.history));
    },

    // Setup tabs
    setupTabs() {
        const tabButtons = document.querySelectorAll('.btn-header[data-tab]');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    },

    // Switch tab
    switchTab(tab) {
        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(t => t.classList.remove('active'));
        
        // Show selected tab
        const selectedTab = document.getElementById(`tab-${tab}`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Update current tab
        this.currentTab = tab;
        
        // Update button states
        const tabButtons = document.querySelectorAll('.btn-header[data-tab]');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-tab') === tab) {
                button.classList.add('active');
            }
        });
        
        // Load content for tab
        this.loadTabContent(tab);
    },

    // Load content for tab
    loadTabContent(tab) {
        switch (tab) {
            case 'home':
                this.renderFeaturedContent();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'search':
                // Clear search
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                const searchResults = document.getElementById('search-results');
                if (searchResults) searchResults.innerHTML = '';
                break;
            case 'favorites':
                this.renderFavorites();
                break;
            case 'history':
                this.renderHistory();
                break;
        }
    },

    // Initialize content
    initContent() {
        // Generate sample content (in a real implementation, this would come from API)
        this.content = this.getSampleContent();
        this.categories = this.getSampleCategories();
        
        // Render initial content
        this.renderFeaturedContent();
        this.renderCategories();
    },

    // Get sample content (REPLACE WITH REAL API CALLS)
    getSampleContent() {
        return [
            {
                id: 1,
                title: 'El Rey León',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                poster: 'https://via.placeholder.com/300x450/8B4513/FFFFFF?text=El+Rey+León',
                category: 'Películas',
                subcategory: 'Infantil',
                duration: '2h 28m',
                rating: '★★★★★',
                year: '1994',
                description: 'Un joven león principe es desterrado de su reino y debe encontrar su camino de regreso.',
                tags: ['animación', 'disney', 'infantil', 'aventura']
            },
            {
                id: 2,
                title: 'Titanic',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                poster: 'https://via.placeholder.com/300x450/4682B4/FFFFFF?text=Titanic',
                category: 'Películas',
                subcategory: 'Drama',
                duration: '3h 14m',
                rating: '★★★★★',
                year: '1997',
                description: 'Una historia de amor épica a bordo del famoso transatlántico.',
                tags: ['drama', 'romance', 'histórico']
            },
            {
                id: 3,
                title: 'The Avengers',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                poster: 'https://via.placeholder.com/300x450/228B22/FFFFFF?text=Avengers',
                category: 'Películas',
                subcategory: 'Acción',
                duration: '2h 23m',
                rating: '★★★★☆',
                year: '2012',
                description: 'Los héroes más poderosos de la Tierra se unen para salvar el mundo.',
                tags: ['acción', 'superhéroes', 'marvel']
            },
            {
                id: 4,
                title: 'Stranger Things',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                poster: 'https://via.placeholder.com/300x450/483D8B/FFFFFF?text=Stranger+Things',
                category: 'Series',
                subcategory: 'Ciencia Ficción',
                duration: 'Temporada 1',
                rating: '★★★★★',
                year: '2016',
                description: 'Un grupo de niños descubre misterios sobrenaturales en su pequeño pueblo.',
                tags: ['ciencia ficción', 'misterio', 'netflix']
            },
            {
                id: 5,
                title: 'Breaking Bad',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                poster: 'https://via.placeholder.com/300x450/2F4F4F/FFFFFF?text=Breaking+Bad',
                category: 'Series',
                subcategory: 'Drama',
                duration: '5 Temporadas',
                rating: '★★★★★',
                year: '2008-2013',
                description: 'Un profesor de química se convierte en narcotraficante.',
                tags: ['drama', 'crimen', 'thriller']
            },
            {
                id: 6,
                title: 'Game of Thrones',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
                poster: 'https://via.placeholder.com/300x450/800080/FFFFFF?text=Game+of+Thrones',
                category: 'Series',
                subcategory: 'Fantasía',
                duration: '8 Temporadas',
                rating: '★★★★★',
                year: '2011-2019',
                description: 'Luchas por el poder en los Siete Reinos de Poniente.',
                tags: ['fantasía', 'épico', 'hbo']
            },
            {
                id: 7,
                title: 'BBC News',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                poster: 'https://via.placeholder.com/300x450/000080/FFFFFF?text=BBC+News',
                category: 'Canales',
                subcategory: 'Noticias',
                duration: '24/7',
                rating: '★★★★☆',
                year: 'Live',
                description: 'Noticias internacionales en vivo.',
                tags: ['noticias', 'bbc', 'internacional']
            },
            {
                id: 8,
                title: 'Discovery Channel',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                poster: 'https://via.placeholder.com/300x450/006400/FFFFFF?text=Discovery',
                category: 'Canales',
                subcategory: 'Documentales',
                duration: '24/7',
                rating: '★★★★☆',
                year: 'Live',
                description: 'Documentales y programas educativos.',
                tags: ['documentales', 'ciencia', 'naturaleza']
            },
            {
                id: 9,
                title: 'ESPN',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                poster: 'https://via.placeholder.com/300x450/800000/FFFFFF?text=ESPN',
                category: 'Canales',
                subcategory: 'Deportes',
                duration: '24/7',
                rating: '★★★★☆',
                year: 'Live',
                description: 'Transmisiones deportivas en vivo.',
                tags: ['deportes', 'fútbol', 'nba']
            },
            {
                id: 10,
                title: 'Cartoon Network',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                poster: 'https://via.placeholder.com/300x450/FFD700/000000?text=Cartoon+Network',
                category: 'Canales',
                subcategory: 'Infantil',
                duration: '24/7',
                rating: '★★★★☆',
                year: 'Live',
                description: 'Dibujos animados para niños.',
                tags: ['infantil', 'dibujos', 'animación']
            }
        ];
    },

    // Get sample categories
    getSampleCategories() {
        return [
            { id: 'movies', name: 'Películas', icon: '🎬', count: 100 },
            { id: 'series', name: 'Series', icon: '📺', count: 50 },
            { id: 'channels', name: 'Canales', icon: '📡', count: 20 },
            { id: 'documentaries', name: 'Documentales', icon: '📚', count: 30 },
            { id: 'sports', name: 'Deportes', icon: '⚽', count: 15 },
            { id: 'news', name: 'Noticias', icon: '📰', count: 10 },
            { id: 'kids', name: 'Infantil', icon: '👶', count: 25 },
            { id: 'music', name: 'Música', icon: '🎵', count: 12 }
        ];
    },

    // Render featured content
    renderFeaturedContent() {
        const container = document.getElementById('featured-content');
        if (!container) return;

        container.innerHTML = '';
        
        // Show featured items (first 6)
        const featured = this.content.slice(0, 6);
        
        featured.forEach(item => {
            const card = this.createContentCard(item);
            container.appendChild(card);
        });
    },

    // Render categories
    renderCategories() {
        const container = document.getElementById('category-list');
        if (!container) return;

        container.innerHTML = '';
        
        this.categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <h3>${category.icon} ${category.name}</h3>
                <p>${category.count} disponibles</p>
            `;
            
            item.addEventListener('click', () => {
                this.filterByCategory(category.id);
            });
            
            container.appendChild(item);
        });
    },

    // Filter by category
    filterByCategory(categoryId) {
        // Switch to home tab
        this.switchTab('home');
        
        // Filter content
        const filtered = this.content.filter(item => {
            return item.category.toLowerCase() === this.getCategoryName(categoryId);
        });
        
        // Render filtered content
        const container = document.getElementById('featured-content');
        if (container) {
            container.innerHTML = '';
            
            if (filtered.length > 0) {
                filtered.forEach(item => {
                    const card = this.createContentCard(item);
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p class="no-results">No se encontraron resultados en esta categoría.</p>';
            }
        }
    },

    // Get category name
    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    },

    // Create content card
    createContentCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.setAttribute('data-id', item.id);
        
        const isFavorite = this.favorites.some(f => f.id === item.id);
        
        card.innerHTML = `
            <img src="${item.poster}" alt="${item.title}" loading="lazy">
            <span class="favorite-icon ${isFavorite ? 'favorited' : ''}" data-id="${item.id}">${isFavorite ? '★' : '☆'}</span>
            <div class="content-card-info">
                <h3>${item.title}</h3>
                <p>${item.category} • ${item.subcategory}</p>
                <p class="rating">${item.rating} • ${item.duration}</p>
            </div>
        `;
        
        // Click to play
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-icon')) {
                this.toggleFavorite(item.id);
            } else {
                Player.play(item);
            }
        });
        
        // Favorite icon click
        const favIcon = card.querySelector('.favorite-icon');
        if (favIcon) {
            favIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(item.id);
            });
        }
        
        return card;
    },

    // Toggle favorite
    toggleFavorite(itemId) {
        const item = this.content.find(i => i.id === itemId);
        if (!item) return;
        
        const index = this.favorites.findIndex(f => f.id === itemId);
        
        if (index >= 0) {
            // Remove from favorites
            this.favorites.splice(index, 1);
        } else {
            // Add to favorites
            this.favorites.push(item);
        }
        
        // Save
        this.saveData();
        
        // Update UI
        this.renderFavorites();
        this.renderFeaturedContent();
        
        // Show message
        const action = index >= 0 ? 'eliminado de' : 'agregado a';
        if (typeof Auth !== 'undefined' && Auth.showToast) {
            Auth.showToast(`Contenido ${action} favoritos`);
        }
    },

    // Add to history
    addToHistory(item) {
        // Remove if already exists
        this.history = this.history.filter(h => h.id !== item.id);
        
        // Add to beginning
        this.history.unshift(item);
        
        // Keep only last 20
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        // Save
        this.saveData();
        
        // Update UI if on history tab
        if (this.currentTab === 'history') {
            this.renderHistory();
        }
    },

    // Render favorites
    renderFavorites() {
        const container = document.getElementById('favorites-content');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.favorites.length > 0) {
            this.favorites.forEach(item => {
                const card = this.createContentCard(item);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="no-results">No tienes contenido en favoritos. Agrega contenido haciendo clic en el icono ★.</p>';
        }
    },

    // Render history
    renderHistory() {
        const container = document.getElementById('history-content');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.history.length > 0) {
            this.history.forEach(item => {
                const card = this.createContentCard(item);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="no-results">No hay historial de reproducción.</p>';
        }
    },

    // Setup search
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('btn-search');
        
        if (searchInput) {
            // Search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
    },

    // Perform search
    performSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        
        if (!query) {
            if (typeof Auth !== 'undefined' && Auth.showToast) {
                Auth.showToast('Ingrese un término de búsqueda');
            }
            return;
        }
        
        // Search in our content
        const results = this.searchContent(query);
        
        // Display results
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            
            if (results.length > 0) {
                results.forEach(item => {
                    const card = this.createContentCard(item);
                    resultsContainer.appendChild(card);
                });
            } else {
                resultsContainer.innerHTML = `<p class="no-results">No se encontraron resultados para "${query}".</p>`;
                
                // Option to search on Google
                const googleOption = document.createElement('button');
                googleOption.className = 'btn-google-search';
                googleOption.textContent = 'Buscar en Google';
                googleOption.addEventListener('click', () => {
                    this.openGoogleSearch(query);
                });
                resultsContainer.appendChild(googleOption);
            }
        }
    },

    // Search content
    searchContent(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.content.filter(item => {
            return (
                item.title.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery) ||
                item.category.toLowerCase().includes(lowerQuery) ||
                item.subcategory.toLowerCase().includes(lowerQuery) ||
                item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        });
    },

    // Setup Google search integration
    setupGoogleSearch() {
        const googleBtn = document.getElementById('btn-close-google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.closeGoogleSearch();
            });
        }
    },

    // Open Google search
    openGoogleSearch(query) {
        const container = document.getElementById('google-search-container');
        const iframe = document.getElementById('google-iframe');
        
        if (container && iframe) {
            // Encode query for Google
            const encodedQuery = encodeURIComponent(query);
            const googleUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=vid`;
            
            iframe.src = googleUrl;
            container.classList.remove('hidden');
        }
    },

    // Close Google search
    closeGoogleSearch() {
        const container = document.getElementById('google-search-container');
        const iframe = document.getElementById('google-iframe');
        
        if (container) {
            container.classList.add('hidden');
        }
        
        if (iframe) {
            iframe.src = 'about:blank';
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
