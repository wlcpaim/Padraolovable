// wlc.db robust service & local state manager
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Smartwatch Pro Ultra', price: 899.90, category: 'Eletrônicos', stock: 18, minStock: 5, barcode: '789100100001', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Fone Bluetooth Noise Canceling', price: 450.00, category: 'Áudio', stock: 3, minStock: 5, barcode: '789100100002', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Teclado Mecânico RGB Pro', price: 320.00, category: 'Periféricos', stock: 12, minStock: 4, barcode: '789100100003', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Mouse Ergonômico Wireless', price: 189.90, category: 'Periféricos', stock: 2, minStock: 6, barcode: '789100100004', image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'Monitor 4K Ultra Wide 27"', price: 2199.00, category: 'Monitores', stock: 7, minStock: 2, barcode: '789100100005', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80' }
];

const INITIAL_DEALS = [
  { id: 101, title: 'Implantação ERP - TechCorp', client: 'Carlos Silva', stage: 'lead', value: 4500.00 },
  { id: 102, title: 'Kit Home Office 10x', client: 'Ana Souza', stage: 'contact', value: 12500.00 },
  { id: 103, title: 'Upgrade Servidores Cloud', client: 'Marcos Oliveira', stage: 'proposal', value: 8900.00 },
  { id: 104, title: 'Licenças Enterprise SaaS', client: 'Beatriz Lima', stage: 'won', value: 15000.00 }
];

window.wlcDb = {
  collections: {},
  collection(name) {
    if (!this.collections[name]) {
      const stored = localStorage.getItem(`wlc_${name}`);
      if (stored) {
        try { this.collections[name] = JSON.parse(stored); } catch(e) { this.collections[name] = null; }
      }
      if (!this.collections[name] || this.collections[name].length === 0) {
        if (name === 'products') this.collections[name] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
        else if (name === 'deals') this.collections[name] = JSON.parse(JSON.stringify(INITIAL_DEALS));
        else if (name === 'sales') this.collections[name] = [
          { id: 1, channel: 'PDV', total: 1349.90, items: 2, date: new Date(Date.now() - 3600000 * 4).toISOString(), payment: 'PIX' },
          { id: 2, channel: 'Loja Virtual', total: 450.00, items: 1, date: new Date(Date.now() - 3600000 * 24).toISOString(), payment: 'Cartão' }
        ];
        else this.collections[name] = [];
        localStorage.setItem(`wlc_${name}`, JSON.stringify(this.collections[name]));
      }
    }
    return {
      async list() {
        const stored = localStorage.getItem(`wlc_${name}`);
        if (stored) window.wlcDb.collections[name] = JSON.parse(stored);
        return window.wlcDb.collections[name] || [];
      },
      async create(item) {
        const list = await this.list();
        const entry = { ...item, id: item.id || Date.now(), created_at: new Date().toISOString() };
        list.unshift(entry);
        window.wlcDb.collections[name] = list;
        localStorage.setItem(`wlc_${name}`, JSON.stringify(list));
        return entry;
      },
      async update(id, updatedData) {
        const list = await this.list();
        const index = list.findIndex(i => i.id == id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updatedData };
          window.wlcDb.collections[name] = list;
          localStorage.setItem(`wlc_${name}`, JSON.stringify(list));
          return list[index];
        }
        return null;
      }
    };
  }
};

// Global State
let cart = [];
let pdvCart = [];
let currentView = 'dashboard';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'loja', label: 'Loja Virtual', icon: '🛍️' },
  { id: 'pdv', label: 'PDV Presencial', icon: '🧮' },
  { id: 'estoque', label: 'Estoque & Inventário', icon: '📦' },
  { id: 'funil', label: 'Funil & CRM', icon: '🎯' }
];

