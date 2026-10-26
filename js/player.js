// Xuper TV Web - Video Player Module

const Player = {
    // Player state
    currentVideo: null,
    currentSource: null,
    isFullscreen: false,

    // Initialize player
    init() {
        // Setup player controls
        this.setupPlayer();
        this.setupControls();
        this.setupFullscreen();
    },

    // Setup player element
    setupPlayer() {
        this.videoElement = document.getElementById('video-player');
        if (!this.videoElement) return;

        // Event listeners
        this.videoElement.addEventListener('play', () => this.handlePlay());
        this.videoElement.addEventListener('pause', () => this.handlePause());
        this.videoElement.addEventListener('ended', () => this.handleEnded());
        this.videoElement.addEventListener('error', () => this.handleError());
        this.videoElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
    },

    // Setup control buttons
    setupControls() {
        // Close button
        const closeBtn = document.getElementById('btn-close-player');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePlayer());
        }
    },

    // Setup fullscreen
    setupFullscreen() {
        // Fullscreen button (if we add one later)
        // For now, we'll handle double-click on video
        if (this.videoElement) {
            this.videoElement.addEventListener('dblclick', () => this.toggleFullscreen());
        }

        // Keyboard controls
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
                this.seek(5);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                this.seek(-5);
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
        }
    },

    // Check if player is visible
    isVisible() {
        const modal = document.getElementById('player-modal');
        return modal && !modal.classList.contains('hidden');
    },

    // Play video
    play(video) {
        this.currentVideo = video;
        this.currentSource = video.src;

        // Update player UI
        this.updatePlayerUI(video);

        // Show player
        this.showPlayer();

        // Load and play video
        if (this.videoElement) {
            this.videoElement.src = video.src;
            this.videoElement.load();
            this.videoElement.play().catch(error => {
                console.error('Error playing video:', error);
                this.showError('No se pudo reproducir el video');
            });
        }

        // Save to history
        App.addToHistory(video);
    },

    // Update player UI
    updatePlayerUI(video) {
        const titleElement = document.getElementById('player-title');
        const infoElement = document.getElementById('player-info');

        if (titleElement) {
            titleElement.textContent = video.title || 'Título desconocido';
        }

        if (infoElement) {
            const info = [];
            if (video.category) info.push(`Categoría: ${video.category}`);
            if (video.duration) info.push(`Duración: ${video.duration}`);
            if (video.rating) info.push(`Calificación: ${video.rating}`);
            infoElement.textContent = info.join(' | ');
        }
    },

    // Show player modal
    showPlayer() {
        const modal = document.getElementById('player-modal');
        if (modal) {
            modal.classList.remove('hidden');
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

        this.currentVideo = null;
        this.currentSource = null;
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

    // Seek video
    seek(seconds) {
        if (this.videoElement) {
            this.videoElement.currentTime += seconds;
        }
    },

    // Adjust volume
    adjustVolume(change) {
        if (this.videoElement) {
            const newVolume = Math.min(1, Math.max(0, this.videoElement.volume + change));
            this.videoElement.volume = newVolume;
        }
    },

    // Toggle fullscreen
    toggleFullscreen() {
        if (!this.videoElement) return;

        if (!this.isFullscreen) {
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
        this.isFullscreen = true;
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
        this.isFullscreen = false;
    },

    // Event handlers
    handlePlay() {
        console.log('Video playing');
    },

    handlePause() {
        console.log('Video paused');
    },

    handleEnded() {
        console.log('Video ended');
        // Show next video or close player
        setTimeout(() => {
            this.closePlayer();
        }, 2000);
    },

    handleError() {
        console.error('Video error');
        this.showError('Error al reproducir el video');
    },

    handleTimeUpdate() {
        // Can be used for progress tracking
        // console.log('Time update:', this.videoElement.currentTime);
    },

    // Show error
    showError(message) {
        // Use auth's showToast or create our own
        if (typeof Auth !== 'undefined' && Auth.showToast) {
            Auth.showToast(message);
        } else {
            alert(message);
        }
    }
};

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Player.init();
});
