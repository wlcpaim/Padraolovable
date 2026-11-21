// wlc.db service emulation
window.wlcDb = {
  collections: {},
  collection(name) {
    if (!this.collections[name]) this.collections[name] = [];
    return {
      async create(item) {
        const entry = { ...item, id: Date.now(), created_at: new Date().toISOString() };
        window.wlcDb.collections[name].push(entry);
        localStorage.setItem(`wlc_${name}`, JSON.stringify(window.wlcDb.collections[name]));
        return entry;
      },
      async list() {
        const stored = localStorage.getItem(`wlc_${name}`);
        return stored ? JSON.parse(stored) : [];
      }
    };
  }
};

// Router
const routes = {
  '/': () => `<h1 class="text-2xl font-bold">Dashboard</h1><p>Bem-vindo ao sistema OMNICHANNEL.</p>`,
  '/loja': () => `<h1 class="text-2xl font-bold">Loja Virtual</h1>`,
  '/pdv': () => `<h1 class="text-2xl font-bold">PDV Operacional</h1>`,
  '/estoque': () => `<h1 class="text-2xl font-bold">Gestão de Estoque</h1>`,
  '/funil': () => `<h1 class="text-2xl font-bold">Funil de Vendas</h1>`
};

function navigate(path) {
  const view = document.getElementById('view');
  if (routes[path]) {
    view.innerHTML = routes[path]();
  }
}

// Shell init
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="p-6 font-bold text-xl border-b border-border">WLC.IA</div>
    <nav class="p-4 space-y-2">
      <button onclick="navigate('/')" class="w-full text-left p-2 hover:bg-surface rounded">Dashboard</button>
      <button onclick="navigate('/loja')" class="w-full text-left p-2 hover:bg-surface rounded">Loja</button>
      <button onclick="navigate('/pdv')" class="w-full text-left p-2 hover:bg-surface rounded">PDV</button>
      <button onclick="navigate('/estoque')" class="w-full text-left p-2 hover:bg-surface rounded">Estoque</button>
      <button onclick="navigate('/funil')" class="w-full text-left p-2 hover:bg-surface rounded">Funil</button>
    </nav>
  `;
  navigate('/');
});