function initShell() {
  const navContainer = document.getElementById('nav-links');
  navContainer.innerHTML = navItems.map(item => `
    <button onclick="switchView('${item.id}')" id="nav-${item.id}" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === item.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'text-muted hover:text-text hover:bg-surface-hover/60'}">
      <span class="text-base">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');
  renderCurrentView();
}

function switchView(viewId) {
  currentView = viewId;
  document.getElementById('view-title').textContent = navItems.find(i => i.id === viewId)?.label || 'Omnichannel';
  initShell();
}

async function renderCurrentView() {
  const container = document.getElementById('view-container');
  container.innerHTML = `<div class="flex items-center justify-center h-64 text-muted animate-pulse font-mono text-sm">Carregando módulo WLC.IA...</div>`;
  
  try {
    if (currentView === 'dashboard') await renderDashboard(container);
    else if (currentView === 'loja') await renderLoja(container);
    else if (currentView === 'pdv') await renderPDV(container);
    else if (currentView === 'estoque') await renderEstoque(container);
    else if (currentView === 'funil') await renderFunil(container);
  } catch(e) {
    container.innerHTML = `<div class="p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400">Erro ao carregar módulo: ${e.message} <button onclick="renderCurrentView()" class="ml-4 px-3 py-1 bg-red-500/20 rounded text-xs">Tentar novamente</button></div>`;
  }
}

// 1. DASHBOARD
async function renderDashboard(container) {
  const sales = await window.wlcDb.collection('sales').list();
  const products = await window.wlcDb.collection('products').list();
  const deals = await window.wlcDb.collection('deals').list();

  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalOrders = sales.length;
  const avgTicket = totalOrders ? totalRevenue / totalOrders : 0;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  container.innerHTML = `
    <div class="space-y-6 max-w-7xl mx-auto pb-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm">
          <p class="text-xs text-muted font-medium">Faturamento Total</p>
          <h3 class="text-2xl font-bold font-mono mt-2 text-text">R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
          <span class="text-xs text-emerald-400 font-mono mt-2 inline-block">↑ 12.4% vs mês anterior</span>
        </div>
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm">
          <p class="text-xs text-muted font-medium">Pedidos Realizados</p>
          <h3 class="text-2xl font-bold font-mono mt-2 text-text">${totalOrders}</h3>
          <span class="text-xs text-emerald-400 font-mono mt-2 inline-block">Loja & PDV integrados</span>
        </div>
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm">
          <p class="text-xs text-muted font-medium">Ticket Médio</p>
          <h3 class="text-2xl font-bold font-mono mt-2 text-text">R$ ${avgTicket.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
          <span class="text-xs text-primary font-mono mt-2 inline-block">Estável</span>
        </div>
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm">
          <p class="text-xs text-muted font-medium">Alertas de Estoque</p>
          <h3 class="text-2xl font-bold font-mono mt-2 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}">${lowStockCount}</h3>
          <span class="text-xs text-muted font-mono mt-2 inline-block">Itens críticos/baixos</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-surface border border-border p-6 rounded-2xl shadow-sm">
          <h3 class="text-base font-semibold text-text mb-4">Últimas Transações Omnichannel</h3>
          ${sales.length === 0 ? `
            <div class="text-center py-12 text-muted">Nenhuma venda registrada ainda. Realize vendas na Loja ou PDV.</div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-border text-muted font-medium text-xs">
                    <th class="pb-3">ID / Canal</th>
                    <th class="pb-3">Data</th>
                    <th class="pb-3">Pagamento</th>
                    <th class="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/50">
                  ${sales.slice(0, 6).map(s => `
                    <tr class="hover:bg-surface-hover/30">
                      <td class="py-3 font-medium text-text flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${s.channel === 'PDV' ? 'bg-primary' : 'bg-emerald-400'}"></span>
                        #${s.id} (${s.channel})
                      </td>
                      <td class="py-3 text-muted text-xs font-mono">${new Date(s.date || s.created_at).toLocaleString('pt-BR')}</td>
                      <td class="py-3"><span class="px-2 py-1 bg-surface-hover text-xs rounded border border-border">${s.payment || 'PIX'}</span></td>
                      <td class="py-3 text-right font-mono font-medium text-text">R$ ${Number(s.total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 class="text-base font-semibold text-text mb-2">Canal de Vendas & Distribuição</h3>
            <p class="text-xs text-muted mb-6">Comparativo de faturamento entre Loja Virtual e PDV Presencial.</p>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span>PDV Presencial</span>
                  <span class="font-mono text-primary">65%</span>
                </div>
                <div class="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full" style="width: 65%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span>Loja Virtual (E-commerce)</span>
                  <span class="font-mono text-emerald-400">35%</span>
                </div>
                <div class="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-400 rounded-full" style="width: 35%"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 p-4 bg-surface-hover/30 border border-border/50 rounded-xl">
            <p class="text-xs font-semibold text-text">Dica de Gestão WLC.IA</p>
            <p class="text-xs text-muted mt-1">O estoque é abatido instantaneamente em ambos os canais sem risco de overselling.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 2. LOJA VIRTUAL
async function renderLoja(container) {
  const products = await window.wlcDb.collection('products').list();
  
  container.innerHTML = `
    <div class="max-w-7xl mx-auto pb-12 space-y-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border p-4 rounded-2xl">
        <div class="relative w-full sm:w-96">
          <input type="text" id="store-search" oninput="filterStoreProducts()" placeholder="Buscar produtos na Loja..." class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary">
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button onclick="toggleCartDrawer()" class="relative px-4 py-2.5 bg-primary text-background font-semibold rounded-xl text-sm hover:bg-primary-hover flex items-center gap-2 active:scale-95 transition">
            <span>🛒 Carrinho</span>
            <span id="cart-badge" class="bg-surface text-text text-xs px-2 py-0.5 rounded-full font-mono">${cart.reduce((a,b)=>a+b.qty,0)}</span>
          </button>
        </div>
      </div>

      <div id="store-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${products.map(p => `
          <div class="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition">
            <div class="h-48 overflow-hidden bg-surface-hover relative">
              <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
              <span class="absolute top-3 left-3 px-2.5 py-1 bg-background/80 backdrop-blur border border-border text-xs rounded-full text-muted font-medium">${p.category}</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h4 class="font-semibold text-text text-base">${p.name}</h4>
                <p class="text-xs text-muted mt-1">Estoque disp: <span class="font-mono ${p.stock <= p.minStock ? 'text-amber-400 font-bold' : 'text-emerald-400'}">${p.stock} un</span></p>
              </div>
              <div class="mt-6 flex items-center justify-between">
                <span class="font-mono text-lg font-bold text-primary">R$ ${p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <button onclick="addToStoreCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''} class="px-4 py-2 bg-surface-hover border border-border hover:border-primary hover:text-primary rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50">
                  ${p.stock <= 0 ? 'Esgotado' : '+ Adicionar'}
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Carrinho Drawer -->
    <div id="cart-drawer" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex justify-end">
      <div class="w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div class="p-5 border-b border-border flex items-center justify-between">
          <h3 class="font-bold text-base text-text">Carrinho de Compras</h3>
          <button onclick="toggleCartDrawer()" class="text-muted hover:text-text">✕</button>
        </div>
        <div id="cart-items" class="flex-1 overflow-y-auto p-5 space-y-4">
          ${renderCartItemsHTML()}
        </div>
        <div class="p-5 border-t border-border bg-surface-hover/20">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-muted">Subtotal</span>
            <span class="font-mono text-text">R$ ${cart.reduce((acc, i) => acc + (i.price * i.qty), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="flex justify-between text-sm mb-4">
            <span class="text-muted">Frete</span>
            <span class="font-mono text-emerald-400">Grátis</span>
          </div>
          <div class="flex justify-between text-base font-bold mb-6 pt-3 border-t border-border">
            <span>Total</span>
            <span class="font-mono text-primary">R$ ${cart.reduce((acc, i) => acc + (i.price * i.qty), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          <button onclick="checkoutStore()" ${cart.length === 0 ? 'disabled' : ''} class="w-full py-3 bg-primary text-background font-semibold rounded-xl text-sm hover:bg-primary-hover transition disabled:opacity-50">
            Finalizar Pedido (PIX / Cartão)
          </button>
        </div>
      </div>
    </div>
  `;
}

async function addToStoreCart(productId) {
  const products = await window.wlcDb.collection('products').list();
  const product = products.find(p => p.id == productId);
  if (!product || product.stock <= 0) return alert('Produto indisponível no estoque.');

  const existing = cart.find(i => i.id == productId);
  if (existing) {
    if (existing.qty + 1 > product.stock) return alert('Quantidade máxima em estoque atingida.');
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCurrentView();
  toggleCartDrawer();
}

function renderCartItemsHTML() {
  if (cart.length === 0) return `<div class="text-center py-20 text-muted">Seu carrinho está vazio.</div>`;
  return cart.map(item => `
    <div class="flex items-center justify-between gap-4 bg-background/50 p-3 rounded-xl border border-border">
      <div>
        <h5 class="text-sm font-semibold text-text">${item.name}</h5>
        <p class="text-xs font-mono text-primary mt-0.5">R$ ${item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})} x ${item.qty}</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="updateCartQty(${item.id}, -1)" class="w-7 h-7 bg-surface border border-border rounded-lg flex items-center justify-center text-xs">-</button>
        <span class="font-mono text-xs">${item.qty}</span>
        <button onclick="updateCartQty(${item.id}, 1)" class="w-7 h-7 bg-surface border border-border rounded-lg flex items-center justify-center text-xs">+</button>
      </div>
    </div>
  `).join('');
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.id == productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id != productId);
  renderCurrentView();
  toggleCartDrawer();
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) drawer.classList.toggle('hidden');
}

async function checkoutStore() {
  if (cart.length === 0) return;
  const products = await window.wlcDb.collection('products').list();
  
  // Abate estoque
  for (const item of cart) {
    const p = products.find(prod => prod.id == item.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
      await window.wlcDb.collection('products').update(p.id, { stock: p.stock });
    }
  }

  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);

  await window.wlcDb.collection('sales').create({
    channel: 'Loja Virtual',
    total,
    items: totalItems,
    payment: 'PIX / Cartão',
    cartSnapshot: [...cart]
  });

  cart = [];
  toggleCartDrawer();
  alert('Pedido realizado com sucesso! Estoque atualizado.');
  renderCurrentView();
}

function filterStoreProducts() {
  // Simples busca dinâmica na tela
  const query = document.getElementById('store-search').value.toLowerCase();
  const cards = document.querySelectorAll('#store-grid > div');
  cards.forEach(card => {
    const title = card.querySelector('h4').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'flex' : 'none';
  });
}

// 3. PDV PRESENCIAL
async function renderPDV(container) {
  const products = await window.wlcDb.collection('products').list();

  container.innerHTML = `
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-surface border border-border p-4 rounded-2xl flex gap-3">
          <input type="text" id="pdv-search" oninput="filterPdvProducts()" placeholder="Buscar por nome ou código de barras..." class="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary">
          <button onclick="openCashModal()" class="px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-xs font-semibold hover:border-primary transition">Caixa</button>
        </div>

        <div id="pdv-products-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          ${products.map(p => `
            <div onclick="addToPdvCart(${p.id})" class="bg-surface border border-border p-4 rounded-2xl cursor-pointer hover:border-primary/50 transition flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-mono text-muted uppercase">${p.category}</span>
                <h5 class="font-semibold text-sm text-text mt-1">${p.name}</h5>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <span class="font-mono font-bold text-primary text-sm">R$ ${p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <span class="text-xs text-muted font-mono">${p.stock} un</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between shadow-sm">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-border">
            <h3 class="font-bold text-base text-text">Cupom Fiscal PDV</h3>
            <span class="text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">Caixa 01</span>
          </div>
          <div id="pdv-cart-list" class="py-4 space-y-3 max-h-80 overflow-y-auto">
            ${pdvCart.length === 0 ? '<div class="text-center py-12 text-muted text-xs">Nenhum item lançado no cupom.</div>' : pdvCart.map(i => `
              <div class="flex items-center justify-between text-sm bg-background/50 p-2.5 rounded-xl border border-border">
                <div>
                  <p class="font-semibold text-text text-xs">${i.name}</p>
                  <p class="text-[11px] font-mono text-muted">R$ ${i.price.toFixed(2)} x ${i.qty}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-primary">R$ ${(i.price * i.qty).toFixed(2)}</span>
                  <button onclick="removeFromPdvCart(${i.id})" class="text-red-400 text-xs px-1.5">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="pt-4 border-t border-border space-y-4">
          <div class="flex justify-between items-center text-lg font-bold">
            <span class="text-sm text-muted">Total a Pagar</span>
            <span class="font-mono text-primary">R$ ${pdvCart.reduce((acc, i) => acc + (i.price * i.qty), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="checkoutPdv('Dinheiro')" class="py-2 bg-surface-hover border border-border rounded-xl text-xs font-semibold hover:border-primary transition">Dinheiro</button>
            <button onclick="checkoutPdv('Cartão')" class="py-2 bg-surface-hover border border-border rounded-xl text-xs font-semibold hover:border-primary transition">Cartão</button>
            <button onclick="checkoutPdv('PIX')" class="py-2 bg-primary text-background rounded-xl text-xs font-bold hover:bg-primary-hover transition">PIX</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function addToPdvCart(productId) {
  const products = await window.wlcDb.collection('products').list();
  const product = products.find(p => p.id == productId);
  if (!product || product.stock <= 0) return alert('Produto sem estoque.');

  const existing = pdvCart.find(i => i.id == productId);
  if (existing) {
    if (existing.qty + 1 > product.stock) return alert('Estoque insuficiente.');
    existing.qty += 1;
  } else {
    pdvCart.push({ ...product, qty: 1 });
  }
  renderCurrentView();
}

function removeFromPdvCart(productId) {
  pdvCart = pdvCart.filter(i => i.id != productId);
  renderCurrentView();
}

async function checkoutPdv(paymentMethod) {
  if (pdvCart.length === 0) return alert('Adicione itens ao cupom antes de finalizar.');
  const products = await window.wlcDb.collection('products').list();

  for (const item of pdvCart) {
    const p = products.find(prod => prod.id == item.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
      await window.wlcDb.collection('products').update(p.id, { stock: p.stock });
    }
  }

  const total = pdvCart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const totalItems = pdvCart.reduce((acc, i) => acc + i.qty, 0);

  await window.wlcDb.collection('sales').create({
    channel: 'PDV',
    total,
    items: totalItems,
    payment: paymentMethod
  });

  pdvCart = [];
  alert(`Venda PDV aprovada via ${paymentMethod}! Comprovante emitido e estoque atualizado.`);
  renderCurrentView();
}

function filterPdvProducts() {
  const query = document.getElementById('pdv-search').value.toLowerCase();
  const grid = document.getElementById('pdv-products-grid');
  if (!grid) return;
  const cards = grid.children;
  for (let card of cards) {
    const title = card.querySelector('h5').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'flex' : 'none';
  }
}

function openCashModal() {
  alert('Caixa 01 Aberto • Fundo de Caixa: R$ 500,00 • Operador: Admin WLC');
}

// 4. ESTOQUE & INVENTÁRIO
async function renderEstoque(container) {
  const products = await window.wlcDb.collection('products').list();

  container.innerHTML = `
    <div class="max-w-7xl mx-auto pb-12 space-y-6">
      <div class="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl">
        <h3 class="font-bold text-sm text-text">Gestão e Auditoria de Estoque</h3>
        <button onclick="openNewProductModal()" class="px-4 py-2 bg-primary text-background font-semibold rounded-xl text-xs hover:bg-primary-hover transition">+ Novo Produto</button>
      </div>

      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-border text-muted font-medium text-xs bg-surface-hover/30">
                <th class="p-4">Produto</th>
                <th class="p-4">Categoria</th>
                <th class="p-4">Código de Barras</th>
                <th class="p-4">Preço</th>
                <th class="p-4">Estoque Atual</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              ${products.map(p => {
                const isCritical = p.stock <= 2;
                const isLow = p.stock <= p.minStock && !isCritical;
                return `
                  <tr class="hover:bg-surface-hover/20">
                    <td class="p-4 font-semibold text-text flex items-center gap-3">
                      <img src="${p.image}" class="w-10 h-10 rounded-lg object-cover bg-surface-hover" alt="">
                      <span>${p.name}</span>
                    </td>
                    <td class="p-4 text-muted text-xs">${p.category}</td>
                    <td class="p-4 font-mono text-xs text-muted">${p.barcode}</td>
                    <td class="p-4 font-mono font-medium text-text">R$ ${p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td class="p-4 font-mono font-bold text-text">${p.stock} un</td>
                    <td class="p-4">
                      <span class="px-2.5 py-1 rounded-full text-xs font-medium ${isCritical ? 'bg-red-500/10 text-red-400 border border-red-500/30' : isLow ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}">
                        ${isCritical ? 'Crítico' : isLow ? 'Baixo' : 'Normal'}
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <button onclick="adjustStock(${p.id})" class="px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-semibold hover:border-primary transition">Ajustar</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function adjustStock(productId) {
  const products = await window.wlcDb.collection('products').list();
  const product = products.find(p => p.id == productId);
  if (!product) return;

  const newQty = prompt(`Ajustar estoque para ${product.name}\nDigite a nova quantidade:`, product.stock);
  if (newQty !== null && !isNaN(newQty)) {
    await window.wlcDb.collection('products').update(productId, { stock: parseInt(newQty) });
    renderCurrentView();
  }
}

async function openNewProductModal() {
  const name = prompt('Nome do Produto:');
  if (!name) return;
  const price = parseFloat(prompt('Preço (R$):', '100.00'));
  const stock = parseInt(prompt('Quantidade em Estoque:', '10'));
  const category = prompt('Categoria:', 'Geral');

  await window.wlcDb.collection('products').create({
    name,
    price: isNaN(price) ? 100 : price,
    stock: isNaN(stock) ? 10 : stock,
    minStock: 3,
    category,
    barcode: '789' + Math.floor(Math.random() * 1000000000),
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80'
  });
  renderCurrentView();
}

// 5. FUNIL DE VENDAS & CRM
async function renderFunil(container) {
  const deals = await window.wlcDb.collection('deals').list();
  const stages = [
    { id: 'lead', label: 'Lead / Contato' },
    { id: 'contact', label: 'Qualificação' },
    { id: 'proposal', label: 'Proposta Enviada' },
    { id: 'won', label: 'Fechado (Ganho)' }
  ];

  container.innerHTML = `
    <div class="max-w-7xl mx-auto pb-12 space-y-6">
      <div class="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl">
        <h3 class="font-bold text-sm text-text">Funil Comercial & Pipeline CRM</h3>
        <button onclick="openNewDealModal()" class="px-4 py-2 bg-primary text-background font-semibold rounded-xl text-xs hover:bg-primary-hover transition">+ Nova Oportunidade</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        ${stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((a, b) => a + Number(b.value), 0);
          return `
            <div class="bg-surface border border-border rounded-2xl p-4 flex flex-col min-h-[500px]">
              <div class="flex items-center justify-between pb-3 border-b border-border mb-4">
                <span class="font-semibold text-xs text-text">${stage.label}</span>
                <span class="text-xs font-mono text-muted bg-surface-hover px-2 py-0.5 rounded-full">${stageDeals.length}</span>
              </div>
              <div class="flex-1 space-y-3">
                ${stageDeals.map(d => `
                  <div class="bg-background/60 border border-border p-3.5 rounded-xl shadow-sm hover:border-primary/50 transition">
                    <h5 class="font-semibold text-xs text-text">${d.title}</h5>
                    <p class="text-[11px] text-muted mt-0.5">Cliente: ${d.client}</p>
                    <div class="mt-3 flex items-center justify-between pt-2 border-t border-border/55">
                      <span class="font-mono text-xs font-bold text-primary">R$ ${Number(d.value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                      <button onclick="advanceDeal(${d.id})" class="text-[10px] text-muted hover:text-text bg-surface-hover px-2 py-1 rounded">Avançar →</button>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="pt-3 border-t border-border mt-3 text-right">
                <span class="text-[11px] font-mono text-muted">Total: <strong class="text-text">R$ ${stageTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function advanceDeal(dealId) {
  const deals = await window.wlcDb.collection('deals').list();
  const deal = deals.find(d => d.id == dealId);
  if (!deal) return;

  const flow = ['lead', 'contact', 'proposal', 'won'];
  const currentIndex = flow.indexOf(deal.stage);
  if (currentIndex !== -1 && currentIndex < flow.length - 1) {
    deal.stage = flow[currentIndex + 1];
    await window.wlcDb.collection('deals').update(dealId, { stage: deal.stage });
    renderCurrentView();
  }
}

async function openNewDealModal() {
  const title = prompt('Título da Oportunidade:');
  if (!title) return;
  const client = prompt('Nome do Cliente:');
  const value = parseFloat(prompt('Valor Estimado (R$):', '5000.00'));

  await window.wlcDb.collection('deals').create({
    title,
    client: client || 'Cliente Anônimo',
    stage: 'lead',
    value: isNaN(value) ? 5000 : value
  });
  renderCurrentView();
}

// Init Shell & App on Load
document.addEventListener('DOMContentLoaded', () => {
  initShell();
});
