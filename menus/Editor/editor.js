const workspace = document.getElementById('workspace');
const viewport = document.getElementById('viewport');
const editor = document.getElementById('selected_node_editing');

let selectedNode = null;
let nodeId = 0;

function createNode(name, desc, x = 50, y = 50, parent = null, id = null, tasks = []) {
    const node = document.createElement('div');
    node.className = 'node';

    if (id !== null && id !== undefined) {
        node.dataset.id = String(id);
        const numeric = parseInt(id, 10);
        if (!isNaN(numeric)) nodeId = Math.max(nodeId, numeric + 1);
    } else {
        node.dataset.id = nodeId++;
    }
    node.dataset.name = name || '';
    node.dataset.desc = desc || '';

    if (parent) {
        node.dataset.parent = typeof parent === 'string' ? parent : parent.dataset.id;
    } else {
        node.dataset.parent = '';
    }
    node.dataset.tasks = JSON.stringify(tasks || []);
    node.style.left = (x || 0) + 'px';
    node.style.top = (y || 0) + 'px';
    node.innerHTML = `<div class="node_title">${name}</div><div class="progress"><div class="fill"></div></div>`;
    const titleEl = node.querySelector('.node_title');
    if (titleEl) {
        titleEl.style.fontWeight='600';
        titleEl.style.whiteSpace='nowrap';
        titleEl.style.overflow='hidden';
        titleEl.style.textOverflow='ellipsis';
    }

    viewport.appendChild(node);
    renderConnections();
    updateNodeProgress(node);
    return node;
}

document.getElementById('add_node_button').onclick = () => {
    const name = add_node_name.value.trim();
    if (!name) return;

    const node = createNode(name, add_node_desc.value, 60 + Math.random()*200, 60 + Math.random()*200);
    selectNode(node);
};

document.getElementById('add_node_child_button').onclick = () => {
    if (!selectedNode) return;

    const name = add_node_child_name.value.trim();
    if (!name) return;
    const node = createNode(name, add_node_child_desc.value, 60, 60, selectedNode);
    placeChildNearParent(selectedNode, node);
    renderConnections();
    selectNode(node);
};

function selectNode(node) {
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    selectedNode = node;
    node.classList.add('selected');

    add_node_name.value = node.dataset.name;
    add_node_desc.value = node.dataset.desc;
    editor.classList.add('shown');
    renderTasksForSelected();
}

workspace.addEventListener('click', e => {
    if (!e.target.classList.contains('node')) {
        clearSelection();
        return;
    }
    selectNode(e.target);
});

function clearSelection() {
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    selectedNode = null;
    editor.classList.remove('shown');
    add_node_name.value = '';
    add_node_desc.value = '';
}

add_node_name.oninput = e => {
    if (!selectedNode) return;
    selectedNode.dataset.name = e.target.value;
    const title = selectedNode.querySelector('.node_title');
    if(title) title.textContent = e.target.value; else selectedNode.textContent = e.target.value;
};

add_node_desc.oninput = e => {
    if (!selectedNode) return;
    selectedNode.dataset.desc = e.target.value;
};

document.getElementById('delete_node').onclick = () => {
    if (!selectedNode) return;
    selectedNode.remove();
    clearSelection();
    renderConnections();
};

function getTasks(node) {
    try {
        return JSON.parse(node.dataset.tasks || '[]');
    } catch (e) {
        return [];
    }
}

function updateNodeProgress(node){
    if (!node) return;
    const tasks = getTasks(node) || [];
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pct = total ? Math.round(100 * done / total) : 0;
    let fill = node.querySelector('.progress .fill');
    if (!fill) {
        let p = document.createElement('div');
        p.className='progress';
        p.innerHTML = '<div class="fill"></div>';
        node.appendChild(p);
        fill = node.querySelector('.progress .fill');
    }
    fill.style.width = pct + '%';
}

function saveTasks(node, tasks) {
    node.dataset.tasks = JSON.stringify(tasks || []);
}

