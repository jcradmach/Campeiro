import { database, ref, set, update, onValue, storage, storageRef, uploadBytes, getDownloadURL, push, remove, get } from './main.js';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';

document.getElementById("formServico").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnOriginalText = submitBtn.innerHTML;

  try {
    const nome = document.getElementById("nomeInput").value.trim();
    const resumo = document.getElementById("resumoInput").value.trim();
    const categoria = document.getElementById("categoriaPostagem").value;
    const texto = document.getElementById("textoPostagem").value;
    const imagemInput = document.getElementById("imagemInput");
    const imagemFile = imagemInput.files[0];
    const dataPostagem = new Date(); // Captura a data/hora atual

    if (!nome) {
      alertModal("A postagem deve ter um Título!", "warning");
      return;
    }

    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Salvando...
    `;
    submitBtn.disabled = true;

    const servicoRef = ref(database, 'postagens/' + nome);
    let urlImagem = '';

    if (imagemFile) {
      const imgRef = storageRef(storage, `postagens/${nome}/${imagemFile.name}`);
      const snapshot = await uploadBytes(imgRef, imagemFile);
      urlImagem = await getDownloadURL(snapshot.ref);
    } else {
      const snapshot = await get(servicoRef);
      if (snapshot.exists()) {
        urlImagem = snapshot.val().urlImagem || '';
      }
    }

    await set(servicoRef, {
      nome,
      resumo,
      categoria,
      texto,
      urlImagem,
      data: Date.now(), 
      link: `servicosad.html?servico=${encodeURIComponent(nome)}`
    });

    alertModal("Postagem realizada!", "success");

  } catch (error) {
    console.error("Erro ao postar:", error);

    let errorMessage = "Ocorreu um erro ao realizar a postagem";
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

    // (Opcional) fecha o alertModal se ele for modal separado
    const modalAlerta = bootstrap.Modal.getInstance(document.getElementById('alertModal'));
    if (modalAlerta) {
      setTimeout(() => modalAlerta.hide(), 3000);
    }
  

    resetFormularioServico();
  }
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

// Utilitários
function formatarData(timestamp) {
  const data = new Date(timestamp);
  return `${data.toLocaleDateString()} - ${data.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

// Variáveis globais

let currentServicoId = null;

// Função principal para carregar a tabela de serviços
export const initializeServicosPage = () => {
  loadServicosTable();
 
};

let servicosTable = null; // Global

const loadServicosTable = () => {
  const tabela = $('#tabelasTable'); // usa jQuery para DataTables
  const servicosRef = ref(database, 'postagens');

  onValue(servicosRef, (snapshot) => {
    const servicos = snapshot.val() || {};
    const dados = [];
    

    Object.entries(servicos).forEach(([key, servico]) => {
      const dataFormatada = formatarData(servico.data);
      dados.push([
        servico.urlImagem ? `<img src="${servico.urlImagem}" width="60" height="60" class="img-thumbnail">` : '-',
        servico.nome,
        servico.categoria || '-',
        dataFormatada,
        `
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline-primary btn-share" style="font-size: 0.5rem;" title="Compartilhar" data-link="${servico.link}">
            <i class="fas fa-share-alt"></i>
          </button>
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
      servicosTable.clear();
      servicosTable.rows.add(dados);
      servicosTable.draw();
    } else {
      servicosTable = tabela.DataTable({
        data: dados,
        columns: [
          { title: "Imagem" },
          { title: "Título" },
          { title: "Categoria" },
          { title: "Data" },
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

      // Filtro por nome
      const nomeInput = document.getElementById('nomeSearch');
      if (nomeInput && !nomeInput.dataset.listenerAdded) {
        nomeInput.addEventListener('input', (e) => {
          servicosTable.column(1).search(e.target.value).draw();
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
    columnDefs: [{ orderable: false, targets: 4 }]
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
  if (!confirm('Deseja realmente excluir esta postagem?')) return;
  try {
    await remove(ref(database, `postagens/${nome}`));
    alertModal('Postagem excluída com Sucesso!');
    loadServicosTable();
  } catch (err) {
    console.error('Erro ao excluir:', err);
    alertModal('Erro ao excluir.');
  }
}

async function abrirModalEdicao(nome) {
  const servicoRef = ref(database, 'postagens/' + nome);
  const snapshot = await get(servicoRef);

  if (!snapshot.exists()) {
    alertModal("Postagem não encontrada.", "warning");
    return;
  }

  const dados = snapshot.val();

  document.getElementById("nomeInput").value = dados.nome;
  document.getElementById("nomeInput").value = dados.resumo;
  document.getElementById("categoriaPostagem").value = dados.categoria || '';
  document.getElementById("textoPostagem").value = dados.texto || '';
  document.getElementById("imagemPreview").src = dados.urlImagem || "#";
  document.getElementById("imagemPreview").classList.remove("d-none");

  document.getElementById("nomeInput").disabled = true;

  const submitBtn = document.querySelector('#formServico button[type="submit"]');
  submitBtn.textContent = "Salvar Alterações";

  const modal = new bootstrap.Modal(document.getElementById("modalCadastroServico"));
  modal.show();
}

function resetFormularioServico() {
  const form = document.getElementById("formServico");
  form.reset();

  document.getElementById("imagemPreview").classList.add("d-none");
  document.getElementById("imagemPreview").src = "#";
  document.getElementById("nomeInput").disabled = false;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "Postar";
}

document.getElementById('modalCadastroServico').addEventListener('hidden.bs.modal', resetFormularioServico);


