import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    optimizeDeps: {
        include: ['jquery'],
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // Página principal
        cadastro: path.resolve(__dirname, 'cadastro.html'), // Outras páginas
        carrinho: path.resolve(__dirname, 'carrinho.html'),
        recover: path.resolve(__dirname, 'recuperar.html'),
        login: path.resolve(__dirname, 'login.html'),
        dados: path.resolve(__dirname, 'meusdados.html'),
        entrega: path.resolve(__dirname, 'entrega.html'),
        pedidos: path.resolve(__dirname, 'pedidos.html'),
        menu: path.resolve(__dirname, 'menu.html'),
        noservicos: path.resolve(__dirname, 'noservicos.html'),
        servicosad: path.resolve(__dirname, 'servicosad.html'),
        servicos: path.resolve(__dirname, 'servicos.html'),
        catalogo: path.resolve(__dirname, 'catalogo.html'),
        produtos: path.resolve(__dirname, 'produtos.html'),
       
        

      },
    },
  },
});
