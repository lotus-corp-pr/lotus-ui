// Lotus IPTV - Main Application Module

const App = {
    // State
    currentTab: 'channels',
    channels: [],
    categories: [],
    favorites: [],
    currentUser: null,
    currentFilter: 'all',

    // Initialize app
    init() {
        // Load saved data
        this.loadData();
        
        // Setup tabs
        this.setupTabs();
        
        // Setup search
        this.setupSearch();
        
        // Setup filters
        this.setupFilters();
        
        // Setup guide button
        this.setupGuide();
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
        const savedFavorites = localStorage.getItem('iptv_favorites');
        this.favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
        
        // Load channels from IPTVPlayer if available
        if (typeof IPTVPlayer !== 'undefined') {
            this.channels = IPTVPlayer.channels || [];
            this.categories = IPTVPlayer.categories || [];
        }
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
            case 'channels':
                this.renderChannels();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'favorites':
                this.renderFavorites();
                break;
            case 'search':
                // Clear search
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                const searchResults = document.getElementById('search-results');
                if (searchResults) searchResults.innerHTML = '';
                break;
            case 'settings':
                // Settings tab doesn't need content loading
                break;
        }
    },

    // Initialize content
    initContent() {
        if (typeof IPTVPlayer !== 'undefined') {
            this.channels = IPTVPlayer.channels || [];
            this.categories = IPTVPlayer.categories || [];
        }
        
        // Render initial content
        this.renderChannels();
        this.renderCategories();
        this.renderFavorites();
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
            this.showToast('Ingrese un término de búsqueda');
            return;
        }
        
        // Search in channels
        const results = this.searchChannels(query);
        
        // Display results
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            
            if (results.length > 0) {
                results.forEach(channel => {
                    const card = this.createChannelCard(channel);
                    resultsContainer.appendChild(card);
                });
            } else {
                resultsContainer.innerHTML = `<p class="no-results">No se encontraron resultados para "${query}".</p>`;
            }
        }
    },

    // Search channels
    searchChannels(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.channels.filter(channel => {
            return (
                channel.name.toLowerCase().includes(lowerQuery) ||
                channel.group.toLowerCase().includes(lowerQuery)
            );
        });
    },

    // Setup filters
    setupFilters() {
        const filterButtons = document.querySelectorAll('.btn-filter');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });
    },

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        const filterButtons = document.querySelectorAll('.btn-filter');
        filterButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-filter') === filter) {
                button.classList.add('active');
            }
        });
        
        // Re-render channels
        this.renderChannels();
    },

    // Setup guide
    setupGuide() {
        // This will be implemented when guide button is added
    },

    // Render channels
    renderChannels() {
        const container = document.getElementById('channels-grid');
        if (!container) return;

        container.innerHTML = '';
        
        // Filter channels
        let filteredChannels = this.channels;
        
        if (this.currentFilter !== 'all') {
            filteredChannels = this.channels.filter(channel => {
                return channel.group.toLowerCase() === this.currentFilter.toLowerCase();
            });
        }
        
        // Sort channels by number if available
        filteredChannels.sort((a, b) => (a.number || 0) - (b.number || 0));
        
        if (filteredChannels.length > 0) {
            filteredChannels.forEach(channel => {
                const card = this.createChannelCard(channel);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="no-results">No hay canales disponibles en esta categoría.</p>';
        }
    },

    // Render categories
    renderCategories() {
        const container = document.getElementById('category-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.categories.length > 0) {
            this.categories.forEach(category => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <h3>${category.name}</h3>
                    <p>${category.count} canales</p>
                `;
                
                item.addEventListener('click', () => {
                    // Switch to channels tab and filter
                    this.switchTab('channels');
                    this.setFilter(category.name.toLowerCase());
                });
                
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p class="no-results">No hay categorías disponibles.</p>';
        }
    },

    // Render favorites
    renderFavorites() {
        const container = document.getElementById('favorites-grid');
        if (!container) return;

        container.innerHTML = '';
        
        // Load favorites
        const savedFavorites = localStorage.getItem('iptv_favorites');
        this.favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
        
        if (this.favorites.length > 0) {
            this.favorites.forEach(channel => {
                const card = this.createChannelCard(channel);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="no-results">No tienes canales en favoritos. Agrega canales haciendo clic en el icono ⭐.</p>';
        }
    },

    // Create channel card
    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.setAttribute('data-id', channel.id);
        
        const isFavorite = this.favorites.some(f => f.id === channel.id);
        
        card.innerHTML = `
            <div class="channel-logo">
                <img src="${channel.logo}" alt="${channel.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/100x60/333333/FFFFFF?text=TV'">
            </div>
            <div class="channel-info">
                <h3>${channel.number ? channel.number + '. ' : ''}${channel.name}</h3>
                <p>${channel.group}</p>
            </div>
            <span class="favorite-icon ${isFavorite ? 'favorited' : ''}" data-id="${channel.id}" title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${isFavorite ? '⭐' : '☆'}</span>
        `;
        
        // Click to play
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-icon')) {
                this.toggleFavorite(channel.id);
            } else {
                if (typeof IPTVPlayer !== 'undefined') {
                    IPTVPlayer.play(channel);
                }
            }
        });
        
        // Favorite icon click
        const favIcon = card.querySelector('.favorite-icon');
        if (favIcon) {
            favIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(channel.id);
            });
        }
        
        return card;
    },

    // Toggle favorite
    toggleFavorite(channelId) {
        if (typeof IPTVPlayer !== 'undefined') {
            IPTVPlayer.toggleFavorite(channelId);
        }
    },

    // Show toast notification
    showToast(message) {
        if (typeof Auth !== 'undefined' && Auth.showToast) {
            Auth.showToast(message);
        } else {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = message;
                toast.classList.remove('hidden');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 3000);
            }
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
