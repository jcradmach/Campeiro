document.addEventListener('DOMContentLoaded', function() {
    // Configuração de regiões por faixa de CEP
    const REGIOES_FRETE = [
    {
        nome: "Vale do Taquari e Região",
        faixas: ["95800-95999", "95700-95799"],
        frete: 8.90,
        prazo: "1-2 dias úteis",
        grátisAcima: 150.00
    },
    {
        nome: "Região Metropolitana de Porto Alegre",
        faixas: ["90000-91999", "93000-93999"],
        frete: 12.50,
        prazo: "2-3 dias úteis",
        grátisAcima: 199.90
    },
    {
        nome: "Interior do RS (Sul)",
        faixas: ["96000-96999", "98000-98999"],
        frete: 14.90,
        prazo: "3-4 dias úteis",
        grátisAcima: 249.90
    },
    {
        nome: "Interior do RS (Norte)",
        faixas: ["99000-99999", "95000-95199"],
        frete: 16.90,
        prazo: "3-5 dias úteis",
        grátisAcima: 299.90
    },
    {
        nome: "Santa Catarina",
        faixas: ["88000-89999"],
        frete: 18.90,
        prazo: "4-6 dias úteis",
        grátisAcima: 349.90
    },
    {
        nome: "Paraná",
        faixas: ["80000-87999"],
        frete: 19.90,
        prazo: "5-7 dias úteis",
        grátisAcima: 349.90
    },
    {
        nome: "Região Sudeste (SP, RJ, MG, ES)",
        faixas: ["01000-39999"],
        frete: 24.90,
        prazo: "6-9 dias úteis",
        grátisAcima: 399.90
    },
    {
        nome: "Região Nordeste",
        faixas: ["40000-65999"],
        frete: 32.90,
        prazo: "8-12 dias úteis",
        grátisAcima: 499.90
    },
    {
        nome: "Região Norte e Centro-Oeste",
        faixas: ["66000-79999"],
        frete: 38.90,
        prazo: "10-15 dias úteis",
        grátisAcima: 599.90
    },
    {
        nome: "Demais regiões",
        faixas: ["default"],
        frete: 42.90,
        prazo: "12-18 dias úteis",
        grátisAcima: 699.90
    }
];

    // Elementos do DOM
    const cepInput = document.getElementById('cep');
    const btnVerificarCep = document.getElementById('btn-verificar-cep');
    const cepFeedback = document.getElementById('cep-feedback');
    const opcaoFreteContainer = document.getElementById('opcao-frete-container');
    const opcaoFrete = document.getElementById('opcao-frete');
    const freteSpan = document.getElementById('frete');
    const totalSpan = document.getElementById('total');
    const finalizarBtn = document.getElementById('finalizar-carrinho');

    // Máscara para o CEP
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        e.target.value = value;
    });

    // Verificar CEP
    btnVerificarCep.addEventListener('click', verificarCEP);
    cepInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') verificarCEP();
    });

    function verificarCEP() {
        const cep = cepInput.value.replace(/\D/g, '');
        
        // Validação básica
        if (cep.length !== 8) {
            cepFeedback.innerHTML = '<div class="alert alert-danger py-2">CEP inválido. Digite 8 dígitos.</div>';
            opcaoFreteContainer.style.display = 'none';
            finalizarBtn.disabled = true;
            return;
        }
        
        // Encontrar a região
        const cepNum = parseInt(cep.substring(0, 5));
        const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace('R$ ', '').replace(',', '.'));
        
        let regiaoEncontrada = REGIOES_FRETE.find(regiao => {
            if (regiao.faixas.includes("default")) return true;
            
            return regiao.faixas.some(faixa => {
                const [min, max] = faixa.split('-').map(Number);
                return cepNum >= min && cepNum <= max;
            });
        }) || REGIOES_FRETE.find(r => r.faixas.includes("default"));
        
        // Calcular frete (verificar se tem frete grátis)
        let valorFrete = regiaoEncontrada.frete;
        let freteGratis = false;
        
        if (subtotal > 0 && subtotal >= regiaoEncontrada.grátisAcima) {
            valorFrete = 0;
            freteGratis = true;
        }
        
        // Exibir opção de frete
        opcaoFrete.innerHTML = `
            <p class="mb-1"><strong>${regiaoEncontrada.nome}</strong></p>
            <p class="mb-1">Prazo: ${regiaoEncontrada.prazo}</p>
            <p class="mb-0">
                <strong>Valor: ${freteGratis ? 
                    '<span class="text-success">Frete Grátis</span>' : 
                    'R$ ' + valorFrete.toFixed(2).replace('.', ',')}
                </strong>
                ${freteGratis ? `<br><small class="text-success">(Para pedidos acima de R$ ${regiaoEncontrada.grátisAcima})</small>` : ''}
            </p>
        `;
        
        // Feedback visual
        cepFeedback.innerHTML = `<div class="alert alert-success py-2">CEP válido - ${regiaoEncontrada.nome}</div>`;
        opcaoFreteContainer.style.display = 'block';
        
        // Atualizar valores
        atualizarFrete(valorFrete);
    }
    
    function atualizarFrete(valor) {
        const subtotal = parseFloat(document.getElementById('subtotal').textContent
            .replace('R$ ', '').replace(',', '.'));
        
        freteSpan.textContent = valor === 0 ? 'Grátis' : `R$ ${valor.toFixed(2).replace('.', ',')}`;
        totalSpan.textContent = `R$ ${(subtotal + valor).toFixed(2).replace('.', ',')}`;
        
        // Habilitar botão de finalizar
        finalizarBtn.disabled = false;
    }
});

