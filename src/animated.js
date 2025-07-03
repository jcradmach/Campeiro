import { auth, database, ref, set, push, get, update, remove, child, storageRef, uploadBytes, getDownloadURL, storage } from "./main.js";

// animated.js
document.addEventListener('DOMContentLoaded', function() {
    loadUltimasPostagens();

    // Configuração do Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    // Função de callback para o observer
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                const sectionId = section.id;
                
                // Animação específica para cada seção
                switch(sectionId) {
                    case 'services':
                        animateServices(section);
                        break;
                    case 'about':
                        animateAbout(section);
                        break;
                    case 'categorias':
                        animateCategorias(section);
                        break;
                    case 'contact':
                        animateContact(section);
                        break;
                    case 'products':
                        animateProducts(section);
                        break;
                        
                }
                
                // Para de observar após a animação
                observer.unobserve(section);
            }
        });
    };

    // Cria o observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observa todas as seções
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
        observer.observe(section);
        
        // Esconde os elementos animáveis inicialmente
        hideAnimatableElements(section);
    });
  
});

function hideAnimatableElements(section) {
    const elements = section.querySelectorAll('.section-title, .service-card, .about-text, .about-image, .stat, .portfolio-item, .contact-info, .contact-form, .contact-item');
    elements.forEach(el => {
        el.style.opacity = '0';
    });
}

function animateServices(section) {
    const title = section.querySelector('.section-title');
    if (title) {
        title.style.opacity = '1';
        title.classList.add('animated');
    }
    
    const serviceCards = section.querySelectorAll('.blog-card');
    serviceCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.classList.add('animated');
        }, index * 500);
    });
}

function animateCategorias(section) {
    const title = section.querySelector('.section-title');
    if (title) {
        title.style.opacity = '1';
        title.classList.add('animated');
    }
    
    const serviceCards = section.querySelectorAll('.categoria-card');
    serviceCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.classList.add('animated');
        }, index * 500);
    });
}

function animateProducts(section) {
    const title = section.querySelector('.section-title');
    if (title) {
        title.style.opacity = '1';
        title.classList.add('animated');
    }
    
    const serviceCards = section.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.classList.add('animated');
        }, index *500);
    });
}

function animateAbout(section) {
    const title = section.querySelector('.section-title');
    if (title) {
        title.style.opacity = '1';
        title.classList.add('animated');
    }
    
    const aboutText = section.querySelector('.about-text');
    const aboutImage = section.querySelector('.about-image');
    
    if (aboutText) {
        aboutText.style.opacity = '1';
        aboutText.classList.add('animated');
    }
    if (aboutImage) {
        aboutImage.style.opacity = '1';
        aboutImage.classList.add('animated');
    }
    
    const stats = section.querySelectorAll('.stat');
    stats.forEach((stat, index) => {
        setTimeout(() => {
            stat.style.opacity = '1';
            stat.classList.add('animated');
        }, index * 500);
    });
}

function animatePortfolio(section) {
    const title = section.querySelector('.section-title');
    if (title) {
        title.style.opacity = '1';
        title.classList.add('animated');
    }
    
    const portfolioItems = section.querySelectorAll('.portfolio-item');
    portfolioItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.classList.add('animated');
        }, index * 400);
    });
}

function animateContact(section) {
    const title = section.querySelector('.section-title');
    if (title) {
        title.style.opacity = '1';
        title.classList.add('animated');
    }
    
    const contactInfo = section.querySelector('.contact-info');
    const contactForm = section.querySelector('.contact-logo');
    
    if (contactInfo) {
        contactInfo.style.opacity = '1';
        contactInfo.classList.add('animated');
    }
    if (contactForm) {
        contactForm.style.opacity = '1';
        contactForm.classList.add('animated');
    }
    
    const contactItems = section.querySelectorAll('.contact-item');
    contactItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.classList.add('animated');
        }, index * 500);
    });
}

async function loadUltimasPostagens() {
    try {
        const postagensRef = ref(database, 'postagens');
        const snapshot = await get(postagensRef);
        
        if (!snapshot.exists()) {
            console.log("Nenhuma postagem encontrada");
            return;
        }

        // Converte para array e ordena por timestamp (decrescente)
        const postagens = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Pega as 3 mais recentes
        const ultimasPostagens = postagens.slice(0, 3);
        const servicesSection = document.getElementById('blogGrid');
        

        // Limpa o container antes de adicionar (se já houver cards)
        servicesSection.innerHTML = '';

        // Cria e adiciona os cards
        ultimasPostagens.forEach(postagem => {
            const card = document.createElement('article');
            card.className = 'blog-card';
            card.dataset.category = postagem.categoria?.toLowerCase() || 'geral';
            
            // Formata a data do timestamp
            const dataFormatada = formatarDataFromTimestamp(postagem.data);
            
            card.innerHTML = `
                <div class="blog-card-image">
                    <img src="${postagem.urlImagem || 'src/img/placeholder-post.jpg'}" 
                         alt="${postagem.nome}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="blog-card-content">
                    <h3>${postagem.nome || 'Sem título'}</h3>
                    <p>${postagem.resumo || 'Sem conteúdo'}</p>
                    <div class="blog-card-meta">
                        <span>${dataFormatada}</span>
                        <a href="${postagem.link || '#'}" class="read-more">Ler Mais</a>
                    </div>
                </div>
            `;
            
            servicesSection.appendChild(card, document.querySelector('.view-more'));
        });

    } catch (error) {
        console.error("Erro ao carregar últimas postagens:", error);
    }
}

// Função para formatar timestamp para "dia mês ano"
function formatarDataFromTimestamp(timestamp) {
    if (!timestamp) return 'Data não disponível';
    
    const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const data = new Date(timestamp);
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    
    return `${dia} ${mes} ${ano}`;
}


