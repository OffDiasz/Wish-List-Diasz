// Importa o cliente Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ATENÇÃO: Substitua estes valores pelas suas credenciais do Supabase.
// Em um ambiente de produção real, estas chaves NUNCA devem ser expostas diretamente no frontend.
// Use variáveis de ambiente ou um proxy de backend.
const SUPABASE_URL = 'https://efomrlywiewbunbdnyqg.supabase.co'; // Ex: https://abcdefg.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmb21ybHl3aWV3YnVuYmRueXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTcxMTIsImV4cCI6MjA3MDA3MzExMn0.G02RHhwi3x9Y43Uv0WOWmre_0_YIkjTatLm-w33gj0k'; // Ex: eyJhbGciOiJIUzI1Ni...

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referências aos elementos do DOM
const authSection = document.getElementById('auth-section');
const wishlistSection = document.getElementById('wishlist-section');
const initialAuthChoicesDiv = document.getElementById('initial-auth-choices');
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');

const showLoginFormBtn = document.getElementById('show-login-form-btn');
const showSignupFormBtn = document.getElementById('show-signup-form-btn');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const signupSubmitBtn = document.getElementById('signup-submit-btn');
const backToChoicesFromLoginBtn = document.getElementById('back-to-choices-from-login');
const backToChoicesFromSignupBtn = document.getElementById('back-to-choices-from-signup');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupUsernameInput = document.getElementById('signup-usuario');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');

const logoutBtn = document.getElementById('logout-btn');
const userInfoSpan = document.getElementById('user-info');
const addItemForm = document.getElementById('add-item-form');
const itemUrlInput = document.getElementById('item-url-input');
const fetchProductBtn = document.getElementById('fetch-product-btn');
const productPreview = document.getElementById('product-preview');
const previewImage = document.getElementById('preview-image');
const previewName = document.getElementById('preview-name');
const itemNameInput = document.getElementById('item-name');
const itemImageUrlInput = document.getElementById('item-image-url');
const itemDescriptionInput = document.getElementById('item-description');
const wishlistItemsDiv = document.getElementById('wishlist-items');
const noItemsMessage = document.getElementById('no-items-message');
const messageModal = document.getElementById('message-modal');
const modalMessage = document.getElementById('modal-message');
const closeModalBtn = document.getElementById('close-modal-btn');
const loadingSpinner = document.getElementById('loading-spinner');

let currentUserId = null; // ID do usuário Supabase
let currentUsername = null; // Nome de usuário Supabase

// --- Funções de UI ---

/**
 * Exibe o spinner de carregamento.
 */
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

/**
 * Esconde o spinner de carregamento.
 */
function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

/**
 * Exibe uma mensagem em um modal.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success' | 'error'} type - O tipo de mensagem para estilização.
 */
function showMessage(message, type) {
    modalMessage.textContent = message;
    if (type === 'success') {
        modalMessage.classList.remove('text-red-500');
        modalMessage.classList.add('text-green-500');
    } else if (type === 'error') {
        modalMessage.classList.remove('text-green-500');
        modalMessage.classList.add('text-red-500');
    }
    messageModal.classList.remove('hidden');
}

/**
 * Esconde o modal de mensagem.
 */
function hideMessage() {
    messageModal.classList.add('hidden');
}

/**
 * Mostra as opções iniciais de login/cadastro e esconde os formulários.
 */
function showInitialAuthChoices() {
    initialAuthChoicesDiv.classList.remove('hidden');
    loginFormContainer.classList.add('hidden');
    signupFormContainer.classList.add('hidden');
    // Limpa os campos de email e senha ao voltar
    loginEmailInput.value = '';
    loginPasswordInput.value = '';
    signupUsernameInput.value = '';
    signupEmailInput.value = '';
    signupPasswordInput.value = '';
    console.log('Mostrando opções iniciais de autenticação.');
}

/**
 * Mostra o formulário de login e esconde as outras seções de autenticação.
 */
function showLoginForm() {
    initialAuthChoicesDiv.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    signupFormContainer.classList.add('hidden');
    console.log('Mostrando formulário de login.');
}

/**
 * Mostra o formulário de cadastro e esconde as outras seções de autenticação.
 */
function showSignupForm() {
    initialAuthChoicesDiv.classList.add('hidden');
    loginFormContainer.classList.add('hidden');
    signupFormContainer.classList.remove('hidden');
    console.log('Mostrando formulário de cadastro.');
}

/**
 * Atualiza a interface do usuário com base no estado de autenticação do Supabase.
 * @param {Object | null} session - O objeto de sessão do Supabase ou null se deslogado.
 */