function renderTasksForSelected() {
    const container = document.getElementById('previous_task');
    container.innerHTML = '';
    if (!selectedNode) {
        container.textContent = 'No node selected.';
        return;
    }
    const tasks = getTasks(selectedNode);
    if (!tasks.length) {
        container.textContent = 'No tasks.';
        updateNodeProgress(selectedNode);
        return;
    }

    tasks.forEach((t, idx) => {
        const wrap = document.createElement('div');
        wrap.style.border = '1px solid rgba(255,255,255,0.04)';
        wrap.style.padding = '6px';
        wrap.style.marginBottom = '6px';
        wrap.style.display = 'flex';
        wrap.style.gap = '8px';
        wrap.style.alignItems = 'flex-start';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!t.completed;
        cb.addEventListener('change', () => {
            const arr = getTasks(selectedNode);
            arr[idx].completed = cb.checked;
            saveTasks(selectedNode, arr);
            if (cb.checked) wrap.classList.add('completed');
            else wrap.classList.remove('completed');
            updateNodeProgress(selectedNode);
        });
        wrap.appendChild(cb);

        const content = document.createElement('div');
        content.style.flex = '1';
        const title = document.createElement('div');
        if (t.link) {
            const a = document.createElement('a');
            a.href = t.link;
            a.textContent = t.name || t.link;
            a.target = '_blank';
            a.style.color = 'var(--text)';
            title.appendChild(a);
        } else {
            title.textContent = t.name || '(no name)';
        }
        content.appendChild(title);

        if (t.desc) {
            const d = document.createElement('div');
            d.textContent = t.desc;
            d.style.fontSize = '12px';
            d.style.color = 'var(--muted)';
            content.appendChild(d);
        }

        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.onclick = () => {
            const arr = getTasks(selectedNode);
            arr.splice(idx, 1);
            saveTasks(selectedNode, arr);
            renderTasksForSelected();
            updateNodeProgress(selectedNode);
        };

        wrap.appendChild(content);
        wrap.appendChild(btn);

        if (t.completed) wrap.classList.add('completed');
        container.appendChild(wrap);
    });
    updateNodeProgress(selectedNode);
}

document.getElementById('add_task_button').onclick = () => {
    if (!selectedNode) return;
    const name = _add_task_name.value.trim();
    const link = _add_task_link.value.trim();
    const desc = _add_task_desc.value.trim();
    if (!name && !link && !desc) return;

    const tasks = getTasks(selectedNode);
    tasks.push({ name, link, desc, completed: false });
    saveTasks(selectedNode, tasks);

    _add_task_name.value = '';
    _add_task_link.value = '';
    _add_task_desc.value = '';

    renderTasksForSelected();
    updateNodeProgress(selectedNode);
};

document.getElementById('export_roadmap').onclick = () => {
    exportRoadmap();
};

function exportRoadmap() {
    const nodes = viewport.querySelectorAll('.node');
    const map = {};
    nodes.forEach(n => {
        const id = n.dataset.id;
        const name = n.dataset.name || '';
        const desc = n.dataset.desc || '';
        const parent = n.dataset.parent || '';
        const tasks = getTasks(n);
        const left = parseFloat(n.style.left) || n.offsetLeft || 0;
        const top = parseFloat(n.style.top) || n.offsetTop || 0;
        map[id] = {
            id,
            name,
            desc,
            parent: parent || null,
            tasks: tasks || [],
            childs: [],
            position: { x: left, y: top }
        };
    });

    Object.values(map).forEach(n => {
        if (n.parent && map[n.parent]) {
            map[n.parent].childs.push(n.id);
        }
    });

    const out = {
        exportedAt: new Date().toISOString(),
        scale: scale,
        translate: { x: tx, y: ty },
        nodes: map
    };

    const json = JSON.stringify(out, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

document.getElementById('import_roadmap').addEventListener('click', () => {
    const inp = document.getElementById('import_file_input');
    if (inp) inp.click();
});

document.getElementById('import_file_input').addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            importRoadmap(json);
        } catch (err) {
            alert('Invalid JSON file');
        }
    };
    r.readAsText(f);
    ev.target.value = '';
});

document.addEventListener('dragover', (e) => { e.preventDefault(); });
document.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
        try {
            const json = JSON.parse(ev.target.result);
            importRoadmap(json);
        } catch (err) {
            alert('Invalid JSON file');
        }
    };
    r.readAsText(f);
});

function importRoadmap(obj) {
    if (!obj || !obj.nodes) {
        alert('No roadmap data found in file');
        return;
    }
    viewport.querySelectorAll('.node').forEach(n => n.remove());
    const nodes = obj.nodes;
    const created = {};
    Object.values(nodes).forEach(n => {
        const pos = (n.position && typeof n.position === 'object') ? n.position : { x: 50, y: 50 };
        const tasks = n.tasks || [];
        const nodeEl = createNode(n.name || '', n.desc || '', pos.x, pos.y, null, n.id, tasks);
        created[String(n.id)] = nodeEl;
    });
    Object.values(nodes).forEach(n => {
        if (n.parent && created[n.parent]) {
            created[n.id].dataset.parent = String(n.parent);
        }
    });
    renderConnections();
    if (typeof obj.scale === 'number') scale = obj.scale;
    if (obj.translate) {
        tx = obj.translate.x || 0;
        ty = obj.translate.y || 0;
    }
    updateViewportTransform();
}

