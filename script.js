function showAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.innerHTML = `
        <h3>Aviso</h3>
        <p>${message}</p>
        <div class="custom-alert-buttons">
            <button class="custom-alert-btn custom-alert-btn-primary" onclick="this.parentElement.parentElement.remove()">Aceptar</button>
        </div>
    `;
    document.body.appendChild(alert);
}

function showPrompt(message, defaultValue, callback) {
    const prompt = document.createElement('div');
    prompt.className = 'custom-alert';
    prompt.innerHTML = `
        <h3>${message}</h3>
        <input type="text" value="${defaultValue || ''}" id="customPromptInput">
        <div class="custom-alert-buttons">
            <button class="custom-alert-btn custom-alert-btn-secondary" onclick="this.parentElement.parentElement.remove()">Cancelar</button>
            <button class="custom-alert-btn custom-alert-btn-primary" id="customPromptConfirm">Aceptar</button>
        </div>
    `;
    document.body.appendChild(prompt);
    
    document.getElementById('customPromptConfirm').addEventListener('click', () => {
        const value = document.getElementById('customPromptInput').value;
        prompt.remove();
        callback(value);
    });
    
    setTimeout(() => {
        document.getElementById('customPromptInput').focus();
    }, 100);
}

window.alert = showAlert;
window.prompt = function(message, defaultValue) {
    return new Promise(resolve => {
        showPrompt(message, defaultValue, resolve);
    });
};