async function updateUIForAuthState(session) {
    console.log('Auth state changed. Session:', session ? session.user.id : 'null');
    if (session) {
        currentUserId = session.user.id;
        let usernameToDisplay = session.user.email; // Padrão é o email

        // Tenta buscar o nome de usuário da tabela 'users' no Supabase
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('username')
                .eq('id', currentUserId)
                .single();

            if (userError) throw userError;

            if (userData && userData.username) {
                usernameToDisplay = userData.username;
                currentUsername = userData.username;
            } else {
                currentUsername = session.user.email;
            }
        } catch (error) {
            console.warn("Não foi possível buscar o nome de usuário do Supabase:", error.message);
            currentUsername = session.user.email;
        }

        userInfoSpan.textContent = `Usuário: ${usernameToDisplay}`;
        authSection.classList.add('hidden');
        wishlistSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loadWishlistItems(); // Carrega os itens da wishlist para o usuário logado
        console.log('Usuário logado. Exibindo wishlist.');
    } else {
        currentUserId = null;
        currentUsername = null;
        userInfoSpan.textContent = '';
        authSection.classList.remove('hidden');
        wishlistSection.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        wishlistItemsDiv.innerHTML = '<p class="text-center text-gray-500 col-span-full" id="no-items-message">Nenhum item na sua wishlist ainda. Adicione um!</p>';
        showInitialAuthChoices(); // Garante que as opções iniciais sejam mostradas ao deslogar
        console.log('Usuário deslogado. Exibindo opções de autenticação.');
    }
    hideLoading();
}

// --- Funções de Autenticação Supabase ---

/**
 * Tenta logar o usuário com email e senha no Supabase.
 */
