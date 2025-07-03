// database.js
import { auth, database, ref, set, push, get, update, remove, child, storageRef, uploadBytes, getDownloadURL, storage } from "./main.js";

// Objeto para armazenar o carrinho
let carrinho = {};

// Carrega o carrinho do localStorage
function carregarCarrinho() {

    const container = document.getElementById('carrinhocontainer');
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }

    if(!container){
     return
    }
    
    atualizarContadorCarrinho();
    atualizarCarrinho();
    const finalizarBtn = document.getElementById('finalizar-carrinho');

    if (finalizarBtn) {
        finalizarBtn.addEventListener('click', function() {
            if (!auth.currentUser) {
                showUserOptions(); // Substitui o SweetAlert por nosso modal
            } else {
                window.location.href = 'entrega.html';
            }
        });
    }
}

function showUserOptions() {
    const userOptionsModal = new bootstrap.Modal(document.getElementById('userOptionsModal'));
    
    // Configura os eventos dos botões
    document.getElementById('loginOptionBtn').onclick = function() {
        sessionStorage.setItem('redirectAfterLogin', 'entrega.html');
        window.location.href = 'login.html';
    };
    
    document.getElementById('registerOptionBtn').onclick = function() {
        sessionStorage.setItem('redirectAfterLogin', 'entrega.html');
        window.location.href = 'cadastro.html';
    };
    
    document.getElementById('guestOptionBtn').onclick = function() {
        userOptionsModal.hide();
        showGuestModal(); // Usa o modal de dados do convidado que já criamos antes
    };
    
    // Mostra o modal
    userOptionsModal.show();
}


// Salva o carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarContadorCarrinho();

}

// Atualiza o contador do carrinho
export function atualizarContadorCarrinho() {
    const contador = document.getElementById('carrinho-contador');
    if(!contador) {

        return;
    }
        const totalItens = Object.values(carrinho).reduce((total, item) => total + item.quantidade, 0);
        contador.textContent = totalItens;

        updateCartFooter();

        
    
}

async function adicionarPersonalizadoAoCarrinho(produtoId) {


    try {
        // Firebase v9: Use ref(database, path) instead of database.ref()
        const produtoRef = ref(database, 'produtos/' + produtoId);
        const snapshot = await get(produtoRef);

        const modalElement = document.getElementById('produtoModal');
        
        if (!snapshot.exists()) {
            console.error("Produto não encontrado!");
            return;
        }

        const produto = snapshot.val();
     
         // Adiciona ao carrinho
         if (carrinho[produtoId]) {
             carrinho[produtoId].quantidade += 1;
         } else {
             carrinho[produtoId] = {
                 id: produtoId,
                 nome: produto.nome,
                 preco: produto.valor,
                 quantidade: 1,
                 imagem: produto.urlImagem,
             };
         }
         
         salvarCarrinho();
        
         
         // Feedback visual
         mostrarToast(`${produto.nome} adicionado ao carrinho!`);
         atualizarCarrinho();
    

    } catch (error) {
        console.error("Erro ao adicionar produto2:", error);
    }
}

function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" style="margin-bottom: 3rem;">
            <div class="toast-header bg-success text-white">
                <strong class="me-auto">Sucesso</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">${mensagem}</div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Adiciona um produto ao carrinho
function adicionarAoCarrinho(produtoId) {
    database.ref('produtos/' + produtoId).once('value')
        .then((snapshot) => {
            const produto = snapshot.val();
            
            if (carrinho[produtoId]) {
                carrinho[produtoId].quantidade += 1;
            } else {
                carrinho[produtoId] = {
                    id: produtoId,
                    nome: produto.nome,
                    preco: produto.valor,
                    quantidade: 1,
                    imagem: produto.urlImagem
                };
            }
            
            salvarCarrinho();
            atualizarCarrinho();
            

             // Feedback visual
             const toast = document.createElement('div');
             toast.className = 'position-fixed bottom-0 end-0 p-3';
             toast.innerHTML = `
                 <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                     <div class="toast-header bg-success text-white">
                         <strong class="me-auto">Sucesso</strong>
                         <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                     </div>
                     <div class="toast-body">
                         ${produto.nome} foi adicionado ao carrinho!
                     </div>
                 </div>
             `;
             document.body.appendChild(toast);
             
             // Remove o toast após 3 segundos
             setTimeout(() => {
                 toast.remove();
             }, 3000);
        });
}

// Remove um item do carrinho
function removerDoCarrinho(produtoId) {
    delete carrinho[produtoId];
    salvarCarrinho();
    atualizarCarrinho();
}

// Atualiza a quantidade de um item no carrinho
function atualizarQuantidade(produtoId, quantidade) {
    if (quantidade < 1) {
        removerDoCarrinho(produtoId);
        return;
    }
    
    carrinho[produtoId].quantidade = quantidade;
    salvarCarrinho();
    atualizarCarrinho();
}

