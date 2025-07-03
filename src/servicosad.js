import { database, ref, get, child } from './main.js';

const params = new URLSearchParams(window.location.search);
const nomeServico = params.get("servico");

if (!nomeServico) {
  document.getElementById("servicoDetalhes").innerHTML = "<p>Serviço não especificado.</p>";
} else {
  const dbRef = ref(database);
  get(child(dbRef, `postagens/${nomeServico}`)).then(snapshot => {
    if (snapshot.exists()) {
      const s = snapshot.val();
      document.getElementById("servicoDetalhes").innerHTML = `
        <div class="card" style="min-width: 300px;">
          <img src="${s.urlImagem}" class="card-img-top" style="height: 300px; object-fit: cover;">
          <div class="card-body">
            <h2 class="card-title">${s.nome}</h2>
           
            <p>${s.texto}</p>
            
          </div>
        </div>

      `;
    } else {
      document.getElementById("servicoDetalhes").innerHTML = "<p>Serviço não encontrado.</p>";
    }
  });
}
