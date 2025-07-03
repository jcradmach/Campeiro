
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut,  updateProfile } from "firebase/auth";
import { database, ref, set, push, get, update, remove, auth } from "./main.js";
import {atualizarContadorCarrinho} from "./database.js"

// Cadastro de usuário

// Logout do usuário
document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "catalogo.html";
});

// Logout do usuário
document.getElementById("logout-btnm")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "catalogo.html";
});


auth.onAuthStateChanged((user) => {
    console.log('inicia');

    const adminIcons = document.getElementById('adminicons');
    if (adminIcons) {
        if (user && user.uid === 'ssASMtFeMxMZKthSwRmdkzTR1Lw2') {
            adminIcons.style.display = 'flex';
        } else {
            adminIcons.style.display = 'none';
        }
    }
    if (user) {
        const authbutton = document.getElementById('auth-buttons');
        const userinfo = document.getElementById('user-info');
        const usernm = document.getElementById('user-name');
        const logoutbtn = document.getElementById('logout-btn');
        const authbuttonm = document.getElementById('auth-buttonsm');
        const userinfom = document.getElementById('user-infom');
        const usernmm = document.getElementById('user-namem');
        const logoutbtnm = document.getElementById('logout-btnm');

        if (authbutton) authbutton.classList.add('d-none');
        if (userinfo) userinfo.classList.remove('d-none');
        if (authbutton) logoutbtn.classList.remove('d-none');
        if (usernm) {
            usernm.textContent = user.displayName ?
                user.displayName.split(' ')[0] :
                (user.name ? user.name.split(' ')[0] : '');
        }
        if (authbuttonm) authbuttonm.classList.add('d-none');
        if (userinfom) userinfom.classList.remove('d-none');
        if (authbuttonm) logoutbtnm.classList.remove('d-none');
        if (usernmm) {
            usernmm.textContent = user.displayName ?
                user.displayName.split(' ')[0] :
                (user.name ? user.name.split(' ')[0] : '');
        }
        atualizarContadorCarrinho();

        // Carrega informações adicionais do usuário
        
    } else {
        const authbutton = document.getElementById('auth-buttons');
        const userinfo = document.getElementById('user-info');
        const authbuttonm = document.getElementById('auth-buttonsm');
        const userinfom = document.getElementById('user-infom');
        // Usuário não logado
        if (authbutton) authbutton.classList.remove('d-none');
        if (userinfo) userinfo.classList.add('d-none');
        if (authbuttonm) authbuttonm.classList.remove('d-none');
        if (userinfom) userinfom.classList.add('d-none');
        
    }
});
const telefone = document.getElementById('telefone');

if(telefone) {
telefone.addEventListener('input', function(e) {
    // Remove tudo que não é dígito
    let value = e.target.value.replace(/\D/g, '');
    
    // Remove o 9 adicional se for o primeiro dígito do número
    if (value.length === 11 && value[2] === '9') {
        value = value.substring(0, 2) + value.substring(3);
        alert("Removemos automaticamente o dígito 9 adicional. Seu número foi registrado sem ele.");
    }
    
    // Limita a 10 dígitos (DDD + número)
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    
    // Formatação: (51) 9874-5632
    if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6, 10)}`;
    }
    
    e.target.value = value;


    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        
        // Limita a 11 dígitos
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        // Formatação: 123.456.789-09
        if (value.length > 3) {
            value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
        }
        
        e.target.value = value;
    });
});
}

document.getElementById("cadastro-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obter valores
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const cpf = document.getElementById("cpf").value.replace(/\D/g, '');
    const telefone = "55" + document.getElementById("telefone").value.replace(/[^\d]/g, '');
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;
    const mensagem = document.getElementById("cadastro-message");

    // Validações
    if (senha !== confirmarSenha) {
        mensagem.innerHTML = '<p class="text-danger">As senhas não coincidem.</p>';
        return;
    }

    if (cpf.length !== 11) {
        mensagem.innerHTML = '<p class="text-danger">CPF inválido. Deve conter 11 dígitos.</p>';
        return;
    }


    // Validações (mantenha as que você já tem)

    try {
        // 1. Criar usuário no Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // 2. Atualizar o perfil (AGORA COM TRY-CATCH SEPARADO)
        try {
            await updateProfile(user, {
                displayName: nome,
                // photoURL: "URL_DA_FOTO_SE_DESEJAR" // Opcional
            });
            console.log("Perfil atualizado com sucesso!");
        } catch (profileError) {
            console.error("Erro ao atualizar perfil:", profileError);
            // Não bloqueia o cadastro se falhar apenas a atualização do profile
        }

        // 3. Salvar no Realtime Database (AGORA COM TRY-CATCH SEPARADO)
        try {
            await set(ref(database, 'users/' + user.uid), {
                nome: nome,
                email: email,
                cpf: cpf,
                telefone: telefone,
                dataCadastro: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });
            console.log("Dados salvos no Realtime Database!");
        } catch (dbError) {
            console.error("Erro ao salvar no banco de dados:", dbError);
            throw dbError; // Re-lança o erro para ser capturado no catch externo
        }

        // Criar o elemento toast
const toast = document.createElement('div');
toast.className = 'toast show position-fixed start-50 translate-middle-x text-white bg-success';
toast.style.zIndex = '1100';
toast.style.top = '20px';
toast.innerHTML = `
  <div class="d-flex">
    <div class="toast-body">
      Cadastro realizado com sucesso!
    </div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
  </div>
`;

// Adicionar o toast ao corpo do documento
document.body.appendChild(toast);

// Remover o toast após 2 segundos e redirecionar
setTimeout(() => {
  toast.remove();
  window.location.href = "homepage.html";
}, 2000);

    } catch (error) {
        let mensagemErro = "Ocorreu um erro ao realizar o cadastro.";
    
        if (error.code === 'auth/email-already-in-use') {
            mensagemErro = `
                Este e-mail já está cadastrado.
                <br>
                <a href="recuperar.html" class="text-decoration-underline text-primary">Esqueci minha senha</a>
            `;
        } else if (error.code === 'auth/invalid-email') {
            mensagemErro = "E-mail inválido.";
        } else if (error.code === 'auth/weak-password') {
            mensagemErro = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.code === 'auth/network-request-failed') {
            mensagemErro =  `
            Este e-mail já está cadastrado.
            <br>
            <a href="recuperar.html" class="text-decoration-underline text-primary">Esqueci minha senha</a>
        `;
        }
    
        mensagem.innerHTML = `<p class="text-danger">${mensagemErro}</p>`;
    }
});

// Login do usuário
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("login-message");

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        mensagem.innerHTML = '<p class="text-success">Login realizado com sucesso!</p>';
        setTimeout(() => {
            window.location.href = "index.html"; // Redireciona para uma página autenticada
        }, 2000);
    } catch (error) {
        mensagem.innerHTML = `<p class="text-danger">${error.message}</p>`;
    }
});


// Recuperação de senha
document.getElementById("recovery-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("recovery-email").value;
    const mensagem = document.getElementById("recovery-message");

    try {
        await sendPasswordResetEmail(auth, email);
        mensagem.innerHTML = '<p class="text-success">E-mail de recuperação enviado!</p>';
    } catch (error) {
        mensagem.innerHTML = `<p class="text-danger">${error.message}</p>`;
    }
});