// Atualiza a exibição do carrinho
function atualizarCarrinho() {

    const container = document.getElementById('carrinhocontainer');

    if(!container){
     return
    }
    let html = '';
    let subtotal = 0;
    let total1 = 0;

    const carrinhoItens = document.getElementById('carrinho-itens');
    const carrinhoVazio = document.getElementById('carrinho-vazio');
    const finalizarPedidoBtn = document.getElementById('finalizar-carrinho');
    const subtotalEl = document.getElementById('subtotal');
    
    


    // Verifica se o carrinho está vazio
    if (Object.keys(carrinho).length === 0) {
        carrinhoItens.innerHTML = '';
        carrinhoVazio.classList.add('d-none'); // Mostra "carrinho vazio"
        finalizarPedidoBtn.disabled = true;
        subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        
        
        return;
    }

    // Se o carrinho não estiver vazio
    carrinhoVazio.classList.remove('d-none'); // Esconde "carrinho vazio"
    finalizarPedidoBtn.disabled = false;

    Object.values(carrinho).forEach(item => {
        const itemTotal = item.preco * item.quantidade;
        subtotal += itemTotal;

        html += `
            <div class="row mb-3 align-items-center carrinho-item" data-id="${item.id}">
                <div class="col-md-2">
                    <img src="${item.imagem || 'https://via.placeholder.com/80'}" class="img-fluid rounded" alt="${item.nome}">
                </div>
                <div class="col-md-4">
                    <h6 class="mb-0">${item.nome}</h6>
                    <small class="text-muted">R$ ${item.preco.toFixed(2)}</small>
                </div>
                <div class="col-md-3">
                    <div class="input-group">
                        <button class="btn btn-outline-secondary btn-diminuir" type="button">-</button>
                        <input type="number" class="form-control text-center quantidade-input" value="${item.quantidade}" min="1">
                        <button class="btn btn-outline-secondary btn-aumentar" type="button">+</button>
                    </div>
                </div>
                <div class="col-md-2 text-end">
                    <span class="fw-bold">R$ ${itemTotal.toFixed(2)}</span>
                </div>
                <div class="col-md-1 text-end">
                    <button class="btn btn-sm btn-outline-danger btn-remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <hr>
        `;
    });

    carrinhoItens.innerHTML = html;

    // Atualiza os totais
    const taxaEntrega = 0;
    const total = subtotal + taxaEntrega;

    subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;

    // Adiciona eventos aos botões
    document.querySelectorAll('.btn-diminuir').forEach(button => {
        button.addEventListener('click', (e) => {
            const produtoId = e.target.closest('.carrinho-item').dataset.id;
            const novaQuantidade = carrinho[produtoId].quantidade - 1;
            atualizarQuantidade(produtoId, novaQuantidade);
        });
    });

    document.querySelectorAll('.btn-aumentar').forEach(button => {
        button.addEventListener('click', (e) => {
            const produtoId = e.target.closest('.carrinho-item').dataset.id;
            const novaQuantidade = carrinho[produtoId].quantidade + 1;
            atualizarQuantidade(produtoId, novaQuantidade);
        });
    });

    document.querySelectorAll('.quantidade-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const produtoId = e.target.closest('.carrinho-item').dataset.id;
            const novaQuantidade = parseInt(e.target.value);
            atualizarQuantidade(produtoId, novaQuantidade);
        });
    });

    document.querySelectorAll('.btn-remover').forEach(button => {
        button.addEventListener('click', (e) => {
            const produtoId = e.target.closest('.carrinho-item').dataset.id;
            removerDoCarrinho(produtoId);
        });
    });
}


// Inicializa o carrinho quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinho();
    atualizarContadorCarrinho();
    
    
    if (document.getElementById('carrinho-itens')) {
        atualizarCarrinho();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const carouselInner = document.querySelector('.carousel-inner');
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-button.prev');
    const nextBtn = document.querySelector('.carousel-button.next');
    let currentIndex = 0;
    let intervalId = null;

    // Função para mostrar o item atual
    function showItem(index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    // Função para avançar para o próximo item
    function nextItem() {
        currentIndex = (currentIndex + 1) % items.length;
        showItem(currentIndex);
    }

    // Função para voltar ao item anterior
    function prevItem() {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showItem(currentIndex);
    }

    // Função para iniciar o carrossel automático
    function startAutoCarousel() {
        stopAutoCarousel(); // Para evitar múltiplos intervalos
        intervalId = setInterval(nextItem, 3000); // 3 segundos
    }

    // Função para parar o carrossel automático
    function stopAutoCarousel() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // Event listeners para os botões
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextItem();
            stopAutoCarousel(); // Reinicia o contador ao interagir manualmente
            startAutoCarousel();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevItem();
            stopAutoCarousel(); // Reinicia o contador ao interagir manualmente
            startAutoCarousel();
        });
    }

    // Inicia o carrossel automático
    startAutoCarousel();
// Pausa o carrossel quando o mouse está sobre ele
if (carouselInner) {
    carouselInner.addEventListener('mouseenter', stopAutoCarousel);
    carouselInner.addEventListener('mouseleave', startAutoCarousel);
}
});

// Função para configurar os botões do modal
// Função para configurar os botões do modal
function configurarBotoesModal(precoBase) {
    const modalElement = document.getElementById('produtoModal');
    
    // Configura botões de tamanho
    const tamanhoBtns = modalElement.querySelectorAll('.tamanho-btn');
    tamanhoBtns.forEach(btn => {
        btn.onclick = function() {
            tamanhoBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            atualizarTotalModal(precoBase);
            atualizarRendimento();
        };
    });

    // Configura botões de cobertura
    const coberturaBtns = modalElement.querySelectorAll('.cobertura-btn');
    coberturaBtns.forEach(btn => {
        btn.onclick = function() {
            coberturaBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            atualizarTotalModal(precoBase);
        };
    });

    // Atualiza o total inicial
    atualizarTotalModal(precoBase);
    atualizarRendimento();
}

// Nova função para atualizar o rendimento
function atualizarRendimento() {
    const modalElement = document.getElementById('produtoModal');
    const tamanhoBtnAtivo = modalElement.querySelector('.tamanho-btn.active');
    const rendimentoInfo = document.getElementById('rendimento-info');

    if (!tamanhoBtnAtivo || !rendimentoInfo) return;

    const tamanho = tamanhoBtnAtivo.textContent.trim().toLowerCase();

    if (tamanho.includes('médio')) {
        rendimentoInfo.textContent = "Rende aproximadamente 1000g - 12 pedaços.";
    } else if (tamanho.includes('grande')) {
        rendimentoInfo.textContent = "Rende aproximadamente 1500g - 20 pedaços.";
    } else {
        rendimentoInfo.textContent = ""; // Caso não encontre tamanho
    }
}


function abrirModalProduto(produto) {
    const modal = new bootstrap.Modal(document.getElementById('produtoModal'));

  
    // Preenche os dados do produto
    document.getElementById('modalProdutoImagem').src = produto.urlImagem || 'https://via.placeholder.com/500';
    document.getElementById('modalProdutoNome').textContent = produto.nome;
    document.getElementById('modalProdutoDescricao').textContent = produto.descricao || 'Sem descrição';
    document.getElementById('modalProdutoTotal').textContent = produto.valor || 'Sem Valor';
 

    const coberturaArea = document.getElementById('coberturaArea');
    const tipoCoberturaFixa = document.getElementById('tipoCoberturaFixa');
    const pesonalizapedidot = document.getElementById('pesonalizapedidot');
    const pesonalizapedidoc = document.getElementById('pesonalizapedidoc');
  

    // Configura o botão de adicionar ao carrinho
    document.getElementById('btnAdicionarPersonalizado').onclick = () => {
        adicionarPersonalizadoAoCarrinho(produto.id);
        modal.hide();
    };

    modal.show();
}