function calcularFreteLajeado(cepDestino, valorPedido = 0) {
    // Validação do CEP
    const cepNumerico = cepDestino.replace(/\D/g, '');
    if (cepNumerico.length !== 8) {
        return {
            error: true,
            message: "CEP inválido. Digite um CEP com 8 dígitos."
        };
    }

    const cepPrefix = parseInt(cepNumerico.substring(0, 5));
    let regiaoEncontrada = null;

    // Verifica se o CEP é da região de Lajeado (frete grátis local)
    if (cepNumerico.substring(0, 5) === "95900") {
        return {
            nome: "Lajeado e arredores",
            frete: 0,
            prazo: "1 dia útil",
            grátisAcima: 0,
            mensagem: "Entrega local - Frete grátis"
        };
    }

    // Busca a região correspondente
    for (const regiao of REGIOES_FRETE_LAJEADO) {
        if (regiao.faixas.includes("default")) continue;
        
        for (const faixa of regiao.faixas) {
            const [min, max] = faixa.split('-').map(Number);
            if (cepPrefix >= min && cepPrefix <= max) {
                regiaoEncontrada = regiao;
                break;
            }
        }
        if (regiaoEncontrada) break;
    }

    // Se não encontrou, usa o default
    if (!regiaoEncontrada) {
        regiaoEncontrada = REGIOES_FRETE_LAJEADO.find(r => r.faixas.includes("default"));
    }

    // Aplica frete grátis se o valor do pedido for suficiente
    const resultado = {...regiaoEncontrada};
    if (valorPedido >= resultado.grátisAcima) {
        resultado.freteOriginal = resultado.frete;
        resultado.frete = 0;
        resultado.mensagem = `Frete grátis para pedidos acima de ${resultado.grátisAcima.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;
    }

    return resultado;
}

// Exemplo de uso:
const cepCliente = "95010-000"; // Caxias do Sul
const valorDoPedido = 180.00;
const frete = calcularFreteLajeado(cepCliente, valorDoPedido);

console.log(`Para ${frete.nome}:`);
console.log(`Frete: R$ ${frete.frete.toFixed(2).replace('.', ',')}`);
console.log(`Prazo: ${frete.prazo}`);
if (frete.mensagem) console.log(frete.mensagem);