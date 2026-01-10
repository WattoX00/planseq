const windowEl = document.getElementById("macos-window");
const expandBtn = document.getElementById("expand-btn");

expandBtn.addEventListener("click", () => {
windowEl.classList.toggle("expanded");
});


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