function renderConnections() {
    const svg = document.getElementById('connections');
    if (!svg) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const nodes = viewport.querySelectorAll('.node');
    nodes.forEach(n => {
        const pid = n.dataset.parent;
        if (!pid) return;
        const parent = viewport.querySelector(`[data-id="${pid}"]`);
        if (!parent) return;

        const svgRect = svg.getBoundingClientRect();
        const nRect = n.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        svg.setAttribute('viewBox', `0 0 ${Math.round(svgRect.width)} ${Math.round(svgRect.height)}`);

        const nx = (nRect.left + nRect.width / 2) - svgRect.left;
        const ny = (nRect.top + nRect.height / 2) - svgRect.top;
        const px = (parentRect.left + parentRect.width / 2) - svgRect.left;
        const py = (parentRect.top + parentRect.height / 2) - svgRect.top;

        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1', px);
        line.setAttribute('y1', py);
        line.setAttribute('x2', nx);
        line.setAttribute('y2', ny);
        line.setAttribute('stroke', 'var(--line)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('marker-end', 'url(#arrow)');
        svg.appendChild(line);
    });
}

let scale = 1;
let tx = 0;
let ty = 0;
function updateViewportTransform() {
    viewport.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    requestAnimationFrame(renderConnections);
}

workspace.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = workspace.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.3, scale + delta), 3);

    const vx = (cx - tx) / scale;
    const vy = (cy - ty) / scale;

    tx = cx - vx * newScale;
    ty = cy - vy * newScale;

    scale = newScale;
    updateViewportTransform();
}, { passive: false });

let isPanning = false;
let isDraggingNode = false;
let dragNode = null;
let pointerStart = { x: 0, y: 0 };
let panStart = { x: 0, y: 0 };
let nodeStart = { x: 0, y: 0 };

workspace.addEventListener('pointerdown', e => {
    if (e.target.closest('#add_node_templet')) return;

    if (e.target.classList && e.target.classList.contains('node')) {
        isDraggingNode = true;
        dragNode = e.target;
        dragNode.setPointerCapture(e.pointerId);
        pointerStart.x = e.clientX;
        pointerStart.y = e.clientY;
        nodeStart.x = parseFloat(dragNode.style.left) || dragNode.offsetLeft || 0;
        nodeStart.y = parseFloat(dragNode.style.top) || dragNode.offsetTop || 0;
        selectNode(dragNode);
        document.body.style.cursor = 'grabbing';
        return;
    }

    isPanning = true;
    pointerStart.x = e.clientX;
    pointerStart.y = e.clientY;
    panStart.x = tx;
    panStart.y = ty;
    document.body.style.cursor = 'grabbing';
});

workspace.addEventListener('pointermove', e => {
    if (isDraggingNode && dragNode) {
        const dx = (e.clientX - pointerStart.x) / scale;
        const dy = (e.clientY - pointerStart.y) / scale;
        dragNode.style.left = (nodeStart.x + dx) + 'px';
        dragNode.style.top = (nodeStart.y + dy) + 'px';
        renderConnections();
        return;
    }

    if (!isPanning) return;
    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    tx = panStart.x + dx;
    ty = panStart.y + dy;
    updateViewportTransform();
});

workspace.addEventListener('pointerup', e => {
    if (isDraggingNode && dragNode) {
        try { dragNode.releasePointerCapture(e.pointerId); } catch (e) {}
    }
    isDraggingNode = false;
    dragNode = null;
    isPanning = false;
    document.body.style.cursor = '';
    renderConnections();
});

workspace.addEventListener('pointercancel', () => {
    isDraggingNode = false;
    dragNode = null;
    isPanning = false;
    document.body.style.cursor = '';
});

function placeChildNearParent(parentNode, childNode) {
    const count = parseInt(parentNode.dataset.childCount || '0', 10);
    const gapX = 200;
    const gapY = 30;
    const childHeight = childNode.offsetHeight || 60;
    const x = (parseFloat(parentNode.style.left) || parentNode.offsetLeft) + gapX;
    const y = (parseFloat(parentNode.style.top) || parentNode.offsetTop) + (count * (childHeight + gapY));
    childNode.style.left = x + 'px';
    childNode.style.top = y + 'px';
    parentNode.dataset.childCount = (count + 1).toString();
    renderConnections();
}

const grid = document.getElementById('grid');

function updateGrid(){
    const major = 100 * scale;
    const minor = 20 * scale;

    grid.style.backgroundSize = `
        ${major}px ${major}px,
        ${major}px ${major}px,
        ${minor}px ${minor}px,
        ${minor}px ${minor}px
    `;

    grid.style.backgroundPosition = `
        ${tx}px ${ty}px,
        ${tx}px ${ty}px,
        ${tx}px ${ty}px,
        ${tx}px ${ty}px
    `;
}

updateGrid();

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