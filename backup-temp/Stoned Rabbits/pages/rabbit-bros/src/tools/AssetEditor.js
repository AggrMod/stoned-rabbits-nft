class AssetEditor {
    constructor() {
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.previewCanvas = document.getElementById('preview-box');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.previewCtx.imageSmoothingEnabled = false;

        // Asset Management
        this.assets = [];
        this.currentAssetIndex = 0;
        this.loadAssetList();

        // Editor State
        this.img = new Image();
        this.sprites = [];
        this.selectedSprite = null;

        // Viewport
        this.scale = 0.5;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Default Box Size
        this.boxWidth = 256;
        this.boxHeight = 256;

        this.bindEvents();

        // Initial Load
        this.switchAsset(0);

        // Start Loop
        requestAnimationFrame(() => this.loop());
    }

    loadAssetList() {
        const stored = localStorage.getItem('srb_asset_list');
        if (stored) {
            this.assets = JSON.parse(stored);
        } else {
            // Defaults
            this.assets = [
                { name: 'Player Run', image: 'assets/player_run.png', key: 'srb_sprites_run_v1' },
                { name: 'Player Idle', image: 'assets/player_idle.png', key: 'srb_sprites_idle_v1' },
                { name: 'Player Jump', image: 'assets/player_jump.png', key: 'srb_sprites_jump_v1' }
            ];
            this.saveAssetList();
        }
        this.renderAssetSelect();
    }

    saveAssetList() {
        localStorage.setItem('srb_asset_list', JSON.stringify(this.assets));
    }

    renderAssetSelect() {
        const select = document.getElementById('asset-select');
        select.innerHTML = '';
        this.assets.forEach((asset, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = asset.name;
            select.appendChild(opt);
        });
        select.value = this.currentAssetIndex;
    }

    switchAsset(index) {
        // Save current work if possible
        if (this.sprites.length > 0 && this.assets[this.currentAssetIndex]) {
            this.saveToStorage();
        }

        this.currentAssetIndex = index;
        const asset = this.assets[index];

        // Load Image
        this.img = new Image();
        this.img.src = asset.image;
        this.img.onload = () => {
            console.log('Loaded:', asset.image);
            this.draw();
            this.updatePreview();
        };
        this.img.onerror = () => {
            console.error('Failed to load:', asset.image);
            alert('Failed to load image: ' + asset.image);
        };

        // Load Data
        this.loadFromStorage();
        this.renderAssetSelect();
    }

    createAsset() {
        const name = prompt('Asset Name (e.g. "Enemy Walk"):');
        if (!name) return;
        const image = prompt('Image Path (relative to index.html, e.g. "assets/enemy.png"):', 'assets/');
        if (!image) return;

        const key = 'srb_sprites_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

        this.assets.push({ name, image, key });
        this.saveAssetList();
        this.renderAssetSelect();
        this.switchAsset(this.assets.length - 1);
    }

    deleteAsset() {
        if (this.assets.length <= 1) {
            alert('Cannot delete the last asset.');
            return;
        }
        if (!confirm(`Delete "${this.assets[this.currentAssetIndex].name}"? This cannot be undone.`)) return;

        // Remove storage
        localStorage.removeItem(this.assets[this.currentAssetIndex].key);

        // Remove from list
        this.assets.splice(this.currentAssetIndex, 1);
        this.saveAssetList();

        // Switch to previous
        this.switchAsset(Math.max(0, this.currentAssetIndex - 1));
    }

    loadFromStorage() {
        const asset = this.assets[this.currentAssetIndex];
        const data = localStorage.getItem(asset.key);

        if (data) {
            this.sprites = JSON.parse(data);
        } else {
            this.sprites = [];
            // Auto-generate defaults if empty
            if (asset.name.includes('Run')) {
                this.addDefaultSprites(8, 256);
            } else if (asset.name.includes('Idle')) {
                this.addDefaultSprites(4, 450);
            } else if (asset.name.includes('Jump')) {
                this.addDefaultSprites(4, 450); // Guessing 450 for jump too
            }
        }
        this.renderList();
    }

    addDefaultSprites(count, size) {
        this.sprites = [];
        for (let i = 0; i < count; i++) {
            // Simple grid assumption
            const cols = 2; // 2x2 for idle/jump
            if (count > 4) cols = 4; // 4x2 for run

            const row = Math.floor(i / cols);
            const col = i % cols;

            // Offset guess
            let x = col * 512; // Assuming 512 stride based on previous sheets
            if (count === 8) x = col * 256; // Run sheet is tighter

            this.sprites.push({
                name: `frame_${i}`,
                x: x + 30,
                y: row * 512 + 30,
                w: size,
                h: size
            });
        }
        this.renderList();
        this.saveToStorage();
    }

    saveToStorage() {
        const asset = this.assets[this.currentAssetIndex];
        localStorage.setItem(asset.key, JSON.stringify(this.sprites));
    }

    bindEvents() {
        // Asset UI
        document.getElementById('asset-select').addEventListener('change', (e) => this.switchAsset(parseInt(e.target.value)));
        document.getElementById('btn-new-asset').addEventListener('click', () => this.createAsset());
        document.getElementById('btn-del-asset').addEventListener('click', () => this.deleteAsset());

        // Canvas Mouse Events
        this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', e => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', e => this.onWheel(e));

        // UI Inputs
        document.getElementById('inp-name').addEventListener('input', e => this.updateSelected({ name: e.target.value }));
        document.getElementById('inp-x').addEventListener('change', e => this.updateSelected({ x: parseInt(e.target.value) }));
        document.getElementById('inp-y').addEventListener('change', e => this.updateSelected({ y: parseInt(e.target.value) }));
        document.getElementById('inp-w').addEventListener('change', e => this.updateSelected({ w: parseInt(e.target.value) }));
        document.getElementById('inp-h').addEventListener('change', e => this.updateSelected({ h: parseInt(e.target.value) }));

        // Buttons
        document.getElementById('btn-add').addEventListener('click', () => this.addSprite());
        document.getElementById('btn-delete').addEventListener('click', () => this.deleteSprite());
        document.getElementById('btn-copy').addEventListener('click', () => this.copyJSON());

        // Zoom
        document.getElementById('btn-zoom-in').addEventListener('click', () => { this.scale += 0.5; this.draw(); });
        document.getElementById('btn-zoom-out').addEventListener('click', () => { this.scale = Math.max(0.5, this.scale - 0.5); this.draw(); });
        document.getElementById('btn-reset').addEventListener('click', () => { this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.draw(); });
    }

    addSprite() {
        const newSprite = {
            name: 'new_sprite',
            x: 0,
            y: 0,
            w: this.boxWidth,
            h: this.boxHeight
        };
        this.sprites.push(newSprite);
        this.selectSprite(this.sprites.length - 1);
        this.renderList();
        this.saveToStorage();
    }

    deleteSprite() {
        if (this.selectedSprite === null) return;
        const index = this.sprites.indexOf(this.selectedSprite);
        if (index > -1) {
            this.sprites.splice(index, 1);
            this.selectedSprite = null;
            this.renderList();
            this.draw();
            this.saveToStorage();
        }
    }

    selectSprite(index) {
        this.selectedSprite = this.sprites[index];
        const s = this.selectedSprite;

        // Update Inputs
        document.getElementById('inp-name').value = s.name;
        document.getElementById('inp-x').value = s.x;
        document.getElementById('inp-y').value = s.y;
        document.getElementById('inp-w').value = s.w;
        document.getElementById('inp-h').value = s.h;

        // Highlight in list
        this.renderList();
        this.draw();
        this.updatePreview();
    }

    updateSelected(changes) {
        if (!this.selectedSprite) return;
        Object.assign(this.selectedSprite, changes);

        // Update UI if changed from canvas
        if (changes.x !== undefined) document.getElementById('inp-x').value = this.selectedSprite.x;
        if (changes.y !== undefined) document.getElementById('inp-y').value = this.selectedSprite.y;
        if (changes.w !== undefined) document.getElementById('inp-w').value = this.selectedSprite.w;
        if (changes.h !== undefined) document.getElementById('inp-h').value = this.selectedSprite.h;

        this.renderList(); // Name might change
        this.draw();
        this.updatePreview();
        this.saveToStorage();
    }

    renderList() {
        const list = document.getElementById('sprite-list');
        list.innerHTML = '';
        this.sprites.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'sprite-item' + (this.selectedSprite === s ? ' active' : '');
            div.innerText = s.name;
            div.onclick = () => this.selectSprite(i);
            list.appendChild(div);
        });
    }

    copyJSON() {
        const json = JSON.stringify(this.sprites, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            alert('JSON copied to clipboard!');
        });
    }

    // --- Canvas Logic ---

    draw() {
        // Clear
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw Image
        if (this.img.complete) {
            this.ctx.drawImage(this.img, 0, 0);
        }

        // Draw Boxes
        this.sprites.forEach(s => {
            this.ctx.strokeStyle = (this.selectedSprite === s) ? '#0f0' : 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = (this.selectedSprite === s) ? 2 : 1;
            this.ctx.strokeRect(s.x, s.y, s.w, s.h);

            // Label
            this.ctx.fillStyle = (this.selectedSprite === s) ? '#0f0' : 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(s.name, s.x, s.y - 5);
        });

        this.ctx.restore();
    }

    updatePreview() {
        if (!this.selectedSprite || !this.img.complete) return;
        const s = this.selectedSprite;
        this.previewCtx.clearRect(0, 0, 64, 64);
        // Draw scaled to fit 64x64
        this.previewCtx.drawImage(this.img, s.x, s.y, s.w, s.h, 0, 0, 64, 64);
    }

    // --- Mouse Handling ---

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // World Coords
        const wx = (mx - this.offsetX) / this.scale;
        const wy = (my - this.offsetY) / this.scale;

        // Middle Click Pan
        if (e.button === 1 || e.shiftKey) {
            this.isDragging = true;
            this.dragMode = 'pan';
            this.lastMouseX = mx;
            this.lastMouseY = my;
            return;
        }

        // Check Selection
        // Reverse iterate to select top-most
        let clickedSprite = null;
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            const s = this.sprites[i];
            if (wx >= s.x && wx <= s.x + s.w && wy >= s.y && wy <= s.y + s.h) {
                clickedSprite = s;
                break;
            }
        }

        if (clickedSprite) {
            this.selectSprite(this.sprites.indexOf(clickedSprite));
            this.isDragging = true;
            this.dragMode = 'move';
            this.lastMouseX = wx; // Store world pos for move delta
            this.lastMouseY = wy;

            // Check resize handle (bottom right 10x10)
            if (wx >= clickedSprite.x + clickedSprite.w - 10 && wy >= clickedSprite.y + clickedSprite.h - 10) {
                this.dragMode = 'resize';
            }
        } else {
            // Deselect
            this.selectedSprite = null;
            this.renderList();
            this.draw();
            this.isDragging = true;
            this.dragMode = 'pan';
            this.lastMouseX = mx;
            this.lastMouseY = my;
        }
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const wx = (mx - this.offsetX) / this.scale;
        const wy = (my - this.offsetY) / this.scale;

        if (this.dragMode === 'pan') {
            this.offsetX += mx - this.lastMouseX;
            this.offsetY += my - this.lastMouseY;
            this.lastMouseX = mx;
            this.lastMouseY = my;
            this.draw();
        } else if (this.dragMode === 'move' && this.selectedSprite) {
            const dx = wx - this.lastMouseX;
            const dy = wy - this.lastMouseY;

            this.selectedSprite.x += Math.round(dx);
            this.selectedSprite.y += Math.round(dy);

            this.lastMouseX = wx;
            this.lastMouseY = wy;

            this.updateSelected({});
        } else if (this.dragMode === 'resize' && this.selectedSprite) {
            this.selectedSprite.w = Math.max(1, Math.round(wx - this.selectedSprite.x));
            this.selectedSprite.h = Math.max(1, Math.round(wy - this.selectedSprite.y));
            this.updateSelected({});
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.dragMode = 'none';
    }

    onWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.scale += 0.1;
        } else {
            this.scale = Math.max(0.1, this.scale - 0.1);
        }
        this.draw();
    }

    loop() {
        // Animation loop if needed
        requestAnimationFrame(() => this.loop());
    }
}

new AssetEditor();