async function handleLogin() {
    console.log('Tentando fazer login...');
    showLoading();
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if (!email || !password) {
        showMessage('Por favor, preencha o email e a senha.', 'error');
        hideLoading();
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        showMessage('Login realizado com sucesso!', 'success');
        console.log('Login bem-sucedido para:', data.user.email);
        // updateUIForAuthState será chamado pelo listener onAuthStateChange
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        let errorMessage = 'Erro ao fazer login. Verifique seu email e senha.';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou senha inválidos.';
        }
        showMessage(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Tenta criar uma nova conta de usuário no Supabase.
 */
async function handleSignUp() {
    console.log('Tentando criar conta...');
    showLoading();
    const username = signupUsernameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password) {
        showMessage('Por favor, preencha o nome de usuário, email e senha para criar a conta.', 'error');
        hideLoading();
        return;
    }
    if (!emailRegex.test(email)) {
        showMessage('Formato de e-mail inválido. Exemplo: seu.email@exemplo.com', 'error');
        hideLoading();
        return;
    }
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
        hideLoading();
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Após criar a conta no auth.users, salva o nome de usuário na tabela 'users'
        // É importante que a política de RLS para INSERT na tabela 'users' permita isso.
        const { error: insertError } = await supabase
            .from('users')
            .insert([
                { id: data.user.id, username: username, email: email }
            ]);

        if (insertError) throw insertError;

        showMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar a conta.', 'success');
        console.log('Conta criada com sucesso para:', data.user.email, 'Username:', username);
        // updateUIForAuthState será chamado pelo listener onAuthStateChange após a confirmação do email
    } catch (error) {
        console.error("Erro ao criar conta:", error);
        let errorMessage = 'Erro ao criar conta.';
        if (error.message.includes('User already registered')) {
            errorMessage = 'Este email já está em uso. Tente fazer login ou use outro email.';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'A senha é muito fraca. Por favor, use uma senha mais forte.';
        } else if (error.message.includes('Invalid email address')) {
            errorMessage = 'Formato de email inválido.';
        }
        showMessage(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Desloga o usuário do Supabase.
 */
async function handleSignOut() {
    console.log('Tentando sair...');
    showLoading();
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showMessage('Você saiu com sucesso!', 'success');
        console.log('Usuário saiu.');
        // updateUIForAuthState será chamado pelo listener onAuthStateChange
    } catch (error) {
        console.error("Erro ao sair:", error);
        showMessage(`Erro ao sair: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// --- Funções de Web Scraping (Backend Python) ---

/**
 * Busca informações do produto (nome e imagem) de uma URL usando o servidor Python.
 * @param {string} url - A URL do produto.
 * @returns {Promise<{name: string, imageUrl: string}>} - Nome e URL da imagem do produto.
 */
async function fetchProductInfo(url) {
    showLoading();
    try {
        // O endpoint do seu servidor Flask Python
        const backendUrl = 'http://127.0.0.1:5000/scrape'; // Altere a porta se o seu servidor Python rodar em outra
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na busca: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Erro ao buscar informações do produto:", error);
        showMessage(`Erro ao buscar informações do produto: ${error.message}. Certifique-se de que o servidor Python está rodando e a URL é válida.`, 'error');
        return { name: '', imageUrl: '' }; // Retorna vazio em caso de erro
    } finally {
        hideLoading();
    }
}

// --- Funções do Banco de Dados Supabase (Wishlist) ---

/**
 * Adiciona um novo item à wishlist do usuário no Supabase.
 * @param {string} name - Nome do produto.
 * @param {string} imageUrl - URL da imagem do produto.
 * @param {string} productUrl - URL do produto.
 * @param {string} description - Descrição do produto.
 */
async function addWishlistItem(name, imageUrl, productUrl, description) {
    if (!currentUserId) {
        showMessage('Você precisa estar logado para adicionar itens.', 'error');
        return;
    }
    console.log('Adicionando item à wishlist...');
    showLoading();
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .insert([
                {
                    user_id: currentUserId, // Supabase usa user_id para referenciar auth.users.id
                    name,
                    image_url: imageUrl, // Supabase usa snake_case por convenção
                    product_url: productUrl,
                    description,
                    purchased: false,
                }
            ]);

        if (error) throw error;

        // Limpa os campos após adicionar
        itemUrlInput.value = '';
        itemNameInput.value = '';
        itemImageUrlInput.value = '';
        itemDescriptionInput.value = '';
        productPreview.classList.add('hidden'); // Esconde o preview
        previewImage.src = '';
        previewName.textContent = '';

        showMessage('Item adicionado com sucesso!', 'success');
        console.log('Item adicionado ao Supabase.');
        loadWishlistItems(); // Recarrega a lista para mostrar o novo item
    } catch (error) {
        console.error("Erro ao adicionar item:", error);
        showMessage(`Erro ao adicionar item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Exclui um item da wishlist do usuário no Supabase.
 * @param {number} itemId - ID do item a ser excluído.
 */
async function deleteWishlistItem(itemId) {
    if (!currentUserId) return;
    console.log('Excluindo item da wishlist:', itemId);
    showLoading();
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('id', itemId)
            .eq('user_id', currentUserId); // Garante que apenas o próprio usuário pode excluir

        if (error) throw error;

        showMessage('Item excluído com sucesso!', 'success');
        console.log('Item excluído do Supabase.');
        loadWishlistItems(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao excluir item:", error);
        showMessage(`Erro ao excluir item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Alterna o status de "comprado" de um item na wishlist no Supabase.
 * @param {number} itemId - ID do item.
 * @param {boolean} isPurchased - O novo status de comprado.
 */
async function togglePurchased(itemId, isPurchased) {
    if (!currentUserId) return;
    console.log('Alternando status de comprado para item:', itemId, 'para', isPurchased);
    showLoading();
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .update({ purchased: isPurchased })
            .eq('id', itemId)
            .eq('user_id', currentUserId); // Garante que apenas o próprio usuário pode atualizar

        if (error) throw error;

        showMessage(`Item marcado como ${isPurchased ? 'comprado' : 'não comprado'}!`, 'success');
        console.log('Status de comprado atualizado no Supabase.');
        loadWishlistItems(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao atualizar item:", error);
        showMessage(`Erro ao atualizar item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Carrega e renderiza os itens da wishlist para o usuário atual do Supabase.
 */
async function loadWishlistItems() {
    if (!currentUserId) {
        console.log('Nenhum usuário logado para carregar a wishlist.');
        wishlistItemsDiv.innerHTML = '<p class="text-center text-gray-500 col-span-full" id="no-items-message">Nenhum item na sua wishlist ainda. Adicione um!</p>';
        return;
    }
    console.log('Carregando itens da wishlist para o usuário:', currentUserId);
    showLoading();
    try {
        const { data: items, error } = await supabase
            .from('wishlist_items')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false }); // Ordena por data de criação

        if (error) throw error;

        renderWishlist(items);
        console.log('Itens da wishlist carregados e renderizados.');
    } catch (error) {
        console.error("Erro ao carregar itens da wishlist:", error);
        showMessage(`Erro ao carregar wishlist: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Renderiza a lista de itens da wishlist no DOM.
 * @param {Array<Object>} items - Array de objetos de item da wishlist.
 */
function renderWishlist(items) {
    wishlistItemsDiv.innerHTML = ''; // Limpa a lista existente
    if (items.length === 0) {
        wishlistItemsDiv.innerHTML = '<p class="text-center text-gray-500 col-span-full">Nenhum item na sua wishlist ainda. Adicione um!</p>';
        return;
    }

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.id = `item-${item.id}`;
        itemElement.classList.add('card', 'p-4', 'flex', 'flex-col', 'space-y-3', 'relative', 'wishlist-item');
        if (item.purchased) {
            itemElement.classList.add('purchased');
        }

        itemElement.innerHTML = `
            <div class="flex-shrink-0 w-full h-48 bg-gray-800 rounded-md overflow-hidden flex items-center justify-center mb-3">
                <img src="${item.image_url || 'https://placehold.co/400x200/2d2d2d/e0e0e0?text=Sem+Imagem'}"
                     alt="${item.name}"
                     class="object-cover w-full h-full"
                     onerror="this.onerror=null;this.src='https://placehold.co/400x200/2d2d2d/e0e0e0?text=Sem+Imagem';">
            </div>
            <h3 class="text-xl font-semibold text-blue-400">${item.name}</h3>
            ${item.description ? `<p class="text-sm text-gray-400 flex-grow">${item.description}</p>` : ''}
            ${item.product_url ? `<a href="${item.product_url}" target="_blank" class="text-red-500 hover:underline text-sm"><i class="fas fa-external-link-alt mr-1"></i>Ver Produto</a>` : ''}
            <div class="flex justify-between items-center mt-auto pt-3 border-t border-gray-700">
                <button data-id="${item.id}" data-purchased="${item.purchased}"
                        class="toggle-purchased-btn text-sm px-3 py-1 rounded-full ${item.purchased ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white transition-colors">
                            <i class="fas fa-check-circle mr-1"></i>${item.purchased ? 'Comprado' : 'Marcar como Comprado'}
                        </button>
                <button data-id="${item.id}"
                        class="delete-item-btn text-red-500 hover:text-red-700 text-lg transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        wishlistItemsDiv.appendChild(itemElement);
    });

    // Adiciona event listeners aos botões de cada item
    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.currentTarget.dataset.id;
            console.log('Botão de excluir clicado para o item:', itemId);
            deleteWishlistItem(itemId);
        });
    });

    document.querySelectorAll('.toggle-purchased-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.currentTarget.dataset.id;
            const isPurchased = e.currentTarget.dataset.purchased === 'true';
            console.log('Botão de marcar como comprado clicado para o item:', itemId, 'status atual:', isPurchased);
            togglePurchased(itemId, !isPurchased);
        });
    });
}