// Função para atualizar o total
function atualizarTotalModal(precoBase, permiteCobertura = true) {
    const modalElement = document.getElementById('produtoModal');
    let total = precoBase;

    // Tamanho sempre pode ser alterado
    const tamanhoBtnAtivo = modalElement.querySelector('.tamanho-btn.active');
    const valorTamanho = tamanhoBtnAtivo ? parseFloat(tamanhoBtnAtivo.dataset.valor) : 0;
    total += valorTamanho;

    // Cobertura só se for permitido
    if (permiteCobertura) {
        const coberturaBtnAtivo = modalElement.querySelector('.cobertura-btn.active');
        const valorCobertura = coberturaBtnAtivo ? parseFloat(coberturaBtnAtivo.dataset.valor) : 0;
        total += valorCobertura;
    }

    document.getElementById('modalProdutoTotal').textContent = `R$ ${total.toFixed(2)}`;
}



export async function adicionarProduto(nome, descricao, preco, tipo, subcategoria, permiteVulcao, imagemFile) {
    try {
        // 1. Upload da imagem (se existir)
        let imagemURL = 'https://via.placeholder.com/300x200';
        
        if (imagemFile) {
            const fileRef = storageRef(storage, `produtos/${Date.now()}_${imagemFile.name}`);
            const snapshot = await uploadBytes(fileRef, imagemFile);
            imagemURL = await getDownloadURL(snapshot.ref);
        }

        // 2. Criar referência para o novo produto
        const novoProdutoRef = push(ref(database, 'produtos'));
        
        // 3. Salvar dados do produto
        await set(novoProdutoRef, {
            nome: nome,
            descricao: descricao,
            preco: preco,
            tipo: tipo,
            subcategoria: subcategoria,
            permiteVulcao: permiteVulcao,
            imagem: imagemURL,
            dataCriacao: new Date().toISOString()
        });

        console.log("Produto adicionado com sucesso!");
        carregarProdutos(); // Atualizar a lista de produtos
        
        return novoProdutoRef.key;
    } catch (error) {
        console.error("Erro ao adicionar produto: ", error);
        throw error;
    }
}

// Carrega categorias do Realtime Database
async function carregarCategorias() {
    try {
      const categoriasRef = ref(database, 'categorias');
      const snapshot = await get(categoriasRef);
      const container = document.querySelector('#categorias-container .d-flex');
      
      container.innerHTML = ''; // Remove o spinner
      
      if (snapshot.exists()) {
        // Converte o objeto de categorias em array
        const categorias = Object.entries(snapshot.val()).map(([nome, dados]) => ({
          nome,
          urlImagem: dados.urlImagem
        }));
        
        // Ordena as categorias alfabeticamente
        categorias.sort((a, b) => a.nome.localeCompare(b.nome));
        
        // Cria os cards de categoria
        categorias.forEach(categoria => {
          const card = document.createElement('div');
          card.className = 'categoria-card';
          card.innerHTML = `
            <div>
              <div class="categoria-icon-container">
                <img src="${categoria.urlImagem}" 
                     alt="${categoria.nome}" 
                     class="categoria-icon"
                     onerror="this.src='https://via.placeholder.com/120?text=Imagem'">
              </div>
              <div class="categoria-nome">${categoria.nome}</div>
            </div>
          `;
          
          card.addEventListener('click', () => carregarProdutosPorCategoria(categoria.nome));
          container.appendChild(card);
        });
      } else {
        container.innerHTML = '<p class="text-muted">Nenhuma categoria encontrada</p>';
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      document.querySelector('#categorias-container .d-flex').innerHTML = 
        '<p class="text-danger">Erro ao carregar categorias</p>';
    }
  }


function criarElementoProduto(produto) {
    const div = document.createElement('div');
    div.className = 'col-md-3 col-6 mb-4 p-1';
    div.innerHTML = `
    <div class="card h-100 p-0 produto-card card-fade-in shadow-sm border-0" data-id="${produto.nome}" style="cursor: pointer; border-radius: 12px; overflow: hidden; transition: all 0.3s ease;">
        <div class="position-relative overflow-hidden" style="height: 200px;">
            <img src="${produto.urlImagem}" 
                 class="card-img-top w-100 h-100 p-1" 
                 alt="${produto.nome}"
                 style="object-fit: contain; transition: transform 0.3s ease;">
        </div>
        
        <div class="card-body d-flex flex-column p-1" style="align-items: center;">
        <h5 class="card-title mb-2 fw-semibold" 
        style="font-size: 0.95rem; 
               line-height: 1.3; 
               color: #2c3e50; 
               min-height: 2.6rem; 
               display: flex; 
               justify-content: center; 
               align-items: center;
               text-align: center;
               -webkit-line-clamp: 2;
               display: -webkit-box;
               -webkit-box-orient: vertical;
               overflow: hidden;">
                ${produto.nome}
            </h5>
            
            <div class="mt-auto">
                <div class="align-items-center">
                    <div class="price-container">
                        <span class="h5 mb-3 fw-bold text-primary" style="font-size: 1.1rem;">
                            R$ ${produto.valor}
                        </span>
                    </div>
                    
                    <button class="btn btn-outline-success btn-adicionar rounded-pill px-3 py-1 mt-1 mb-1" 
                            data-id="${produto.nome}"
                            style="border-width: 2px; transition: all 0.3s ease; font-size: 0.85rem;">
                        <i class="fas fa-cart-plus me-1"></i>
                        <span class="d-none d-md-inline">Adicionar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
`;

    // Adicionar efeitos de hover via JavaScript
    const card = div.querySelector('.produto-card');
    const img = div.querySelector('.card-img-top');
    const btn = div.querySelector('.btn-adicionar');

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        img.style.transform = 'scale(1.05)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        img.style.transform = 'scale(1)';
    });

    btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = '#198754';
        btn.style.color = 'white';
        btn.style.borderColor = '#198754';
        btn.style.transform = 'scale(1.05)';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#198754';
        btn.style.borderColor = '#198754';
        btn.style.transform = 'scale(1)';
    });

    
    // Adiciona evento de clique no card
    div.querySelector('.produto-card').addEventListener('click', (e) => {
        // Evita abrir o modal se clicar no botão de adicionar
        if (!e.target.closest('.btn-adicionar')) {
            abrirModalProduto(produto);
        }
    });
    
    // Adiciona evento no botão de adicionar
    div.querySelector('.btn-adicionar').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalProduto(produto);
    });
    
    return div;
}

