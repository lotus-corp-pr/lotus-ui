// Lotus IPTV - Video Player Module
// Soporte para HLS, M3U8, MP4 y streaming en vivo

const IPTVPlayer = {
    // Player state
    currentChannel: null,
    currentIndex: -1,
    channels: [],
    categories: [],
    favorites: [],
    hls: null,
    videoElement: null,
    autoplayNext: true,
    showEPG: true,
    
    // Default M3U list (lala.tv compatible)
    defaultM3U: `EXTM3U
EXTINF:-1 tvg-id="" tvg-name="BBC World News" tvg-logo="https://via.placeholder.com/100x60/000000/FFFFFF?text=BBC" group-title="Noticias",BBC World News
http://example.com/stream/bbc.m3u8

EXTINF:-1 tvg-id="" tvg-name="CNN International" tvg-logo="https://via.placeholder.com/100x60/CC0000/FFFFFF?text=CNN" group-title="Noticias",CNN International
http://example.com/stream/cnn.m3u8

EXTINF:-1 tvg-id="" tvg-name="ESPN" tvg-logo="https://via.placeholder.com/100x60/FF0000/FFFFFF?text=ESPN" group-title="Deportes",ESPN
http://example.com/stream/espn.m3u8

EXTINF:-1 tvg-id="" tvg-name="ESPN 2" tvg-logo="https://via.placeholder.com/100x60/FF0000/FFFFFF?text=ESPN2" group-title="Deportes",ESPN 2
http://example.com/stream/espn2.m3u8

EXTINF:-1 tvg-id="" tvg-name="Fox Sports" tvg-logo="https://via.placeholder.com/100x60/0066CC/FFFFFF?text=FOX" group-title="Deportes",Fox Sports
http://example.com/stream/foxsports.m3u8

EXTINF:-1 tvg-id="" tvg-name="Discovery Channel" tvg-logo="https://via.placeholder.com/100x60/006400/FFFFFF?text=DISC" group-title="Documentales",Discovery Channel
http://example.com/stream/discovery.m3u8

EXTINF:-1 tvg-id="" tvg-name="National Geographic" tvg-logo="https://via.placeholder.com/100x60/FFD700/000000?text=NATGEO" group-title="Documentales",National Geographic
http://example.com/stream/natgeo.m3u8

EXTINF:-1 tvg-id="" tvg-name="HBO" tvg-logo="https://via.placeholder.com/100x60/8B4513/FFFFFF?text=HBO" group-title="Películas",HBO
http://example.com/stream/hbo.m3u8

EXTINF:-1 tvg-id="" tvg-name="Cinemax" tvg-logo="https://via.placeholder.com/100x60/000080/FFFFFF?text=CINEMAX" group-title="Películas",Cinemax
http://example.com/stream/cinemax.m3u8

EXTINF:-1 tvg-id="" tvg-name="Cartoon Network" tvg-logo="https://via.placeholder.com/100x60/FFD700/000000?text=CN" group-title="Infantil",Cartoon Network
http://example.com/stream/cartoon.m3u8

EXTINF:-1 tvg-id="" tvg-name="Nickelodeon" tvg-logo="https://via.placeholder.com/100x60/008000/FFFFFF?text=NICK" group-title="Infantil",Nickelodeon
http://example.com/stream/nick.m3u8

EXTINF:-1 tvg-id="" tvg-name="Disney Channel" tvg-logo="https://via.placeholder.com/100x60/000000/FFFFFF?text=DISNEY" group-title="Infantil",Disney Channel
http://example.com/stream/disney.m3u8`,

    // Sample EPG data
    sampleEPG: {
        "BBC World News": [
            { start: "00:00", end: "01:00", title: "Noticias Internacionales" },
            { start: "01:00", end: "02:00", title: "Análisis Político" },
            { start: "02:00", end: "03:00", title: "Economía Global" }
        ],
        "CNN International": [
            { start: "00:00", end: "00:30", title: "CNN Newsroom" },
            { start: "00:30", end: "01:00", title: "World Business Today" }
        ],
        "ESPN": [
            { start: "00:00", end: "02:00", title: "Fútbol: Liga MX" },
            { start: "02:00", end: "04:00", title: "NBA: Lakers vs Warriors" }
        ],
        "Discovery Channel": [
            { start: "00:00", end: "01:00", title: "Shark Week" },
            { start: "01:00", end: "02:00", title: "How It's Made" }
        ]
    },

    // Initialize player
    init() {
        this.videoElement = document.getElementById('video-player');
        
        if (!this.videoElement) {
            console.error('Video element not found');
            return;
        }

        // Load settings
        this.loadSettings();
        
        // Setup player controls
        this.setupPlayer();
        this.setupControls();
        this.setupKeyboard();
        
        // Load default channels
        this.loadDefaultChannels();
    },

    // Load settings
    loadSettings() {
        const savedAutoplay = localStorage.getItem('iptv_autoplay_next');
        const savedEPG = localStorage.getItem('iptv_show_epg');
        const savedM3U = localStorage.getItem('iptv_m3u_url');
        
        this.autoplayNext = savedAutoplay !== 'false';
        this.showEPG = savedEPG !== 'false';
        
        // Update UI
        if (document.getElementById('autoplay-next')) {
            document.getElementById('autoplay-next').checked = this.autoplayNext;
        }
        if (document.getElementById('show-epg')) {
            document.getElementById('show-epg').checked = this.showEPG;
        }
        if (document.getElementById('current-m3u-url')) {
            document.getElementById('current-m3u-url').textContent = savedM3U || 'No configurado';
        }
    },

    // Save settings
    saveSettings() {
        localStorage.setItem('iptv_autoplay_next', this.autoplayNext);
        localStorage.setItem('iptv_show_epg', this.showEPG);
    },

    // Setup player element
    setupPlayer() {
        if (!this.videoElement) return;

        // Event listeners
        this.videoElement.addEventListener('play', () => this.handlePlay());
        this.videoElement.addEventListener('pause', () => this.handlePause());
        this.videoElement.addEventListener('ended', () => this.handleEnded());
        this.videoElement.addEventListener('error', () => this.handleError());
        this.videoElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.videoElement.addEventListener('loadedmetadata', () => this.handleLoadedMetadata());
    },

    // Setup control buttons
    setupControls() {
        // Close button
        const closeBtn = document.getElementById('btn-close-player');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePlayer());
        }

        // Play/Pause button
        const playPauseBtn = document.getElementById('btn-play-pause');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlay());
        }

        // Previous channel
        const prevBtn = document.getElementById('btn-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.playPreviousChannel());
        }

        // Next channel
        const nextBtn = document.getElementById('btn-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.playNextChannel());
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('btn-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Volume slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                if (this.videoElement) {
                    this.videoElement.volume = parseFloat(e.target.value);
                }
            });
        }

        // Volume button
        const volumeBtn = document.getElementById('btn-volume');
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                if (this.videoElement) {
                    this.videoElement.muted = !this.videoElement.muted;
                    volumeBtn.textContent = this.videoElement.muted ? '🔇' : '🔊';
                }
            });
        }

        // Progress bar
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                if (this.videoElement && this.videoElement.duration > 0) {
                    const percent = e.offsetX / progressBar.offsetWidth;
                    this.videoElement.currentTime = percent * this.videoElement.duration;
                }
            });
        }
    },

    // Setup keyboard controls
    setupKeyboard() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    // Handle keyboard controls
    handleKeyDown(e) {
        if (!this.videoElement || !this.isVisible()) return;

        switch (e.code) {
            case 'Space':
                this.togglePlay();
                e.preventDefault();
                break;
            case 'ArrowRight':
                this.playNextChannel();
                e.preventDefault();
                break;
            case 'ArrowLeft':
                this.playPreviousChannel();
                e.preventDefault();
                break;
            case 'ArrowUp':
                this.adjustVolume(0.1);
                e.preventDefault();
                break;
            case 'ArrowDown':
                this.adjustVolume(-0.1);
                e.preventDefault();
                break;
            case 'Escape':
                this.closePlayer();
                e.preventDefault();
                break;
            case 'KeyF':
                this.toggleFullscreen();
                e.preventDefault();
                break;
            case 'KeyM':
                this.toggleMute();
                e.preventDefault();
                break;
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
            case 'Digit0':
                const num = parseInt(e.key);
                this.playChannelByNumber(num);
                e.preventDefault();
                break;
        }
    },

    // Check if player is visible
    isVisible() {
        const modal = document.getElementById('player-modal');
        return modal && !modal.classList.contains('hidden');
    },

    // Load default channels
    loadDefaultChannels() {
        this.channels = this.parseM3U(this.defaultM3U);
        this.extractCategories();
        this.saveChannels();
    },

    // Load M3U from URL
    async loadM3UFromURL(url) {
        if (!url) return false;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch M3U');
            }
            const m3uContent = await response.text();
            this.channels = this.parseM3U(m3uContent);
            this.extractCategories();
            this.saveChannels();
            this.saveM3UUrl(url);
            return true;
        } catch (error) {
            console.error('Error loading M3U:', error);
            return false;
        }
    },

    // Save M3U URL
    saveM3UUrl(url) {
        localStorage.setItem('iptv_m3u_url', url);
        if (document.getElementById('current-m3u-url')) {
            document.getElementById('current-m3u-url').textContent = url;
        }
    },

    // Parse M3U content
    parseM3U(m3uContent) {
        const lines = m3uContent.split('\n');
        const channels = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                const nextLine = lines[i + 1]?.trim();
                if (nextLine && !nextLine.startsWith('#')) {
                    const channel = this.parseEXTINF(line, nextLine);
                    if (channel) {
                        channels.push(channel);
                    }
                    i++; // Skip the URL line
                }
            }
        }
        
        return channels;
    },

    // Parse EXTINF line
    parseEXTINF(extinfLine, url) {
        // Remove #EXTINF: prefix
        const info = extinfLine.replace('#EXTINF:', '').trim();
        
        // Extract duration and info
        const parts = info.split(',', 2);
        const duration = parts[0] || '-1';
        const title = parts[1] || 'Unknown';
        
        // Extract TVG attributes
        const tvgMatch = extinfLine.match(/tvg-id="([^"]*)"/);
        const tvgNameMatch = extinfLine.match(/tvg-name="([^"]*)"/);
        const tvgLogoMatch = extinfLine.match(/tvg-logo="([^"]*)"/);
        const groupMatch = extinfLine.match(/group-title="([^"]*)"/);
        
        return {
            id: this.channels.length + 1,
            name: tvgNameMatch ? tvgNameMatch[1] : title,
            url: url,
            logo: tvgLogoMatch ? tvgLogoMatch[1] : 'https://via.placeholder.com/100x60/333333/FFFFFF?text=TV',
            group: groupMatch ? groupMatch[1] : 'Varios',
            duration: duration,
            epg: tvgMatch ? tvgMatch[1] : '',
            number: this.channels.length + 1
        };
    },

    // Extract categories from channels
    extractCategories() {
        const categoryMap = new Map();
        
        this.channels.forEach(channel => {
            if (!categoryMap.has(channel.group)) {
                categoryMap.set(channel.group, {
                    name: channel.group,
                    count: 0,
                    channels: []
                });
            }
            categoryMap.get(channel.group).count++;
            categoryMap.get(channel.group).channels.push(channel);
        });
        
        this.categories = Array.from(categoryMap.values());
    },

    // Save channels to localStorage
    saveChannels() {
        localStorage.setItem('iptv_channels', JSON.stringify(this.channels));
        localStorage.setItem('iptv_categories', JSON.stringify(this.categories));
    },

    // Load channels from localStorage
    loadChannels() {
        const savedChannels = localStorage.getItem('iptv_channels');
        const savedCategories = localStorage.getItem('iptv_categories');
        
        if (savedChannels) {
            this.channels = JSON.parse(savedChannels);
        }
        if (savedCategories) {
            this.categories = JSON.parse(savedCategories);
        }
    },

    // Play channel
    play(channel) {
        this.currentChannel = channel;
        this.currentIndex = this.channels.findIndex(c => c.id === channel.id);
        
        // Update player UI
        this.updatePlayerUI(channel);
        
        // Show player
        this.showPlayer();
        
        // Load and play video
        if (this.videoElement) {
            // Destroy previous HLS instance
            if (this.hls) {
                this.hls.destroy();
                this.hls = null;
            }
            
            // Check if it's HLS stream
            if (channel.url.endsWith('.m3u8') || channel.url.includes('m3u8')) {
                this.playHLS(channel.url);
            } else {
                // Direct play
                this.videoElement.src = channel.url;
                this.videoElement.load();
                this.videoElement.play().catch(error => {
                    console.error('Error playing video:', error);
                    this.showError('No se pudo reproducir el canal');
                });
            }
        }
        
        // Save to history
        this.addToHistory(channel);
        
        // Update EPG
        this.updateEPG(channel);
    },

    // Play HLS stream
    playHLS(url) {
        if (!this.videoElement) return;
        
        if (Hls.isSupported()) {
            this.hls = new Hls({
                maxBufferLength: 15,
                maxBufferSize: 10 * 1000 * 1000,
                maxBufferHole: 0.5
            });
            
            this.hls.loadSource(url);
            this.hls.attachMedia(this.videoElement);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.videoElement.play().catch(error => {
                    console.error('Error playing HLS:', error);
                    this.showError('No se pudo reproducir el canal HLS');
                });
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            this.showError('Error de red al cargar el canal');
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            this.showError('Error de reproducción');
                            break;
                        default:
                            this.showError('Error al reproducir el canal');
                            break;
                    }
                }
            });
        } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            this.videoElement.src = url;
            this.videoElement.load();
            this.videoElement.play().catch(error => {
                console.error('Error playing HLS (native):', error);
                this.showError('No se pudo reproducir el canal HLS');
            });
        } else {
            this.showError('Tu navegador no soporta HLS');
        }
    },

    // Update player UI
    updatePlayerUI(channel) {
        const titleElement = document.getElementById('player-title');
        const infoElement = document.getElementById('player-channel-info');
        
        if (titleElement) {
            titleElement.textContent = channel.name || 'Canal';
        }
        
        if (infoElement) {
            infoElement.textContent = `${channel.group} | Canal ${channel.number || ''}`;
        }
        
        // Update play/pause button
        const playPauseBtn = document.getElementById('btn-play-pause');
        if (playPauseBtn) {
            playPauseBtn.textContent = '⏸';
        }
    },

    // Show player modal
    showPlayer() {
        const modal = document.getElementById('player-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        // Show EPG if enabled
        const epgInfo = document.getElementById('epg-info');
        if (epgInfo) {
            epgInfo.style.display = this.showEPG ? 'block' : 'none';
        }
    },

    // Close player
    closePlayer() {
        const modal = document.getElementById('player-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
        }

        // Destroy HLS
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        this.currentChannel = null;
        this.currentIndex = -1;
    },

    // Toggle play/pause
    togglePlay() {
        if (this.videoElement) {
            if (this.videoElement.paused) {
                this.videoElement.play();
            } else {
                this.videoElement.pause();
            }
        }
    },

    // Play next channel
    playNextChannel() {
        if (this.currentIndex >= 0 && this.currentIndex < this.channels.length - 1) {
            this.play(this.channels[this.currentIndex + 1]);
        } else if (this.channels.length > 0) {
            this.play(this.channels[0]);
        }
    },

    // Play previous channel
    playPreviousChannel() {
        if (this.currentIndex > 0) {
            this.play(this.channels[this.currentIndex - 1]);
        } else if (this.channels.length > 0) {
            this.play(this.channels[this.channels.length - 1]);
        }
    },

    // Play channel by number
    playChannelByNumber(num) {
        // Channel numbers start from 1
        if (num >= 1 && num <= this.channels.length) {
            this.play(this.channels[num - 1]);
        }
    },

    // Toggle mute
    toggleMute() {
        if (this.videoElement) {
            this.videoElement.muted = !this.videoElement.muted;
            const volumeBtn = document.getElementById('btn-volume');
            if (volumeBtn) {
                volumeBtn.textContent = this.videoElement.muted ? '🔇' : '🔊';
            }
        }
    },

    // Adjust volume
    adjustVolume(change) {
        if (this.videoElement) {
            const newVolume = Math.min(1, Math.max(0, this.videoElement.volume + change));
            this.videoElement.volume = newVolume;
            const volumeSlider = document.getElementById('volume-slider');
            if (volumeSlider) {
                volumeSlider.value = newVolume;
            }
        }
    },

    // Toggle fullscreen
    toggleFullscreen() {
        if (!this.videoElement) return;

        if (!document.fullscreenElement) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    },

    // Enter fullscreen
    enterFullscreen() {
        if (this.videoElement.requestFullscreen) {
            this.videoElement.requestFullscreen();
        } else if (this.videoElement.webkitRequestFullscreen) {
            this.videoElement.webkitRequestFullscreen();
        } else if (this.videoElement.msRequestFullscreen) {
            this.videoElement.msRequestFullscreen();
        }
    },

    // Exit fullscreen
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    },

    // Add to history
    addToHistory(channel) {
        let history = JSON.parse(localStorage.getItem('iptv_history') || '[]');
        
        // Remove if already exists
        history = history.filter(h => h.id !== channel.id);
        
        // Add to beginning
        history.unshift(channel);
        
        // Keep only last 50
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('iptv_history', JSON.stringify(history));
    },

    // Toggle favorite
    toggleFavorite(channelId) {
        let favorites = JSON.parse(localStorage.getItem('iptv_favorites') || '[]');
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;
        
        const index = favorites.findIndex(f => f.id === channelId);
        
        if (index >= 0) {
            // Remove from favorites
            favorites.splice(index, 1);
        } else {
            // Add to favorites
            favorites.push(channel);
        }
        
        localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
        this.favorites = favorites;
        
        // Update UI
        if (typeof App !== 'undefined' && App.renderFavorites) {
            App.renderFavorites();
        }
        
        // Show message
        const action = index >= 0 ? 'eliminado de' : 'agregado a';
        if (typeof Auth !== 'undefined' && Auth.showToast) {
            Auth.showToast(`Canal ${action} favoritos`);
        }
    },

    // Update EPG
    updateEPG(channel) {
        const epgContent = document.getElementById('epg-content');
        if (!epgContent || !this.showEPG) return;
        
        // Get EPG for current channel
        const programs = this.sampleEPG[channel.name] || [];
        
        if (programs.length > 0) {
            let html = '<div class="epg-programs">';
            programs.forEach(program => {
                html += `
                    <div class="epg-program">
                        <span class="epg-time">${program.start} - ${program.end}</span>
                        <span class="epg-title">${program.title}</span>
                    </div>
                `;
            });
            html += '</div>';
            epgContent.innerHTML = html;
        } else {
            epgContent.innerHTML = '<p>No hay información de programación disponible</p>';
        }
    },

    // Event handlers
    handlePlay() {
        const playPauseBtn = document.getElementById('btn-play-pause');
        if (playPauseBtn) {
            playPauseBtn.textContent = '⏸';
        }
    },

    handlePause() {
        const playPauseBtn = document.getElementById('btn-play-pause');
        if (playPauseBtn) {
            playPauseBtn.textContent = '▶';
        }
    },

    handleEnded() {
        if (this.autoplayNext) {
            this.playNextChannel();
        }
    },

    handleError() {
        console.error('Video error');
        this.showError('Error al reproducir el canal');
    },

    handleTimeUpdate() {
        if (!this.videoElement) return;
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const currentTimeElement = document.getElementById('current-time');
        const durationElement = document.getElementById('duration');
        
        if (progressBar && this.videoElement.duration > 0) {
            const percent = (this.videoElement.currentTime / this.videoElement.duration) * 100;
            progressBar.style.width = `${percent}%`;
        }
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(this.videoElement.currentTime);
        }
        
        if (durationElement) {
            durationElement.textContent = this.formatTime(this.videoElement.duration);
        }
    },

    handleLoadedMetadata() {
        if (durationElement) {
            durationElement.textContent = this.formatTime(this.videoElement.duration);
        }
    },

    // Format time (seconds to HH:MM:SS)
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Show error
    showError(message) {
        if (typeof Auth !== 'undefined' && Auth.showToast) {
            Auth.showToast(message);
        } else {
            alert(message);
        }
    }
};

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    IPTVPlayer.init();
});
