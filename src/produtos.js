import { database, ref, set, update, onValue, storage, storageRef, uploadBytes, getDownloadURL, push, remove, get } from './main.js';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';

let servicosTable = null; // Global

document.getElementById("formServico").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnOriginalText = submitBtn.innerHTML;

  try {
    const idProduto = document.getElementById("produtoIdInput").value;
    const nome = document.getElementById("nomeInput").value.trim();
    const categoria = document.getElementById("categoriaInput").value.trim();
    const descricao = document.getElementById("descricaoInput").value;
    const valor = parseFloat(document.getElementById("valorInput").value);

    const imagemInput = document.getElementById("imagemInput");
    const imagemFile = imagemInput.files[0];

    if (!nome) {
      alertModal("O nome do produto é obrigatório!", "warning");
      return;
    }

    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Salvando...
    `;
    submitBtn.disabled = true;

    let urlImagem = '';

    if (imagemFile) {
      const imgRef = storageRef(storage, `produtos/${nome}/${imagemFile.name}`);
      const snapshot = await uploadBytes(imgRef, imagemFile);
      urlImagem = await getDownloadURL(snapshot.ref);
    } else if (idProduto) {
      // Está editando, e não escolheu nova imagem: manter a antiga
      const snapshot = await get(ref(database, 'produtos/' + idProduto));
      if (snapshot.exists()) {
        urlImagem = snapshot.val().urlImagem || '';
      }
    }

    // Criação ou atualização
    const produtoRef = idProduto
      ? ref(database, 'produtos/' + idProduto)           // Editar existente
      : push(ref(database, 'produtos'));                 // Novo produto

    await set(produtoRef, {
      nome,
      categoria,
      descricao,
      valor,
      urlImagem
    });

    // Atualiza categoria se necessário
    const categoriaRef = ref(database, `categorias/${categoria}`);
    const categoriaSnapshot = await get(categoriaRef);

    if (!categoriaSnapshot.exists() || !categoriaSnapshot.val().urlImagem) {
      await set(categoriaRef, { urlImagem });
    }

    alertModal("Produto salvo com sucesso!", "success");
    loadServicosTable();

  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);

    let errorMessage = "Ocorreu um erro ao cadastrar o produto";
    if (error.code === 'storage/unauthorized') {
      errorMessage = "Sem permissão para fazer upload da imagem";
    } else if (error.code === 'storage/unknown') {
      errorMessage = "Erro desconhecido no armazenamento";
    }

    alertModal(`${errorMessage}: ${error.message}`, "danger", "Erro");

  } finally {
    submitBtn.innerHTML = btnOriginalText;
    submitBtn.disabled = false;

    const modalCadastro = bootstrap.Modal.getInstance(document.getElementById('modalCadastroServico'));
    if (modalCadastro) {
      setTimeout(() => modalCadastro.hide(), 300);
    }

    const modalAlerta = bootstrap.Modal.getInstance(document.getElementById('alertModal'));
    if (modalAlerta) {
      setTimeout(() => modalAlerta.hide(), 3000);
    }

    resetFormularioServico();
  }
});



document.addEventListener("DOMContentLoaded", () => {

  loadServicosTable();

  const botaoAbrir = document.getElementById("abrirmodal");
  const modalElemento = document.getElementById("modalCadastroServico");

  if (botaoAbrir && modalElemento) {
    const modalBootstrap = new bootstrap.Modal(modalElemento);

    botaoAbrir.addEventListener("click", () => {
      modalBootstrap.show();
      console.log('mamamia')
    });
  }

  const cards = document.querySelectorAll(".card-servico");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const acao = card.dataset.action;

      switch (acao) {
        case "clientpage1":
          console.log("Page1");
          clientpage1();
          break;
        case "clientpage2":
        const modalElemento = document.getElementById("modalCadastroServico");
        const modalBootstrap = new bootstrap.Modal(modalElemento);
        modalBootstrap.show();
      
          break;
        default:
          console.warn("Ação desconhecida:", acao);
      }
    });
  });
});

function clientpage1() {

    // Seleciona todas as páginas de análise
    const pages = document.querySelectorAll('.cliente-page');
    
    // Remove a classe 'active' de todas as páginas
    pages.forEach(page => page.classList.remove('active'));
    
    // Adiciona a classe 'active' na página correspondente
    const page = document.getElementById('clientpage1');
    if (page) {
        page.classList.add('active');
    }
}

function clientpage2() {

    // Seleciona todas as páginas de análise
    const pages = document.querySelectorAll('.cliente-page');
    
    // Remove a classe 'active' de todas as páginas
    pages.forEach(page => page.classList.remove('active'));
    
    // Adiciona a classe 'active' na página correspondente
    const page = document.getElementById('clientpage2');
    if (page) {
        page.classList.add('active');
    }
}

function alertModal(mensagem, tipo = 'primary', titulo = 'Alerta') {
  const modal = new bootstrap.Modal(document.getElementById('alertModal'));
  
  // Configura o conteúdo
  document.getElementById('alertModalMessage').textContent = mensagem;
  document.getElementById('alertModalTitle').textContent = titulo;
  
  // Atualiza as classes de cor conforme o tipo
  const header = document.querySelector('#alertModal .modal-header');
  const icon = document.querySelector('#alertModal .modal-body i');
  const button = document.querySelector('#alertModal .modal-footer .btn');
  
  // Remove todas as classes de cor
  header.className = header.className.replace(/\bbg-\w+\b/g, '');
  icon.className = icon.className.replace(/\btext-\w+\b/g, '');
  button.className = button.className.replace(/\bbtn-\w+\b/g, '');
  
  // Adiciona as novas classes
  header.classList.add(`bg-${tipo}`, 'text-white');
  icon.classList.add(`text-${tipo}`);
  button.classList.add(`btn-${tipo}`);
  
  // Mostra o modal
  modal.show();
  
  // Fecha automaticamente após 5 segundos
  setTimeout(() => modal.hide(), 5000);
}

// Variáveis globais

let currentServicoId = null;

// Função principal para carregar a tabela de serviços
export const initializeServicosPage = () => {
  loadServicosTable();
 
};


const loadServicosTable = () => {
  const tabela = $('#tabelasTable'); // jQuery
  const servicosRef = ref(database, 'produtos');

  onValue(servicosRef, (snapshot) => {
    const servicos = snapshot.val() || {};
    const dados = [];

    Object.entries(servicos).forEach(([key, servico]) => {
      dados.push([
        servico.nome,
        servico.categoria || '-',
        servico.valor || '-',
        `
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline-secondary btn-edit" style="font-size: 0.5rem;" title="Editar" data-id="${key}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-delete" style="font-size: 0.5rem;" title="Excluir" data-id="${key}">
            <i class="far fa-trash-alt"></i> 
          </button>
        </div>`
      ]);
    });

    if ($.fn.DataTable.isDataTable(tabela)) {
      // Atualiza apenas os dados
      servicosTable.clear();
      servicosTable.rows.add(dados);
      servicosTable.draw();
    } else {
      // Inicializa pela primeira vez
      servicosTable = tabela.DataTable({
        data: dados,
        columns: [
          { title: "Nome" },
          { title: "Categoria" },
          { title: "Valor" },
          { title: "Ações", orderable: false }
        ],
        language: {
          url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json'
        },
        responsive: true,
        scrollX: true,
        scrollCollapse: true,
        dom: 'lrtip'
      });

      // Filtro por nome (coluna 0)
      const nomeInput = document.getElementById('nomeSearch');
      if (!nomeInput.dataset.listenerAdded) {
        nomeInput.addEventListener('input', (e) => {
          servicosTable.column(0).search(e.target.value).draw();
        });
        nomeInput.dataset.listenerAdded = 'true';
      }
    }
  });
};



const initializeDataTable = () => {
  servicosTable = $('#tabelasTable').DataTable({
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json'
    },
    responsive: true,
    scrollX: true,    
    scrollCollapse: true,
    columnDefs: [{ orderable: false, targets: 3}],
    dom: 'lrtip'
  });

  // Adiciona filtro apenas uma vez
  const nomeInput = document.getElementById('nomeSearch');
  if (!nomeInput.dataset.listenerAdded) {
    nomeInput.addEventListener('input', (e) => {
      servicosTable.column(0).search(e.target.value).draw();
    });
    nomeInput.dataset.listenerAdded = 'true';
  }
};

// Adiciona event listeners após criar a tabela
document.addEventListener('click', (e) => {

  // Botão "Excluir"
  if (e.target.closest('.btn-danger')) {
    const btn = e.target.closest('.btn-danger');
    const key = btn.dataset.id;
    excluirServico(key);
  }

  if (e.target.closest('.btn-edit')) {
    const btn = e.target.closest('.btn-edit');
    const key = btn.dataset.id;
    abrirModalEdicao(key);
  }
  

});

// Excluir postagem
async function excluirServico(nome) {
  if (!confirm('Deseja realmente excluir este produto?')) return;
  try {
    await remove(ref(database, 'produtos/' + nome));
    alertModal('Produto excluído com Sucesso!');
    loadServicosTable();
  } catch (err) {
    console.error('Erro ao excluir:', err);
    alertModal('Erro ao excluir.');
  }
}

async function abrirModalEdicao(idProduto) {
  const servicoRef = ref(database, 'produtos/' + idProduto);
  const snapshot = await get(servicoRef);

  if (!snapshot.exists()) {
    alertModal("Produto não encontrado.", "warning");
    return;
  }

  const dados = snapshot.val();

  document.getElementById("produtoIdInput").value = idProduto; // << ID oculto
  document.getElementById("nomeInput").value = dados.nome;
  document.getElementById("categoriaInput").value = dados.categoria || '';
  document.getElementById("descricaoInput").value = dados.descricao || '';
  document.getElementById("valorInput").value = dados.valor || '';
  document.getElementById("imagemPreview").src = dados.urlImagem || "#";
  document.getElementById("imagemPreview").classList.remove("d-none");

  document.getElementById("nomeInput").disabled = false; // Pode editar nome se quiser

  const submitBtn = document.querySelector('#formServico button[type="submit"]');
  submitBtn.textContent = "Salvar Alterações";

  const modal = new bootstrap.Modal(document.getElementById("modalCadastroServico"));
  modal.show();
}

function resetFormularioServico() {
  const form = document.getElementById("formServico");
  form.reset();

  document.getElementById("produtoIdInput").value = "";
  document.getElementById("imagemPreview").classList.add("d-none");
  document.getElementById("imagemPreview").src = "#";
  document.getElementById("nomeInput").disabled = false;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "Cadastrar";
}

document.getElementById('modalCadastroServico').addEventListener('hidden.bs.modal', resetFormularioServico);


async function carregarCategorias() {
  try {
    const categoriasRef = ref(database, 'produtos');
    const categoriasList = document.getElementById('categoriasList');
    const categoriasUnicas = new Set();

    const snapshot = await get(categoriasRef);

    if (snapshot.exists()) {
      snapshot.forEach((produto) => {
        const categoria = produto.val().categoria; // Acessa a categoria diretamente
        if (categoria) {
          categoriasUnicas.add(categoria);
        }
      });

      // Limpa e popula o datalist
      categoriasList.innerHTML = '';
      categoriasUnicas.forEach((categoria) => {
        const option = document.createElement('option');
        option.value = categoria;
        categoriasList.appendChild(option);
      });
    } else {
      console.log("Nenhum dado encontrado");
    }
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
  }
}

// Carrega categorias quando o modal é aberto
document.getElementById('modalCadastroServico').addEventListener('shown.bs.modal', carregarCategorias);

// Autocomplete enquanto digita
document.getElementById('categoriaInput').addEventListener('input', (e) => {
  const input = e.target.value.toLowerCase();
  const options = document.querySelectorAll('#categoriasList option');
  
  options.forEach(option => {
    option.style.display = option.value.toLowerCase().startsWith(input) ? 'block' : 'none';
  });
});

// Preview da imagem
document.getElementById('imagemInput').addEventListener('change', function(e) {
  const preview = document.getElementById('imagemPreview');
  const file = e.target.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.classList.remove('d-none');
    }
    
    reader.readAsDataURL(file);
  } else {
    preview.src = '#';
    preview.classList.add('d-none');
  }
});