// Função para editar produto
export async function editarProduto(produtoId, novosDados) {
    try {
        const produtoRef = ref(database, `produtos/${produtoId}`);
        await update(produtoRef, novosDados);
        console.log("Produto atualizado com sucesso!");
        await carregarProdutos();
        return true;
    } catch (error) {
        console.error("Erro ao atualizar produto: ", error);
        return false;
    }
}
// Função para excluir produto
export async function excluirProduto(produtoId) {
    try {
        const produtoRef = ref(database, `produtos/${produtoId}`);
        await remove(produtoRef);
        console.log("Produto excluído com sucesso!");
        await carregarProdutos();
        return true;
    } catch (error) {
        console.error("Erro ao excluir produto: ", error);
        return false;
    }
}
// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar produtos ao iniciar
    if (document.getElementById('produtos-container')) {
        carregarProdutos();
    }
    if (document.getElementById('categorias-container')) {
        carregarCategorias();
    }

    // Delegation para botões editar/excluir
    // Delegation para botões editar/excluir/adicionar ao carrinho
document.addEventListener('click', async (e) => {
    // Lógica para editar produto
    if (e.target.closest('.btn-editar')) {
        const btn = e.target.closest('.btn-editar');
        const produtoId = btn.getAttribute('data-id');
        const novosDados = {
            nome: prompt("Novo nome:", btn.closest('.card').querySelector('.card-title').textContent),
            preco: parseFloat(prompt("Novo preço:", btn.closest('.card').querySelector('.text-primary').textContent.replace('R$ ', '')))
        };
        if (novosDados.nome && novosDados.preco) {
            await editarProduto(produtoId, novosDados);
        }
    }
    
    // Lógica para excluir produto
    if (e.target.closest('.btn-excluir')) {
        const btn = e.target.closest('.btn-excluir');
        const produtoId = btn.getAttribute('data-id');
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            await excluirProduto(produtoId);
        }
    }
    
    // Lógica para adicionar ao carrinho
    if (e.target.closest('.btn-adicionar')) {
        const btn = e.target.closest('.btn-adicionar');
        const produtoId = btn.getAttribute('data-id');
       adicionarAoCarrinho(produtoId);
       
    }
});

// Função para atualizar a contagem de itens no carrinho (opcional)
function atualizarContagemCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    // Atualiza o badge no ícone do carrinho (se existir)
    const badgeCarrinho = document.querySelector('.carrinho-badge');
    if (badgeCarrinho) {
        badgeCarrinho.textContent = totalItens;
        badgeCarrinho.style.display = totalItens > 0 ? 'inline-block' : 'none';
    }
}

// Chama a função para atualizar a contagem quando a página é carregada
document.addEventListener('DOMContentLoaded', atualizarContagemCarrinho);



});


// Adiciona eventos aos botões de tamanho e cobertura
document.addEventListener('DOMContentLoaded', () => {
    // Eventos para os botões de tamanho
    document.querySelectorAll('.tamanho-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tamanho-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const precoBase = parseFloat(document.getElementById('produtoModal').dataset.produtoPreco);
            atualizarTotalModal(precoBase);
        });
    });
    
    // Eventos para os botões de cobertura
    document.querySelectorAll('.cobertura-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.cobertura-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const precoBase = parseFloat(document.getElementById('produtoModal').dataset.produtoPreco);
            atualizarTotalModal(precoBase);
        });
    });
});

  

const mp = new MercadoPago('APP_USR-e862723f-2adf-43f0-85e1-fb57c03371b1', { 
    locale: 'pt-BR'
  });
  
  export async function finalizarPedido(dadosEntrega) {
    try {
        // Verifica se é usuário autenticado ou guest
        let userData = {};
        let userId, username, usertel, usemail;
        
        if (auth.currentUser) {
            // Usuário autenticado
            const userRef = ref(database, `users/${auth.currentUser.uid}`);
            const snapshot = await get(userRef);
            userData = snapshot.val() || {};
            userId = auth.currentUser.uid;
            username = userData.nome || "";
            usertel = userData.telefone || "";
            usemail = userData.email || "";
        } else if (sessionStorage.getItem('guestUser')) {
            // Usuário guest
            const guestUser = JSON.parse(sessionStorage.getItem('guestUser'));
            const telefoneNumerico = guestUser.telefone.replace(/\D/g, '');
            userId = telefoneNumerico;
            username = guestUser.nome;
            usertel = formatarTelefoneWhatsApp(guestUser.telefone);
            usemail = `guest_${telefoneNumerico}@noemail.com`;
            
            // Atualiza/registra o guest no banco de dados
            const guestUserRef = ref(database, `users/${telefoneNumerico}`);
            await set(guestUserRef, {
                nome: guestUser.nome,
                telefone: telefoneNumerico,
                isGuest: true,
                
            });
        } else {
            alert('Por favor, faça login ou informe seus dados para finalizar a compra');
            window.location.href = 'login.html';
            return;
        }

        const cupom = dadosEntrega.cupom;
        const [subtotal, taxaEntrega] = await Promise.all([
            calcularSubtotal(carrinho, dadosEntrega.cupom),
            calcularTaxaEntrega(dadosEntrega, dadosEntrega.cupom)
        ]);

        console.log("Valores reais:", { subtotal, taxaEntrega }); // Agora mostra números
        
        // 1. Criar referência para o novo pedido
        const pedidosRef = ref(database, 'pedidos');
        const novoPedidoRef = push(pedidosRef);
        const pedidoId = novoPedidoRef.key;
        
        // 2. Preparar dados do pedido
        const pedidoData = {
            id: pedidoId,
            userId: userId,
            userType: auth.currentUser ? 'authenticated' : 'guest',
            itens: Object.values(carrinho).map(item => ({
                id: item.id,
                nome: item.nome,
                preco: item.preco,
                quantidade: item.quantidade,
                imagem: item.imagem
            })),
            username: username,
            usertel: usertel,
            usemail: usemail,
            subtotal: subtotal,
            taxaEntrega: taxaEntrega,
            total: subtotal + taxaEntrega,
            status: 'pendente',
            dataCria: new Date().toISOString(),
            paymentStatus: 'pending',
            tipoEntrega: dadosEntrega.tipo,
            dataEntrega: dadosEntrega.data,
            horarioEntrega: dadosEntrega.horario,
            // Adiciona apenas se for entrega
            ...(dadosEntrega.tipo === 'entrega' && {
                enderecoEntrega: dadosEntrega.endereco
            }),
            ...(cupom && { cupomUtilizado: cupom })
        };

        // 3. Salvar pedido no Realtime Database
        await set(novoPedidoRef, pedidoData);


        // 5. Registrar uso do cupom (apenas para usuários autenticados)
        if (auth.currentUser && cupom) {
            registrarUsoCupom(userId, cupom);
        }

        // 6. Iniciar processo de pagamento
        iniciarPagamentoPix(pedidoData);

        return pedidoId; // Retorna o ID do pedido criado

    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        alert('Ocorreu um erro ao processar seu pedido: ' + error.message);
        throw error;
    }
}

