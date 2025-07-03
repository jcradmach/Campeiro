import { auth, database, ref, set, push, get, update, remove } from "./main.js";
import { verificarCupomUtilizado } from '/src/database.js';


 // Variáveis globais
 let carrinho = JSON.parse(localStorage.getItem('carrinho')) || {};
        
 // Quando o DOM estiver carregado
 document.addEventListener('DOMContentLoaded', function() {
     // Configurar data mínima (amanhã)
     const dataInput = document.getElementById('data-entrega');
     const amanha = new Date();
     amanha.setDate(amanha.getDate() + 1);

     if (dataInput) {
     dataInput.min = amanha.toISOString().split('T')[0];

     };
     
     // Mostrar/ocultar opções de entrega
     document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
         radio.addEventListener('change', function() {
             const entregaOptions = document.getElementById('entrega-options');
             const taxaEntregaContainer = document.getElementById('taxa-entrega-container');
             
             if (this.value === 'entrega') {
                 entregaOptions.style.display = 'block';
                 taxaEntregaContainer.style.display = 'flex';
                 carregarEnderecos();
                 document.getElementById('taxa-entrega').textContent = '10.00';
             } else {
                 entregaOptions.style.display = 'none';
                 taxaEntregaContainer.style.display = 'none';
                 document.getElementById('taxa-entrega').textContent = '0.00';
             }
             atualizarTotal();
         });
     });
     
     const horarioInput = document.getElementById('horario-entrega');
     
     const cepButton = document.getElementById('buscar-cep');
     
     if (horarioInput) horarioInput.addEventListener('change', atualizarTotal);
     if (dataInput) dataInput.addEventListener('change', atualizarTotal);
     if (cepButton) cepButton.addEventListener('click', buscarCEP);
     
     // Salvar endereço

     
     
     // Carregar resumo do pedido
     carregarResumoPedido();
 });
 
 // Funções
 function carregarResumoPedido() {
     const resumoContainer = document.getElementById('resumo-pedido');
     let html = '';
     let subtotal = 0;
     
     Object.values(carrinho).forEach(item => {
         subtotal += item.preco * item.quantidade;
         html += `
             <div class="d-flex justify-content-between mb-2">
                 <span>${item.nome} x${item.quantidade}</span>
                 <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
             </div>
         `;
     });
     if (resumoContainer) {
        resumoContainer.innerHTML = html;
     }
    const subtotall = document.getElementById('subtotall');
    if(subtotall) {
        subtotall.textContent = `R$ ${subtotal.toFixed(2)}`;
        atualizarTotal();
    }
     
    
 }
 
 export function atualizarTotal() {
     const subtotalText = document.getElementById('subtotall').textContent;
     const subtotal = parseFloat(subtotalText.replace('R$ ', '').replace(',', '.'));
     let total = subtotal;
     
     // Adicionar taxa de entrega se for entrega
     if (document.getElementById('entrega').checked) {
         const taxaText = document.getElementById('taxa-entrega').textContent;
         const taxa = parseFloat(taxaText.replace('R$ ', '').replace(',', '.'));
         total += taxa;
     }
     
     document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
 }
// Função para carregar endereços (com suporte a guest)
export async function carregarEnderecos() {
    try {
        let userRef;
        
        if (auth.currentUser) {
            userRef = ref(database, `users/${auth.currentUser.uid}/enderecos`);
        } 
        else if (sessionStorage.getItem('guestUser')) {
            const guestUser = JSON.parse(sessionStorage.getItem('guestUser'));
            const telefoneNumerico = guestUser.telefone.replace(/\D/g, '');
            userRef = ref(database, `users/${telefoneNumerico}/enderecos`);
        } 
        else {
            throw new Error("Nenhum usuário identificado");
        }
    
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
            return null;
        }
        
        return snapshot.val();
    } catch (error) {
        console.error("Erro ao carregar endereços:", error);
        throw error;
    }
}
  
  // Função para salvar endereço (com suporte a guest)
  export async function salvarEndereco(enderecoData) {
    try {
      let userRef;
      let isGuest = false;
      
      // Verifica se é um usuário autenticado
      if (auth.currentUser) {
        userRef = ref(database, `users/${auth.currentUser.uid}/enderecos`);
      } 
      // Verifica se é um usuário guest
      else if (sessionStorage.getItem('guestUser')) {
        const guestUser = JSON.parse(sessionStorage.getItem('guestUser'));
        const telefoneNumerico = guestUser.telefone.replace(/\D/g, '');
        userRef = ref(database, `users/${telefoneNumerico}/enderecos`);
        isGuest = true;
        
        // Adiciona flag de guest no endereço
        enderecoData.isGuestAddress = true;
      } 
      else {
        throw new Error("Nenhum usuário identificado para salvar endereço");
      }
  
      // Adiciona timestamp ao endereço
   
      
      // Salva o endereço
      const novoEnderecoRef = push(userRef);
      await set(novoEnderecoRef, enderecoData);
      
      return novoEnderecoRef.key; // Retorna o ID do novo endereço
      
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      throw error;
    }
  }