// --- Event Listeners ---

// Listeners para mostrar os formulários específicos
showLoginFormBtn.addEventListener('click', showLoginForm);
showSignupFormBtn.addEventListener('click', showSignupForm);

// Listeners para os botões de voltar
backToChoicesFromLoginBtn.addEventListener('click', showInitialAuthChoices);
backToChoicesFromSignupBtn.addEventListener('click', showInitialAuthChoices);

// Listeners para os botões de submissão dos formulários
loginSubmitBtn.addEventListener('click', handleLogin);
signupSubmitBtn.addEventListener('click', handleSignUp);

// Listener para o botão de sair
logoutBtn.addEventListener('click', handleSignOut);

// Listener para o botão "Buscar Info" (Web Scraping)
fetchProductBtn.addEventListener('click', async () => {
    const url = itemUrlInput.value.trim();
    if (url) {
        const productInfo = await fetchProductInfo(url);
        if (productInfo.name || productInfo.imageUrl) {
            itemNameInput.value = productInfo.name;
            itemImageUrlInput.value = productInfo.imageUrl;
            previewImage.src = productInfo.imageUrl || 'https://placehold.co/100x100/2d2d2d/e0e0e0?text=Sem+Imagem';
            previewName.textContent = productInfo.name || 'Nome não encontrado';
            productPreview.classList.remove('hidden');
        } else {
            showMessage('Não foi possível encontrar informações para esta URL. Por favor, preencha manualmente.', 'error');
            productPreview.classList.add('hidden');
        }
    } else {
        showMessage('Por favor, insira um link de produto para buscar informações.', 'error');
    }
});

// Listener para o formulário de adicionar item
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const url = itemUrlInput.value.trim();
    const imageUrl = itemImageUrlInput.value.trim();
    const description = itemDescriptionInput.value.trim();

    if (name) {
        addWishlistItem(name, imageUrl, url, description);
    } else {
        showMessage('O nome do item é obrigatório!', 'error');
    }
});

// Listener para fechar o modal de mensagem
closeModalBtn.addEventListener('click', hideMessage);

// --- Inicialização ---

// Listener de estado de autenticação do Supabase
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase Auth state changed:', event, session);
    updateUIForAuthState(session);
});

// Garante que as opções iniciais de autenticação sejam mostradas ao carregar a página
// se o usuário não estiver logado.
window.onload = async () => {
    showLoading();
    // Tenta obter a sessão atual ao carregar a página
    const { data: { session } } = await supabase.auth.getSession();
    updateUIForAuthState(session);
};