async function enviarMensagemPedidoWhatsApp(dados) {
    try {
        // Recupera a URL do bot
        const snapshot = await get(child(ref(database), 'ngrok/url'));
        const botUrl = snapshot.exists() ? snapshot.val() : null;

        if (!botUrl || !dados.telefone) return;

        // Formata o endereço completo se for entrega
        const formatarEndereco = (enderecoObj) => {
            if (!enderecoObj) return '';
            return `
 ${enderecoObj.rua}, ${enderecoObj.numero}
 ${enderecoObj.complemento ? `Complemento: ${enderecoObj.complemento}\n` : ''}
 ${enderecoObj.bairro}
 ${enderecoObj.cidade}
 CEP: ${enderecoObj.cep}`.trim();
        };

        const formatarData = (dataISO) => {
            // Divide a string da data usando o hífen como separador
            const partes = dataISO.split('-');
            
            // Verifica se temos exatamente 3 partes (ano, mês, dia)
            if (partes.length !== 3) {
                console.error('Formato de data inválido. Esperado: aaaa-mm-dd');
                return dataISO; // Retorna o valor original em caso de formato inválido
            }
            
            // Extrai as partes (assumindo o formato aaaa-mm-dd)
            const [ano, mes, dia] = partes;
            
            // Retorna no formato dd/mm/aaaa
            return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        };

        const detalhesEntrega = dados.tipoEntrega === 'entrega' ? 
            `*Tipo:* Entrega\n` +
            `*Data:* ${formatarData(dados.dataEntrega)}\n` +
            `*Horário:* ${dados.horarioEntrega}\n` +
            `🏡 *Endereço:*\n${formatarEndereco(dados.enderecoEntrega)}\n` :
            `*Tipo:* Retirada na loja\n` +
            `*Data:* ${dados.dataEntrega}\n` +
            `*Horário:* ${dados.horarioEntrega}\n`;

        const mensagem = `
👋 Olá *${dados.username}*!

✅ Acabamos de receber o seu pedido *#${dados.pedidoId}*. Aqui está um resumo:

🛒 *Itens do pedido:*
${dados.itens.map(item => `${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}`).join('\n')}

💲 *Valores:*
 Subtotal: R$ ${dados.subtotal.toFixed(2)}
 Taxa de entrega: R$ ${dados.taxaEntrega.toFixed(2)}
 *Total: R$ ${dados.total.toFixed(2)}*

📦 *Detalhes da entrega:*
${detalhesEntrega}
💳 *Pagamento PIX:*
Caso ainda não tenha efetuado o pagamento, aqui está o QR Code:
${dados.qrCode}

🔄 Seu pedido será aprovado *automaticamente* após o pagamento!

A *Le Cake* agradece a preferência!
        `.trim();

        await fetch(`${botUrl}/SEND`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numero: dados.telefone,
                mensagem: mensagem
            })
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem via WhatsApp:', error);
    }
}

async function enviarNotificacaoAdminWhatsApp(pedidoData) {
    try {
        // Recupera a URL do bot
        const snapshot = await get(child(ref(database), 'ngrok/url'));
        const botUrl = snapshot.exists() ? snapshot.val() : null;
        
        if (!botUrl) return;

        // Telefones dos administradores
        const adminPhones = ['555198749302', '555197262249']; // Adicione 55 antes do DDD
        
        // Formatar data para dd/mm/aaaa
        const formatarData = (dataISO) => {
            // Divide a string da data usando o hífen como separador
            const partes = dataISO.split('-');
            
            // Verifica se temos exatamente 3 partes (ano, mês, dia)
            if (partes.length !== 3) {
                console.error('Formato de data inválido. Esperado: aaaa-mm-dd');
                return dataISO; // Retorna o valor original em caso de formato inválido
            }
            
            // Extrai as partes (assumindo o formato aaaa-mm-dd)
            const [ano, mes, dia] = partes;
            
            // Retorna no formato dd/mm/aaaa
            return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        };

        // Formatar lista de itens
        const itensFormatados = pedidoData.itens.map(item => 
            `➡️ ${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}`
        ).join('\n');

        const mensagem = `
🚨 *NOVO PEDIDO RECEBIDO!* 🚨

📋 *Pedido #${pedidoData.id}*
👤 *Cliente:* ${pedidoData.username}
📞 *Telefone:* ${pedidoData.usertel}
${pedidoData.userType === 'guest' ? '👤 (Cliente Guest)' : '👤 (Cliente Cadastrado)'}

📦 *Tipo:* ${pedidoData.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}
📅 *Data:* ${formatarData(pedidoData.dataEntrega)}
⏰ *Horário:* ${pedidoData.horarioEntrega}

${pedidoData.tipoEntrega === 'entrega' ? 
`📍 *Endereço:*
${pedidoData.enderecoEntrega.rua}, ${pedidoData.enderecoEntrega.numero}
${pedidoData.enderecoEntrega.complemento || ''}
${pedidoData.enderecoEntrega.bairro} - ${pedidoData.enderecoEntrega.cidade}
CEP: ${pedidoData.enderecoEntrega.cep}` : ''}

🛒 *Itens:*
${itensFormatados}

💰 *Valor Total:* R$ ${pedidoData.total.toFixed(2)}
${pedidoData.cupomUtilizado ? `🎟️ *Cupom utilizado:* ${pedidoData.cupomUtilizado}` : ''}

⚠️ *Aguardando pagamento* ⚠️
        `.trim();

        // Envia para cada administrador
        for (const phone of adminPhones) {
            await fetch(`${botUrl}/SEND`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    numero: phone,
                    mensagem: mensagem
                })
            });
            // Pequeno delay entre envios para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

    } catch (error) {
        console.error('Erro ao enviar notificação para admin:', error);
    }
}

