import {
  database,
  ref,
  get
} from './main.js';




const servicosRef = ref(database, 'postagens');
const container = document.getElementById('all-services');

// Exibe o loader
container.innerHTML = `
  <div id="loading2" class="d-flex justify-content-center align-items-center vh-100">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Carregando...</span>
    </div>
  </div>
`;

let todosServicos = [];
let categoriasUnicas = new Set();

// Carrega os dados
get(servicosRef)
  .then((snapshot) => {
    todosServicos = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const servico = childSnapshot.val();
        servico.id = childSnapshot.key;
        todosServicos.push(servico);
        
        // Adiciona categoria ao conjunto de categorias únicas
        if (servico.categoria) {
          categoriasUnicas.add(servico.categoria);
        }
      });

      // Preenche o datalist e o select com as categorias
      populateCategoryFilters();
      
      // Renderiza todos os serviços inicialmente
      renderizarServicos(todosServicos);
      
      // Adiciona event listeners para os filtros
      setupFilterListeners();
    } else {
      container.innerHTML = `<p class="text-center mt-5">Nenhuma postagem encontrada.</p>`;
    }
  })
  .catch((error) => {
    console.error("Erro ao carregar postagens:", error);
    container.innerHTML = `<p class="text-center mt-5 text-danger">Erro ao carregar postagens.</p>`;
  });

// Preenche os filtros de categoria
function populateCategoryFilters() {
  const datalist = document.getElementById('categoriasList');
  const select = document.getElementById('categoryFilter');
  
  // Ordena as categorias alfabeticamente
  const categoriasOrdenadas = Array.from(categoriasUnicas).sort();
  
  categoriasOrdenadas.forEach(categoria => {
    // Adiciona ao datalist
    const optionDatalist = document.createElement('option');
    optionDatalist.value = categoria;
    datalist.appendChild(optionDatalist);
    
    // Adiciona ao select
    const optionSelect = document.createElement('option');
    optionSelect.value = categoria;
    optionSelect.textContent = categoria;
    select.appendChild(optionSelect);
  });
}

// Configura os listeners para os filtros
function setupFilterListeners() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  
  searchInput.addEventListener('input', filterServices);
  categoryFilter.addEventListener('change', filterServices);
  setFilterFromURL();
  
}

// Filtra os serviços com base na pesquisa e categoria
function filterServices() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter').value;
  
  const filtered = todosServicos.filter(servico => {
    const matchesSearch = servico.nome.toLowerCase().includes(searchTerm) || 
                         (servico.texto && servico.texto.toLowerCase().includes(searchTerm));
    
    const matchesCategory = !selectedCategory || servico.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  renderizarServicos(filtered);
}
// Função para renderizar os cards
function renderizarServicos(servicos) {
  container.innerHTML = ''; // limpa o loading

  servicos.forEach(servico => {
    const card = document.createElement("div");
    card.className = "service-card";

    card.innerHTML = `
      <div class="service-icon">
        <div class="service-icon-image">
        <img src="${servico.urlImagem}" alt="${servico.nome}"> class="card-img-top" style="height: 300px; object-fit: cover;">
        </div>
      </div>
      <h3>${servico.nome}</h3>
      <p style="margin-bottom: 20px;">${servico.resumo || 'Sem resumo disponível.'}</p>
      <a href="servicosad.html?servico=${encodeURIComponent(servico.nome)}" class="buy-btn">Ver</a>
    `;
    
    container.appendChild(card);

    const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, index) => {
      setTimeout(() => {
          card.style.opacity = '1';
          card.classList.add('animated');
      }, index * 500);
    });
  });
}

function setFilterFromURL() {
  // Obtém o parâmetro da URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoriaURL = urlParams.get('categoria');
  
  if (!categoriaURL) return;

  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;

  // Verifica se o valor existe nas opções do select
  const optionExists = Array.from(categoryFilter.options)
      .some(option => option.value === categoriaURL);
  
  if (optionExists) {
      categoryFilter.value = categoriaURL;
      
      // Dispara o evento change para aplicar o filtro
      const event = new Event('change');
      categoryFilter.dispatchEvent(event);
  } else {
      console.log(`Categoria "${categoriaURL}" não encontrada nas opções do filtro`);
  }
}





