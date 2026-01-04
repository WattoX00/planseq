(function(){
    const viewport = document.getElementById('viewport');
    const canvas = document.getElementById('canvas');
    const svg = document.getElementById('connections');
    const fileInput = document.getElementById('file_input');
    const importBtn = document.getElementById('import_btn');
    const dropHint = document.getElementById('drop_hint');
    const nodeInfo = document.getElementById('node_info');
    const tasksList = document.getElementById('tasks_list');
    const overallProgress = document.getElementById('overall_progress');
    svg.style.transform = 'none';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    let roadmap = null;
    let selectedNodeId = null;

    let scale = 1, translateX = 0, translateY = 0;
    let isPanning = false, panStart = {x:0,y:0};
    let nodeDrag = null;

    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) readFile(e.target.files[0]);
    });

    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            readFile(e.dataTransfer.files[0]);
        }
    });

    function loadSavedRoadmap() {
        try {
            const raw = localStorage.getItem('roadmap');
            if (!raw) return;
            const item = JSON.parse(raw);
            if (item && item.data) loadRoadmap(item.data);
        } catch (e) {
            console.warn('Failed to load saved roadmap', e);
        }
    }

    function saveRoadmapToStorage(data, name) {
        try {
            const item = { id: name || 'roadmap', ts: Date.now(), data: data };
            localStorage.setItem('roadmap', JSON.stringify(item));
        } catch (e) {
            console.warn('Failed to save roadmap', e);
        }
    }

    function readFile(file) {
        if (!file.name.endsWith('.json')) return alert('Please provide a JSON file');
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                loadRoadmap(data);
                saveRoadmapToStorage(data, file.name);
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }

    function clearViewport() {
        [...canvas.querySelectorAll('.node')].forEach(n => n.remove());
        [...svg.querySelectorAll('line')].forEach(l => l.remove());
        selectedNodeId = null;
        nodeInfo.textContent = 'No node selected';
        tasksList.innerHTML = '';
    }

    function loadRoadmap(data) {
        clearViewport();
        const nodesMap = data.nodes && typeof data.nodes === 'object' ? data.nodes : (Array.isArray(data) ? arrayToMap(data) : {});
        roadmap = { nodes: nodesMap };
        Object.values(nodesMap).forEach(n => {
            createNodeElement(n);
            updateNodeProgressFromRoadmap(n.id);
        });
        renderConnections();
        // update aggregated progress bar
        updateOverallProgress();
    }

    function arrayToMap(arr) {
        const m = {};
        arr.forEach(item => { m[item.id] = item; });
        return m;
    }

    function createNodeElement(nodeData) {
        const d = document.createElement('div');
        d.className = 'node';
        d.dataset.id = nodeData.id;
        d.dataset.name = nodeData.name || '';
        d.dataset.desc = nodeData.desc || '';
        d.dataset.parent = nodeData.parent || '';
        d.style.left = (nodeData.position && nodeData.position.x ? nodeData.position.x : 60) + 'px';
        d.style.top = (nodeData.position && nodeData.position.y ? nodeData.position.y : 60) + 'px';
        d.innerHTML = `<div class="node_title">${escapeHtml(nodeData.name||'(no name)')}</div><div class="progress"><div class="fill"></div></div>`;

        d.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(nodeData.id);
        });

        d.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            d.setPointerCapture && d.setPointerCapture(e.pointerId);
            nodeDrag = { el: d, id: nodeData.id, startX: e.clientX, startY: e.clientY, origLeft: parseFloat(d.style.left), origTop: parseFloat(d.style.top), pointerId: e.pointerId };
            document.addEventListener('pointermove', onNodeDrag);
            document.addEventListener('pointerup', finishNodeDrag, { once: true });
        });

        canvas.appendChild(d);
    }

    function onNodeDrag(e) {
        if(!nodeDrag) return;
        const dx = (e.clientX - nodeDrag.startX)/scale;
        const dy = (e.clientY - nodeDrag.startY)/scale;
        const nx = nodeDrag.origLeft + dx;
        const ny = nodeDrag.origTop + dy;
        nodeDrag.el.style.left = nx + 'px';
        nodeDrag.el.style.top = ny + 'px';
        nodeDrag.el.style.left = nx + 'px';
        nodeDrag.el.style.top = ny + 'px';
        renderConnections();
    }

    function updateTransform(){
        canvas.style.transform =
            `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        const minor = 40 * scale;
        const major = minor * 5;

        grid.style.backgroundSize = `
            ${minor}px ${minor}px,
            ${minor}px ${minor}px,
            ${major}px ${major}px,
            ${major}px ${major}px
        `;

        grid.style.backgroundPosition = `
            ${translateX % minor}px ${translateY % minor}px,
            ${translateX % minor}px ${translateY % minor}px,
            ${translateX % major}px ${translateY % major}px,
            ${translateX % major}px ${translateY % major}px
        `;

        renderConnections();
    }

    function finishNodeDrag(e) {

        if(!nodeDrag) return;
        
        const id = nodeDrag.id;
        const el = nodeDrag.el;
        
        try { if (nodeDrag.pointerId && el.releasePointerCapture) el.releasePointerCapture(nodeDrag.pointerId); } catch(_) {}
        
        if(roadmap && roadmap.nodes && roadmap.nodes[id]) {
            roadmap.nodes[id].position = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
            saveRoadmapToStorage(roadmap);
        }
        nodeDrag = null;
        document.removeEventListener('pointermove', onNodeDrag);
    }

    function renderConnections() {
        if (!svg) return;
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        if (!roadmap || !roadmap.nodes) return;

        const svgRect = svg.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${Math.round(svgRect.width)} ${Math.round(svgRect.height)}`);

        Object.values(roadmap.nodes).forEach(n => {
            if (!n.parent) return;

            const p = roadmap.nodes[n.parent];
            if (!p) return;

            const ce = canvas.querySelector(`[data-id='${n.id}']`);
            const pe = canvas.querySelector(`[data-id='${p.id}']`);
            if (!ce || !pe) return;

            const cr = ce.getBoundingClientRect();
            const pr = pe.getBoundingClientRect();

            const x1 = pr.left + pr.width / 2 - svgRect.left;
            const y1 = pr.top  + pr.height / 2 - svgRect.top;
            const x2 = cr.left + cr.width / 2 - svgRect.left;
            const y2 = cr.top  + cr.height / 2 - svgRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg','line');

            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'var(--line)');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-linecap', 'round');

            svg.appendChild(line);
        });
    }

    viewport.addEventListener('click', () => {
        clearSelection();
    });

    function selectNode(id) {
        clearSelection();
        selectedNodeId = id;
        const el = canvas.querySelector(`[data-id='${id}']`);

        if (el) el.classList.add('selected');
        showNodeInfo();
    }

    function clearSelection() {
        selectedNodeId = null;
        [...canvas.querySelectorAll('.node')].forEach(n => n.classList.remove('selected'));
        
        nodeInfo.textContent = 'No node selected';
        tasksList.innerHTML = '';
    }

    function showNodeInfo() {
        if (!roadmap || !roadmap.nodes || !selectedNodeId) return;
        
        const n = roadmap.nodes[selectedNodeId];
        
        if (!n) return;
        
        nodeInfo.innerHTML = `<strong>${escapeHtml(n.name || '(no name)')}</strong><div style="font-size:12px;color:#444">${escapeHtml(n.desc||'')}</div>`;
        
        tasksList.innerHTML = '';
        const tasks = n.tasks || [];
        
        if (!tasks.length) {
            tasksList.textContent = '(no tasks)';
            return;
        }

        tasks.forEach((t, idx) => {

            const row = document.createElement('div');
            row.className = 'task';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!t.completed;
            cb.addEventListener('change', () => {
                t.completed = cb.checked;
                if (cb.checked) row.classList.add('completed'); else row.classList.remove('completed');
                updateNodeProgressFromRoadmap(selectedNodeId);
                // persist and refresh overall progress
                saveRoadmapToStorage(roadmap);
                updateOverallProgress();
            });

            const label = document.createElement('div');

            if (t.link) {
                const a = document.createElement('a'); a.href = t.link; a.textContent = t.name || t.link; a.target='_blank';
                label.appendChild(a);
            } else {
                label.textContent = t.name || '(no name)';
            }

            const desc = document.createElement('div'); desc.style.fontSize='12px'; desc.style.color='#444'; desc.textContent = t.desc || '';
            row.appendChild(cb);
            const inner = document.createElement('div'); inner.appendChild(label); inner.appendChild(desc);
            row.appendChild(inner);

            if (t.completed) row.classList.add('completed');
            tasksList.appendChild(row);
        });
    }

    function escapeHtml(s) {
        return (s+'').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
    }

    function updateOverallProgress() {
        if (!overallProgress) return;
        if (!roadmap || !roadmap.nodes) {
            overallProgress.innerHTML = '';
            return;
        }

        let total = 0, done = 0;
        Object.values(roadmap.nodes).forEach(n => {
            const tasks = n.tasks || [];
            total += tasks.length;
            done += tasks.filter(t => t.completed).length;
        });

        const pct = total ? Math.round(100 * done / total) : 0;

        overallProgress.innerHTML = `
            <div class="op_header">
                <div class="op_title">Overall Progress</div>
                <div class="op_stats">${done}/${total}</div>
            </div>
            <div class="op_bar"><div class="op_fill" style="width:${pct}%"></div></div>
            <div class="op_percent">${pct}%</div>
        `;
    }

    function updateNodeProgressFromRoadmap(id) {
        if(!roadmap||!roadmap.nodes||!roadmap.nodes[id]) return;

        const n = roadmap.nodes[id];
        const tasks = n.tasks||[];
        const total=tasks.length;
        const done = tasks.filter(t=>t.completed).length;
        const pct = total? Math.round(100 * done/total) : 0;
        const el = canvas.querySelector(`[data-id='${id}']`);

        if(!el) return;
        
        let fill = el.querySelector('.progress .fill');
        
        if (!fill) {
            const p = document.createElement('div');
            p.className='progress';
            p.innerHTML='<div class="fill"></div>';
            el.appendChild(p);
            fill = el.querySelector('.progress .fill'); 
        }

        fill.style.width = pct + '%';
        updateOverallProgress();
    }

    viewport.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest('.node')) return;
        isPanning = true; panStart = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
        try { viewport.setPointerCapture(e.pointerId); } catch(_) {}
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.overflow = 'visible';
        svg.style.pointerEvents = 'none';
        viewport.classList.add('grabbing');
    });

    viewport.addEventListener('pointermove', (e) => {
        if(!isPanning) return;
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        panStart.x = e.clientX; panStart.y = e.clientY;
        translateX += dx; translateY += dy;
        updateTransform();
    });

    viewport.addEventListener('pointerup', (e) => {
        if(!isPanning) return;
        isPanning = false;
        try { if (panStart.pointerId) viewport.releasePointerCapture(panStart.pointerId); } catch(_) {}
        viewport.classList.remove('grabbing');
    });

    viewport.addEventListener('pointercancel', (e) => {
        if(!isPanning) return;
        isPanning = false;
        try { if (panStart.pointerId) viewport.releasePointerCapture(panStart.pointerId); } catch(_) {}
        viewport.classList.remove('grabbing');
    });

    function updateTransform(){
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const wheel = -e.deltaY;
        const factor = Math.exp(wheel * 0.0012);
        const newScale = Math.min(3, Math.max(0.25, scale * factor));
        const cx = (mx - translateX) / scale;
        const cy = (my - translateY) / scale;
        translateX = mx - cx * newScale;
        translateY = my - cy * newScale;
        scale = newScale;
        updateTransform();
    }, { passive:false });

    requestAnimationFrame(() => {
        updateTransform();
        renderConnections();
    });

    const grid = document.createElement('div');
    grid.id = 'grid';
    viewport.appendChild(grid);

    Object.assign(grid.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '0',
        backgroundImage: `
            linear-gradient(to right, var(--grid-minor) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-minor) 1px, transparent 1px),
            linear-gradient(to right, var(--grid-major) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-major) 1px, transparent 1px)
        `,
        backgroundSize: `
            40px 40px,
            40px 40px,
            200px 200px,
            200px 200px
        `,
        backgroundPosition: '0 0, 0 0, 0 0, 0 0'
    });

    canvas.style.position = 'absolute';
    canvas.style.zIndex = '1';
    svg.style.position = 'absolute';
    svg.style.zIndex = '2';

    function updateTransform(){
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        const minor = 40 * scale;
        const major = minor * 5;

        const ox = translateX % minor;
        const oy = translateY % minor;
        const Ox = translateX % major;
        const Oy = translateY % major;

        grid.style.backgroundSize = `
            ${minor}px ${minor}px,
            ${minor}px ${minor}px,
            ${major}px ${major}px,
            ${major}px ${major}px
        `;

        grid.style.backgroundPosition = `
            ${ox}px ${oy}px,
            ${ox}px ${oy}px,
            ${Ox}px ${Oy}px,
            ${Ox}px ${Oy}px
        `;

        requestAnimationFrame(renderConnections);
    }


    loadSavedRoadmap();
})();

(function(){
    const toggle=document.getElementById('menu_toggle'), menu=document.getElementById('site_menu');
    const themeBtn = document.getElementById('theme_toggle');

    function applyTheme(t){
        document.body.classList.toggle('light', t==='light');
        document.body.classList.toggle('dark', t==='dark');
        localStorage.setItem('theme', t);
        if(themeBtn) themeBtn.textContent = t==='dark' ? 'Light' : 'Dark';
    }

    const saved = localStorage.getItem('theme') || 'dark'; applyTheme(saved);

    if (toggle && menu) {
    toggle.addEventListener('click', ()=>{ menu.classList.toggle('open');
        menu.setAttribute('aria-hidden', menu.classList.contains('open')?'false':'true');
    });
    
    document.addEventListener('click', e=>{
        if(!menu.contains(e.target)&& e.target!==toggle){
            menu.classList.remove('open');
            menu.setAttribute('aria-hidden','true'); }});
    
            document.addEventListener('keydown', e=>{
                if (e.key==='Escape') {
                    menu.classList.remove('open');
                    menu.setAttribute('aria-hidden','true');
                }
            });
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.body.classList.contains('light') ? 'light' : 'dark';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }
})();