function formatarTelefoneWhatsApp(telefone) {
    // Remove todos os caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Verifica se já começa com 55 (código do Brasil)
    let numeroFormatado = numeros.startsWith('55') ? numeros : '55' + numeros;
    
    // Se tiver mais de 12 dígitos (55 + DDD + número com 9), remove o 9 extra
    if (numeroFormatado.length > 12) {
        // Padrão: 55 + DDD (2) + 9 + número (8)
        // Queremos remover o 9 após o DDD
        const parteInicial = numeroFormatado.substring(0, 4); // 55 + DDD
        const parteFinal = numeroFormatado.substring(5); // remove o 9
        numeroFormatado = parteInicial + parteFinal;
    }
    
    return numeroFormatado;
}
  

async function iniciarPagamentoPix(pedidoData) {
    console.log(pedidoData);
    try {
        const response = await fetch("https://criarpagamentopix-7k32yr6ooq-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                transaction_amount: pedidoData.total,
                description: "Pagamento do pedido",
                payer: {
                    email: pedidoData.usemail,
                    first_name: pedidoData.username,
                    last_name: "",
                    cpf: "03910759009" // ← Se quiser pegar do pedido, mude aqui também
                }
            })
        });

        const data = await response.json();
        console.log(data);
        if (!data.qr_code || !data.transaction_id) throw new Error("Erro ao gerar pagamento PIX");

        console.log("✅ Código PIX gerado:", data.qr_code);

        const pedidoRef = ref(database, `pedidos/${pedidoData.id}`);
        await update(pedidoRef, {
            qrCode: data.qr_code,
            paymentId: data.transaction_id
        });

        exibirQRCode(data.qr_code, pedidoData.id, parseFloat(pedidoData.total));
        
        // Agora enviamos a mensagem WhatsApp aqui, após ter o QR code
        await enviarMensagemPedidoWhatsApp({
            username: pedidoData.username,
            telefone: pedidoData.usertel,
            itens: pedidoData.itens,
            subtotal: pedidoData.subtotal,
            taxaEntrega: pedidoData.taxaEntrega,
            total: pedidoData.total,
            tipoEntrega: pedidoData.tipoEntrega,
            dataEntrega: pedidoData.dataEntrega,
            horarioEntrega: pedidoData.horarioEntrega,
            enderecoEntrega: pedidoData.enderecoEntrega,
            isGuest: pedidoData.userType === 'guest',
            pedidoId: pedidoData.id,
            qrCode: data.qr_code  // Adicionamos o QR code aqui
        });

        enviarNotificacaoAdminWhatsApp(pedidoData);

        localStorage.removeItem('carrinho');

    } catch (error) {
        console.error("❌ Erro ao iniciar pagamento PIX:", error);
        alert("Erro ao processar pagamento.");
    }
}

async function calcularSubtotal(carrinho, cupom) {
    try {
        if (!carrinho || Object.keys(carrinho).length === 0) return 0;
        
        const itens = Array.isArray(carrinho) ? carrinho : Object.values(carrinho);
        
        const subtotal = itens.reduce((total, item) => {
            const preco = parseFloat(item.preco) || 0;
            const quantidade = parseInt(item.quantidade) || 0;
            return total + (preco * quantidade);
        }, 0);

        // Aplica cupom se existir
        if (cupom) {
            const desconto = await buscarDescontoCupom(cupom, "subtotall");
            return subtotal * (1 - (desconto/100));
        }

        return subtotal;
    } catch (error) {
        console.error("Erro cálculo subtotal:", error);
        return 0;
    }
}

async function calcularTaxaEntrega(dadosEntrega, cupom) {
    try {
        if (dadosEntrega.tipo === "retirada") return 0;
        
        let taxa = dadosEntrega.endereco?.bairro 
            ? ["centenário", "imigrante", "olarias"].includes(dadosEntrega.endereco.bairro.toLowerCase()) 
                ? 5 
                : 10
            : 10;

        // Aplica cupom se existir
        if (cupom) {
            const desconto = await buscarDescontoCupom(cupom, "taxa-entrega");
            taxa *= (1 - (desconto/100));
        }

        return taxa;
    } catch (error) {
        console.error("Erro cálculo taxa:", error);
        return 10;
    }
}

async function buscarDescontoCupom(cupom, tipo) {
    try {
        const cupomRef = ref(database, `cupons/${cupom}`);
        const snapshot = await get(cupomRef);
        if (snapshot.exists() && snapshot.val().EFEITO?.ID === tipo) {
            return parseFloat(snapshot.val().EFEITO.Valor) || 0;
        }
        return 0;
    } catch (error) {
        console.error("Erro ao buscar cupom:", error);
        return 0;
    }
}

function exibirQRCode(qrCode, pedidoId, valorTotal) {
    // Atualiza os elementos do modal
    document.getElementById('pedidoId').textContent = pedidoId;
    document.getElementById('pixValor').textContent = valorTotal.toFixed(2);
    
    // Limpa e prepara o container do QR Code
    const container = document.getElementById("qrCodeContainer");
    container.innerHTML = '<div class="qrcode-img"></div>';
    
    // Gera o QR Code
    new QRCode(container.querySelector(".qrcode-img"), {
        text: qrCode,
        width: 250,
        height: 250,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Mostra o modal
    const modal = new bootstrap.Modal(document.getElementById('pixModal'));
    modal.show();

    // Configura o botão de copiar
    document.getElementById('copyPixBtn').onclick = () => {
        navigator.clipboard.writeText(qrCode).then(() => {
            const copyBtn = document.getElementById('copyPixBtn');
            copyBtn.innerHTML = '<i class="fas fa-check me-2"></i>Código copiado!';
            copyBtn.classList.remove('btn-outline-primary');
            copyBtn.classList.add('btn-success');
            
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy me-2"></i>Copiar Código PIX';
                copyBtn.classList.remove('btn-success');
                copyBtn.classList.add('btn-outline-primary');
            }, 2000);
        });
    };

    // Inicia a verificação do pagamento
    verificarPagamento(pedidoId, modal);
}