document.addEventListener('DOMContentLoaded', function() {
    const COLS = 40;
    const ROWS = 12;
    const MAX_FRAMES = 9999999999;
    
    const canvasGrid = document.getElementById('canvasGrid');
    const colorGrid = document.getElementById('colorGrid');
    const charInput = document.getElementById('charInput');
    const cursorPosition = document.getElementById('cursorPosition');
    const timeInput = document.getElementById('timeInput');
    const currentColorDisplay = document.getElementById('currentColor');
    const infoSection = document.getElementById('infoSection');
    const infoBtn = document.getElementById('infoBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    let appState = {
        currentTool: 'pencil',
        currentColor: '#ffffff',
        currentChar: '@',
        brushSize: 1,
        currentPalette: 'normal',
        frames: [],
        currentFrameIndex: 0,
        gridData: Array(ROWS).fill().map(() => Array(COLS).fill({ char: ' ', color: '#000000' }))
    };

    const palettes = {
        normal: [
            '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
            '#00ffff', '#ff00ff', '#ff8800', '#8800ff', '#00ff88',
            '#ff0088', '#88ff00', '#0088ff', '#ff8800', '#880000',
            '#008800', '#000088', '#888800', '#008888', '#880088'
        ],
        neon: [
            '#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#aa00ff',
            '#00ffaa', '#ffaa00', '#aa00aa', '#00aaff', '#ffaa00',
            '#aaff00', '#00ffaa', '#ff00aa', '#aa00ff', '#00aaff',
            '#ffaa00', '#aaff00', '#00ffaa', '#ff00aa', '#aa00ff'
        ],
        pastel: [
            '#ffb6c1', '#ffd700', '#98fb98', '#87cefa', '#dda0dd',
            '#ffa07a', '#f0e68c', '#e0ffff', '#d8bfd8', '#ffdead',
            '#b0e0e6', '#f5deb3', '#d3d3d3', '#ffc0cb', '#f0fff0',
            '#e6e6fa', '#fff0f5', '#f5f5dc', '#ffe4e1', '#f0f8ff'
        ]
    };

    function initApp() {
        createGrid();
        createColorGrid();
        setupEventListeners();
        addNewFrame('00:00:00');
    }
    
    function createGrid() {
        canvasGrid.innerHTML = '';
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.textContent = ' ';
                cell.style.backgroundColor = appState.gridData[row][col].color;
                cell.addEventListener('mousedown', handleCellMouseDown);
                cell.addEventListener('mouseenter', handleCellMouseEnter);
                cell.addEventListener('click', handleCellClick);
                
                canvasGrid.appendChild(cell);
            }
        }
    }
    
    function createColorGrid() {
        colorGrid.innerHTML = '';
        const colors = palettes[appState.currentPalette];
        
        colors.forEach(color => {
            const colorCell = document.createElement('div');
            colorCell.className = 'color-cell';
            colorCell.style.backgroundColor = color;
            if (color === appState.currentColor) {
                colorCell.classList.add('active');
            }
            colorCell.addEventListener('click', () => {
                appState.currentColor = color;
                currentColorDisplay.style.backgroundColor = color;
                document.querySelectorAll('.color-cell').forEach(c => c.classList.remove('active'));
                colorCell.classList.add('active');
            });
            
            colorGrid.appendChild(colorCell);
        });
    }
    
    function setupEventListeners() {
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', () => {
                document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                appState.currentTool = tool.dataset.tool;
            });
        });

        document.querySelectorAll('.brush-size').forEach(size => {
            size.addEventListener('click', () => {
                document.querySelectorAll('.brush-size').forEach(s => s.classList.remove('active'));
                size.classList.add('active');
                appState.brushSize = parseInt(size.dataset.size);
            });
        });
       
        document.querySelectorAll('.palette').forEach(palette => {
            palette.addEventListener('click', () => {
                document.querySelectorAll('.palette').forEach(p => p.classList.remove('active'));
                palette.classList.add('active');
                appState.currentPalette = palette.dataset.palette;
                createColorGrid();
            });
        });

        charInput.addEventListener('input', function() {
            if (this.value.length > 0) {
                appState.currentChar = this.value[0];
            } else {
                appState.currentChar = ' ';
            }
        });

        document.getElementById('addFrameBtn').addEventListener('click', () => {
            let newTime = '00:00:00';
            if (appState.frames.length > 0) {
                const lastTime = appState.frames[appState.frames.length - 1].time;
                const ms = timeToMs(lastTime) + 1000;
                newTime = msToTimeFormat(ms, false);
            }
            addNewFrame(newTime);
        });

        document.getElementById('prevFrameBtn').addEventListener('click', prevFrame);
        document.getElementById('nextFrameBtn').addEventListener('click', nextFrame);
        document.getElementById('exportYTTBtn').addEventListener('click', exportYTT);
        document.getElementById('exportASSBtn').addEventListener('click', exportASS);
        document.getElementById('exportSRTBtn').addEventListener('click', exportSRT);
        document.getElementById('playBtn').addEventListener('click', playAnimation);
        infoBtn.addEventListener('click', toggleInfoSection);

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    function handleCellClick(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        cursorPosition.textContent = `Posición: ${col},${row}`;
        
        switch (appState.currentTool) {
            case 'pencil':
                drawAtPosition(row, col);
                break;
            case 'eraser':
                eraseAtPosition(row, col);
                break;
            case 'picker':
                pickAtPosition(row, col);
                break;
            case 'bucket':
                fillArea(row, col);
                break;
        }
        
        updateGridDisplay();
    }
    
    function drawAtPosition(row, col) {
        const size = appState.brushSize;
        const halfSize = Math.floor(size / 2);
        
        for (let r = row - halfSize; r <= row + halfSize; r++) {
            for (let c = col - halfSize; c <= col + halfSize; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    appState.gridData[r][c] = {
                        char: appState.currentChar,
                        color: appState.currentColor
                    };
                }
            }
        }
    }
    
    function eraseAtPosition(row, col) {
        const size = appState.brushSize;
        const halfSize = Math.floor(size / 2);
        
        for (let r = row - halfSize; r <= row + halfSize; r++) {
            for (let c = col - halfSize; c <= col + halfSize; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    appState.gridData[r][c] = {
                        char: ' ',
                        color: '#000000'
                    };
                }
            }
        }
    }
    
    function pickAtPosition(row, col) {
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            const cell = appState.gridData[row][col];
            appState.currentColor = cell.color;
            appState.currentChar = cell.char;
            
            currentColorDisplay.style.backgroundColor = appState.currentColor;
            charInput.value = appState.currentChar;

            document.querySelectorAll('.color-cell').forEach(cell => {
                cell.classList.remove('active');
                if (cell.style.backgroundColor === appState.currentColor) {
                    cell.classList.add('active');
                }
            });
        }
    }
    
    function fillArea(row, col) {
        const targetColor = appState.gridData[row][col].color;
        const newColor = appState.currentColor;
        const newChar = appState.currentChar;
        
        if (targetColor === newColor) return;
        
        const queue = [{row, col}];
        const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));
        
        while (queue.length > 0) {
            const {row: r, col: c} = queue.shift();
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || visited[r][c]) continue;
            if (appState.gridData[r][c].color === targetColor) {
                appState.gridData[r][c] = { char: newChar, color: newColor };
                visited[r][c] = true;
               
                queue.push({row: r-1, col: c});
                queue.push({row: r+1, col: c});
                queue.push({row: r, col: c-1});
                queue.push({row: r, col: c+1});
            }
        }
    }
    
    function handleCellMouseDown(e) {
        handleCellClick(e);
    }
    
    function handleCellMouseEnter(e) {
        if (e.buttons === 1) { 
            handleCellClick(e);
        }
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        cursorPosition.textContent = `Posición: ${col},${row}`;
    }
    
    function updateGridDisplay() {
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const cellData = appState.gridData[row][col];
            
            cell.textContent = cellData.char;
            cell.style.backgroundColor = cellData.color;
            
            const rgb = hexToRgb(cellData.color);
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            cell.style.color = brightness > 125 ? '#000' : '#fff';
        });
    }
    
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 0, g: 0, b: 0};
    }
    
    function addNewFrame(time) {
    if (appState.frames.length >= MAX_FRAMES) {
        alert(`Límite de ${MAX_FRAMES} frames alcanzado`);
        return;
    }
    
    let frameTime = '00:00:00';
    if (appState.frames.length > 0) {
        const lastTime = appState.frames[appState.frames.length - 1].time;
        const ms = timeToMs(lastTime) + 1000;
        frameTime = msToTimeFormat(ms, false);
    } else if (time && typeof time === 'string') {
        frameTime = time;
    }

    const frameData = {
        time: frameTime, 
        grid: JSON.parse(JSON.stringify(appState.gridData))
    };
    
    appState.frames.push(frameData);
    appState.currentFrameIndex = appState.frames.length - 1;
    
    renderFrames();
    updateFrameDisplay();
}
    
    function prevFrame() {
        if (appState.currentFrameIndex > 0) {
            saveCurrentFrame();
            appState.currentFrameIndex--;
            loadFrame(appState.currentFrameIndex);
        }
    }
    
    function nextFrame() {
        if (appState.currentFrameIndex < appState.frames.length - 1) {
            saveCurrentFrame();
            appState.currentFrameIndex++;
            loadFrame(appState.currentFrameIndex);
        }
    }
    
    function saveCurrentFrame() {
        if (appState.frames.length > 0 && appState.currentFrameIndex >= 0) {
            appState.frames[appState.currentFrameIndex].grid = JSON.parse(JSON.stringify(appState.gridData));
        }
    }
    
    function loadFrame(index) {
        if (index >= 0 && index < appState.frames.length) {
            appState.gridData = JSON.parse(JSON.stringify(appState.frames[index].grid));
            updateGridDisplay();
            updateFrameDisplay();
            renderFrames();
        }
    }
    
    function updateFrameDisplay() {
        if (appState.currentFrameIndex >= 0 && appState.currentFrameIndex < appState.frames.length) {
            timeInput.value = appState.frames[appState.currentFrameIndex].time;
        }
    }
    
    function renderFrames() {
        const framesContainer = document.getElementById('framesContainer');
        framesContainer.innerHTML = '';
        
        appState.frames.forEach((frame, index) => {
            const frameElement = document.createElement('div');
            frameElement.className = 'frame';
            if (index === appState.currentFrameIndex) {
                frameElement.classList.add('active');
            }
            
            frameElement.innerHTML = `
                <div class="frame-time">${frame.time}</div>
                <div class="frame-preview">${renderPreview(frame.grid)}</div>
            `;
            
            frameElement.addEventListener('click', () => {
                saveCurrentFrame();
                appState.currentFrameIndex = index;
                loadFrame(index);
                document.querySelectorAll('.frame').forEach(f => f.classList.remove('active'));
                frameElement.classList.add('active');
            });
            
const timeElement = frameElement.querySelector('.frame-time');
timeElement.addEventListener('dblclick', async () => {
    const newTime = await prompt('Nuevo tiempo (HH:MM:SS):', frame.time);
    if (newTime !== null && typeof newTime === 'string') {
        appState.frames[index].time = newTime;
        renderFrames();
        if (index === appState.currentFrameIndex) {
            updateFrameDisplay();
        }
    }
});
            framesContainer.appendChild(frameElement);
        });
        
        if (appState.frames.length > 0) {
            const currentFrame = framesContainer.children[appState.currentFrameIndex];
            currentFrame.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
    
    function renderPreview(grid) {
        let preview = '';
        for (let row = 0; row < Math.min(4, ROWS); row++) {
            let line = '';
            for (let col = 0; col < Math.min(20, COLS); col++) {
                line += grid[row][col].char;
            }
            preview += line + '\n';
        }
        
        return preview;
    }
    
    function playAnimation() {
        if (appState.frames.length === 0) return;
        const playBtn = document.getElementById('playBtn');
        playBtn.textContent = 'Detener';
        playBtn.classList.add('pulse');
        
        let currentFrame = 0;
        const playInterval = setInterval(() => {
            if (currentFrame >= appState.frames.length) {
                clearInterval(playInterval);
                playBtn.textContent = 'Reproducir';
                playBtn.classList.remove('pulse');
                loadFrame(appState.currentFrameIndex);
                return;
            }
            
            appState.gridData = JSON.parse(JSON.stringify(appState.frames[currentFrame].grid));
            updateGridDisplay();
            
            document.querySelectorAll('.frame').forEach(f => f.classList.remove('active'));
            document.querySelectorAll('.frame')[currentFrame].classList.add('active');
            
            currentFrame++;
        }, 500);
        playBtn.onclick = function() {
            clearInterval(playInterval);
            playBtn.textContent = 'Reproducir';
            playBtn.classList.remove('pulse');
            playBtn.onclick = playAnimation;
        };
    }
    
    function exportYTT() {
        if (appState.frames.length === 0) {
            alert('Agrega al menos un frame antes de exportar');
            return;
        }

        let yttContent = '<?xml version="1.0" encoding="utf-8"?>\n<timedtext format="3">\n';

        const colorMap = new Map();
        let penIdCounter = 1;

        appState.frames.forEach(frame => {
            for (let r = 0; r < frame.grid.length; r++) {
                for (let c = 0; c < frame.grid[r].length; c++) {
                    const cell = frame.grid[r][c];
                    if (cell.color && !colorMap.has(cell.color)) {
                        colorMap.set(cell.color, penIdCounter++);
                    }
                }
            }
        });

        if (colorMap.size === 0) {
            colorMap.set('#000000', 1);
        }

        yttContent += '  <head>\n';
        colorMap.forEach((id, color) => {
            const hexColor = color.replace('#', '');
            yttContent += `    <pen id="${id}" fc="${hexColor}" />\n`;
        });
        yttContent += '  </head>\n';

        yttContent += '  <body>\n';
        appState.frames.forEach((frame, index) => {
            const startTime = timeToMs(frame.time);
            const duration = (index < appState.frames.length - 1) ? 
                timeToMs(appState.frames[index + 1].time) - startTime : 1000;
            
            yttContent += `    <p t="${startTime}" d="${duration}">\n`;

            let frameContent = '';
            for (let r = 0; r < frame.grid.length; r++) {
                for (let c = 0; c < frame.grid[r].length; c++) {
                    const cell = frame.grid[r][c];
                    const char = cell.char || ' ';
                    const penId = cell.color ? colorMap.get(cell.color) : '1';
                    frameContent += `<s p="${penId}">${escapeXML(char)}</s>`;
                }
            
                if (r < frame.grid.length - 1) {
                    frameContent += '\n';
                }
            }
            
            yttContent += `      ${frameContent}\n`;
           
            yttContent += '    </p>\n';
        });

        yttContent += '  </body>\n</timedtext>';

        downloadFile('animacion_ascii.ytt', yttContent, 'application/xml');
    }

    function exportASS() {
        if (appState.frames.length === 0) {
            alert('Agrega al menos un frame antes de exportar');
            return;
        }
        
        let assContent = `[Script Info]
Title: YTScribe Animation
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
        appState.frames.forEach((frame, index) => {
            const startTime = msToASSFormat(timeToMs(frame.time));
            const endTime = index < appState.frames.length - 1 ? 
                msToASSFormat(timeToMs(appState.frames[index + 1].time)) : 
                msToASSFormat(timeToMs(frame.time) + 1000);
            
            let frameContent = '';
            frame.grid.forEach(row => {
                let line = '';
                let currentColor = null;
                
                row.forEach(cell => {
                    if (cell.char === ' ') {
                        line += ' ';
                    } else {
                        if (cell.color !== currentColor) {
                            if (currentColor !== null) {
                                line += '{\\c}';
                            }
                            line += `{\\c&${rgbToBgr(cell.color)}&}`;
                            currentColor = cell.color;
                        }
                        line += cell.char;
                    }
                });
                frameContent += line + '\\N';
            });
            
            assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${frameContent}\n`;
        });
        
        downloadFile('animacion_ascii.ass', assContent, 'text/plain');
    }
    
    function exportSRT() {
        if (appState.frames.length === 0) {
            alert('Agrega al menos un frame antes de exportar');
            return;
        }
        
        let srtContent = '';
        appState.frames.forEach((frame, index) => {
            const startTime = msToTimeFormat(timeToMs(frame.time), true);
            const endTime = index < appState.frames.length - 1 ? 
                msToTimeFormat(timeToMs(appState.frames[index + 1].time), true) : 
                msToTimeFormat(timeToMs(frame.time) + 1000, true);
            
            srtContent += `${index + 1}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            
            frame.grid.forEach(row => {
                let line = '';
                row.forEach(cell => {
                    line += cell.char;
                });
                srtContent += line + '\n';
            });
            
            srtContent += '\n';
        });
        downloadFile('animacion_ascii.srt', srtContent, 'text/plain');
    }
    
    function timeToMs(timeStr) {
    if (typeof timeStr !== 'string') {
        console.error('Error: timeStr debe ser un string', timeStr);
        return 0; 
    }
    
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
    
    function msToTimeFormat(ms, withMs = false) {
    ms = parseInt(ms) || 0;
    
    const hours = Math.floor(ms / 3600000);
    ms %= 3600000;
    const minutes = Math.floor(ms / 60000);
    ms %= 60000;
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    
    if (withMs) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    } else {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
    
    function msToASSFormat(ms) {
        ms = parseInt(ms);
        const hours = Math.floor(ms / 3600000);
        ms %= 3600000;
        const minutes = Math.floor(ms / 60000);
        ms %= 60000;
        const seconds = Math.floor(ms / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    
    function escapeXML(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&apos;');
    }
    
    function rgbToBgr(hex) {
        const rgb = hexToRgb(hex);
        return rgb ? rgb.b.toString(16).padStart(2, '0') + 
                     rgb.g.toString(16).padStart(2, '0') + 
                     rgb.r.toString(16).padStart(2, '0') : 'FFFFFF';
    }
    
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    function toggleInfoSection() {
        infoSection.classList.toggle('active');
    }
    
    initApp();
});