function atualizarListaEnderecos2(enderecos) {
    const container = document.getElementById('enderecos-container');
    container.innerHTML = '';
    
    if (!enderecos) {
        container.innerHTML = '<div class="alert alert-warning">Nenhum endereço cadastrado</div>';
        return;
    }
    
    let html = '<div class="list-group">';
    for (const [id, endereco] of Object.entries(enderecos)) {
        html += `
            <label class="list-group-item">
                <input type="radio" name="endereco" value="${id}" class="form-check-input me-2">
                ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}
            </label>
        `;
    }
    html += '</div>';
    container.innerHTML = html;
}
 
 async function buscarCEP() {
     const cep = document.getElementById('cep').value.replace(/\D/g, '');
     
     if (cep.length !== 8) {
         Swal.fire('Erro', 'CEP inválido. Digite 8 números.', 'error');
         return;
     }
     
     try {
         const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
         const data = await response.json();
         
         if (data.erro) {
             throw new Error('CEP não encontrado');
         }
         
         document.getElementById('rua').value = data.logradouro;
         document.getElementById('bairro').value = data.bairro;
         document.getElementById('cidade').value = data.localidade;
         document.getElementById('numero').focus();
         
         Swal.fire('Sucesso', 'Endereço encontrado! Complete com o número.', 'success');
     } catch (error) {
         Swal.fire('Erro', 'Não foi possível encontrar o CEP. Verifique e tente novamente.', 'error');
     }
 }
 


const cupomInput = document.getElementById('cupom-input');
    const aplicarCupomBtn = document.getElementById('aplicar-cupom');
    const cupomMessage = document.getElementById('cupom-message');
    const descontoContainer = document.getElementById('desconto-container');
    const descontoValor = document.getElementById('desconto-valor');
    
    
    // Variável para armazenar o cupom aplicado
    let cupomAplicado = null;
    
    // Função para aplicar o cupom
    if (aplicarCupomBtn) {
        aplicarCupomBtn.addEventListener('click', async function() {
        const codigoCupom = cupomInput.value.trim();
        
        if (!codigoCupom) {
            cupomMessage.textContent = "Por favor, digite um código de cupom.";
            cupomMessage.style.color = "red";
            return;
        }

        if (!auth.currentUser) {

             cupomMessage.textContent = "Realize Login para utilizar cupons";
            cupomMessage.style.color = "red";
            return;

        }
        
        try {
            const db = database;
            const cupomRef = ref(db, `cupons/${codigoCupom}`);
            const snapshot = await get(cupomRef);
            
            if (snapshot.exists()) {
                const cupomData = snapshot.val();
                
                if (cupomData.EFEITO && cupomData.EFEITO.ID && cupomData.EFEITO.Valor) {
                    cupomAplicado = {
                        codigo: codigoCupom,
                        efeito: cupomData.EFEITO
                    };
                    
                    aplicarDesconto(cupomAplicado);
                    cupomMessage.textContent = "Cupom aplicado com sucesso!";
                    cupomMessage.style.color = "green";
                } else {
                    cupomMessage.textContent = "Cupom inválido (estrutura incorreta).";
                    cupomMessage.style.color = "red";
                }
            } else {
                cupomMessage.textContent = "Cupom não encontrado.";
                cupomMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Erro ao buscar cupom:", error);
            cupomMessage.textContent = "Erro ao verificar cupom. Tente novamente.";
            cupomMessage.style.color = "red";
        }
    });

}
    
    async function aplicarDesconto(cupom) {
        // Elementos da interface
        const elementoId = cupom.efeito.ID;
        const elemento = document.getElementById(elementoId);
        const cupomMessage = document.getElementById('cupom-message');
        const user = auth.currentUser;
        const userId = user.uid
        
        if (!elemento) {
            console.error("Elemento para aplicar desconto não encontrado");
            return false;
        }
    
        try {
            // 1. Verificar se o cupom já foi utilizado
            const cupomUtilizado = await verificarCupomUtilizado(userId, cupom.codigo);
            
            if (cupomUtilizado) {
                cupomMessage.textContent = "Você já utilizou este cupom anteriormente";
                cupomMessage.style.color = "red";
                return false;
            }
    
            // 2. Aplicar o desconto
            const porcentagemDesconto = cupom.efeito.Valor;
            const valorTexto = elemento.textContent.replace('R$ ', '').replace(',', '.');
            const valorAtual = parseFloat(valorTexto);
            const valorDesconto = (valorAtual * porcentagemDesconto) / 100;
            const novoValor = valorAtual - valorDesconto;
    
            // 3. Atualizar a interface
            elemento.textContent = `R$ ${novoValor.toFixed(2).replace('.', ',')}`;
            descontoContainer.style.display = "flex";
            descontoValor.textContent = `-R$ ${valorDesconto.toFixed(2).replace('.', ',')}`;
            
            // 4. Registrar o uso do cupom (se necessário)
            if (cupom.Controle === "Sim") {
                const registro = await registrarUsoCupom(userId, cupom.codigo);
                if (!registro.sucesso) {
                    console.error("Erro ao registrar cupom:", registro.mensagem);
                }
            }
    
            // 5. Atualizar totais e mostrar mensagem de sucesso
            atualizarTotal();
            cupomMessage.textContent = "Cupom aplicado com sucesso!";
            cupomMessage.style.color = "green";
            
            return true;
    
        } catch (error) {
            console.error("Erro ao aplicar desconto:", error);
            cupomMessage.textContent = "Erro ao processar cupom. Tente novamente.";
            cupomMessage.style.color = "red";
            return false;
        }
    }

    
   