async function verificarPagamento(pedidoId, modal) {
    const timerElement = document.getElementById('pixTimer');
    const paymentStatus = document.getElementById('paymentStatus');
    const paymentSpinner = document.getElementById('paymentSpinner');
    
    let timeLeft = 300; // 5 minutos em segundos
    let paymentInterval; // Escopo para toda a função

    // Função para limpar todos os intervalos
    const clearAllIntervals = () => {
        clearInterval(intervaloTimer);
        if (paymentInterval) {
            clearInterval(paymentInterval);
        }
    };

    // Atualiza o timer
    const intervaloTimer = setInterval(() => {
        timeLeft--;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearAllIntervals();
            timerElement.textContent = "Tempo esgotado!";
            timerElement.classList.add("text-danger");

            paymentSpinner.classList.remove("text-primary");
            paymentSpinner.classList.add("text-danger");

            paymentStatus.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Tempo para pagamento expirou. Por favor, inicie um novo pedido.
                </div>
            `;

            // Mostrar SweetAlert
            Swal.fire({
                title: 'Tempo esgotado!',
                text: 'O tempo para pagamento expirou. Por favor, inicie um novo pedido.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                allowOutsideClick: false
            }).then(() => {
                // Redirecionar para página inicial
                window.location.href = 'homepage.html';
            });

            // Deletar o pedido expirado
            deletarPedido(pedidoId);
        }
    }, 1000); // Timer a cada segundo

    // Verifica o pagamento a cada 5 segundos
    paymentInterval = setInterval(async () => {
        try {
            console.log('localizando pagamento');
            const pedidoRef = ref(database, `pedidos/${pedidoId}`);
            const snapshot = await get(pedidoRef);

            if (snapshot.exists()) {
                const pedido = snapshot.val();
                if (pedido.paymentStatus === 'approved') {
                    clearAllIntervals();

                    // Alerta de sucesso
                    Swal.fire({
                        icon: 'success',
                        title: 'Pagamento aprovado!',
                        text: 'Seu pedido foi confirmado com sucesso.',
                        showConfirmButton: false,
                        timer: 5000,
                        timerProgressBar: true
                    });

                    // Aguarda 5 segundos e redireciona
                    setTimeout(() => {
                        window.location.href = 'homepage.html';
                    }, 10000);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
        }
    }, 5000); // <-- Esse era o detalhe que faltava
}



async function deletarPedido(pedidoId) {
    try {
        const pedidoRef = ref(database, `pedidos/${pedidoId}`);
        await remove(pedidoRef);
        console.log(`Pedido ${pedidoId} deletado por expiração de tempo`);
    } catch (error) {
        console.error('Erro ao deletar pedido expirado:', error);
    }
}

const recoveryForm = document.getElementById("recovery-form");

if (recoveryForm) {
  recoveryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const email = document.getElementById("recovery-email").value;
    const mensagem = document.getElementById("recovery-message");
  
    try {
      await sendPasswordResetEmail(auth, email);
      mensagem.innerHTML = `<p class="text-green-600">📩 E-mail de recuperação enviado! Verifique sua caixa de entrada.</p>`;
    } catch (error) {
      mensagem.innerHTML = `<p class="text-red-600">Erro: ${error.message}</p>`;
    }
  });
}

export async function registrarUsoCupom(userId, cupomId) {
    const db = database
    
    try {
      // 1. Consultar o cupom no banco de dados
      const cupomRef = ref(db, `cupons/${cupomId}`);
      const cupomSnapshot = await get(cupomRef);
      
      if (!cupomSnapshot.exists()) {
        return { sucesso: false, mensagem: "Cupom não encontrado" };
      }
      
      const cupomData = cupomSnapshot.val();
      
      // 2. Verificar se o cupom requer controle
      if (cupomData.Controle !== "Sim") {
        return { sucesso: true, mensagem: "Cupom não requer registro" };
      }
      
      // 3. Registrar APENAS o userID dentro do cupom utilizado
      const registroRef = ref(db, `CuponsUtilizados/${cupomId}/${userId}`);
      await set(registroRef, true); // Armazena apenas um flag true
      
      return { sucesso: true, mensagem: "Uso do cupom registrado com sucesso" };
      
    } catch (error) {
      console.error("Erro ao registrar cupom:", error);
      return { sucesso: false, mensagem: "Erro ao registrar uso do cupom" };
    }
  }

  export async function verificarCupomUtilizado(userId, cupomId) {
    const db = database;
    const snapshot = await get(ref(db, `CuponsUtilizados/${cupomId}/${userId}`));
    return snapshot.exists();
  }

 

  function updateCartFooter() {

    
    // Supondo que você tenha uma função que retorna a quantidade de itens no carrinho
    const cartItems = getCartItemCount(); // Você precisa implementar esta função
    const cartFooter = document.getElementById('cart-footer');
    const view = document.querySelector('.view-cart-btn');

if (!view) {
    return;
}
// Adicione evento de clique para o botão "Ver Carrinho"
view.addEventListener('click', function() {
    // Redirecione para a página do carrinho ou mostre um modal
    window.location.href = 'carrinho.html';
});

    if(!cartFooter) {

        return;
    }
    console.log(cartItems);
    if (cartItems > 0) {
        document.getElementById('cart-count').textContent = cartItems;
        cartFooter.style.display = 'block';
    } else {
        cartFooter.style.display = 'none';
    }
}

// Exemplo de função para obter a quantidade de itens no carrinho
// Você precisa adaptar para sua implementação real do carrinho
function getCartItemCount() {
    const totalItens = Object.values(carrinho).reduce((total, item) => total + item.quantidade, 0);
    return totalItens;
}

// Chame esta função sempre que o carrinho for atualizado

function showGuestModal() {
    const guestModal = new bootstrap.Modal(document.getElementById('guestModal'));
    guestModal.show();
    
    // Adiciona máscara para o telefone
    $('#guestTelefone').inputmask('(99) 99999-9999');
    
    // Adiciona evento ao botão de confirmação
    document.getElementById('confirmGuest').addEventListener('click', async function() {
        const nome = document.getElementById('guestNome').value.trim();
        const telefone = document.getElementById('guestTelefone').value.trim();
        
        if (!nome || !telefone) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
        if (!telefoneRegex.test(telefone)) {
            alert('Por favor, insira um telefone válido com DDD');
            return;
        }
        
        const telefoneNumerico = telefone.replace(/\D/g, '');
        
        const userData = {
            nome: nome,
            telefone: telefoneNumerico
        };
        
        try {
            const guestUserRef1 = ref(database, `users/${telefoneNumerico}`);
            
            // CORRIGIDO
            const snapshot = await get(guestUserRef1);
            
            if (snapshot.exists()) {
                await update(guestUserRef1, userData);
            } else {
                await set(guestUserRef1, userData);
            }
            
            sessionStorage.setItem('guestUser', JSON.stringify({
                ...userData,
                telefoneFormatado: telefone
            }));
            
            guestModal.hide();
            window.location.href = 'entrega.html';
            
        } catch (error) {
            console.error('Erro ao salvar usuário visitante:', error);
            alert('Ocorreu um erro ao processar seus dados. Por favor, tente novamente.');
        }
    });
}


let todosProdutos = []; // Armazenar os produtos carregados
let produtosFiltrados = [];

async function carregarProdutosPorCategoria(nomeCategoria) {
    document.getElementById('categorias-container').style.display = 'none';
    document.getElementById('produtos-container').style.display = 'flex';
    document.getElementById('controle-produtos').style.display = 'flex';

    const produtosRef = ref(database, 'produtos');
    const snapshot = await get(produtosRef);

    todosProdutos = [];
    produtosFiltrados = [];

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const produto = childSnapshot.val();
            produto.id = childSnapshot.key;

            if (produto.categoria === nomeCategoria) {
                todosProdutos.push(produto);
            }
        });

        produtosFiltrados = [...todosProdutos]; // inicializa o filtro com todos
        renderizarProdutos(produtosFiltrados);
    } else {
        document.getElementById('produtos-container').innerHTML = '<p class="text-muted">Nenhum produto encontrado.</p>';
    }
}

const btnbuscarr = document.getElementById('busca-produto');

if(btnbuscarr) {
document.getElementById('busca-produto').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = todosProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termo)
    );
    produtosFiltrados = filtrados;
    renderizarProdutos(produtosFiltrados);
});

}
const btnvv = document.getElementById('btn-voltar-categorias');
if(btnvv) {
document.getElementById('btn-voltar-categorias').addEventListener('click', () => {
    document.getElementById('categorias-container').style.display = 'flex';
    document.getElementById('produtos-container').style.display = 'none';
    document.getElementById('controle-produtos').style.display = 'none';

    document.getElementById('busca-produto').value = '';
});
}

export async function carregarProdutos() {
    try {
        const produtosRef = ref(database, 'produtos');
        const snapshot = await get(produtosRef);
        const produtosContainer = document.getElementById('produtos-container');
        
        produtosContainer.innerHTML = `<div id="loading2" class="d-flex justify-content-center align-items-center vh-100">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                  </div>
                </div>;`
        todosProdutos = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const produto = childSnapshot.val();
                produto.id = childSnapshot.key;
                todosProdutos.push(produto); // Salva todos para filtrar depois
            });

            renderizarProdutos(todosProdutos);
        } else {
            produtosContainer.innerHTML = '<p class="text-muted">Nenhum produto cadastrado.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        document.getElementById('produtos-container').innerHTML = '<p class="text-danger">Erro ao carregar produtos.</p>';
    }
}
function renderizarProdutos(produtos) {
    const produtosContainer = document.getElementById('produtos-container');
    produtosContainer.innerHTML = '';

    if (produtos.length === 0) {
        produtosContainer.innerHTML = '<p class="text-muted">Nenhum produto encontrado.</p>';
        return;
    }

    produtos.forEach(produto => {
        produtosContainer.appendChild(criarElementoProduto(produto));
    });
}


// Filtro pelos botões
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('filtro-btn')) {
        const filtro = e.target.dataset.filtro;

        let produtosFiltrados;
        if (filtro === 'todos') {
            produtosFiltrados = todosProdutos;
        } else {
            produtosFiltrados = todosProdutos.filter(produto => produto.subcategoria === filtro);
        }

        renderizarProdutos(produtosFiltrados);
    }
});
const btnbuscar = document.getElementById('btnBuscar');

if (btnbuscar) {

// Busca por nome
document.getElementById('btnBuscar').addEventListener('click', () => {
    const termoBusca = document.getElementById('buscaProduto').value.trim().toLowerCase();

    if (termoBusca === "") {
        renderizarProdutos(todosProdutos);
        return;
    }

    const produtosFiltrados = todosProdutos.filter(produto =>
        produto.nome.toLowerCase().includes(termoBusca)
    );

    renderizarProdutos(produtosFiltrados);
});
}

async function chamarEnvioEmail(pedidoData) {
    try {
      const response = await fetch('https://enviaremailpedido-7k32yr6ooq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pedidoData)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao enviar e-mail:', errorText);
      } else {
        console.log('✅ E-mail enviado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao chamar Cloud Function:', error);
    }
  }

 export async function enviarMensagemPedidoWhatsApp2(dados) {
    try {
        const snapshot = await get(child(ref(database), 'ngrok/url'));
        const botUrl = snapshot.exists() ? snapshot.val() : null;

        if (!botUrl || !dados.telefone) return;

        // Envia a mensagem personalizada ou a padrão
        const mensagem = dados.mensagem

        await fetch(`${botUrl}/SEND`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numero: dados.telefone.replace(/\D/g, ''),
                mensagem: mensagem
            }),
            timeout: 30000
        });
    } catch (error) {
        console.error('Erro no WhatsApp:', error);
    }
}
  
  
  
  
