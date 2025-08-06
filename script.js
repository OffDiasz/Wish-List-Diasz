// Importa os módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // Adicionado setDoc

// ATENÇÃO: Para fins de demonstração e depuração, a configuração do Firebase
// foi incluída diretamente aqui. Em um ambiente de produção real,
// as chaves de API NUNCA devem ser expostas no código do frontend.
// O ideal é que o ambiente do Canvas injete essas variáveis de forma segura.
const firebaseConfig = {
  apiKey: "AIzaSyDP.LcxPSH1Erb7GvQWkgKMwKHMnyP2c", // Sua chave API do screenshot
  authDomain: "wishlistdiasz.firebaseapp.com",
  projectId: "wishlistdiasz",
  storageBucket: "wishlistdiasz.appspot.com",
  messagingSenderId: "353481257616", // Seu Project Number
  appId: "1:353481257616:web:7bb922e70419f1ffde15", // SEU APP ID CORRIGIDO AQUI
  measurementId: "G-DL8ZCZWTMZ" // Adicionado o measurementId
};

// O appId para o caminho do Firestore deve ser o projectId
const appId = firebaseConfig.projectId;

// Log da configuração do Firebase para depuração
console.log('Configuração do Firebase carregada:', firebaseConfig);


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
const signupUsernameInput = document.getElementById('signup-usuario'); // Novo campo
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

let currentUserId = null;
let unsubscribeFromWishlist = null; // Para gerenciar a inscrição do onSnapshot

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
    signupUsernameInput.value = ''; // Limpa o campo de username
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
 * Atualiza a interface do usuário com base no estado de autenticação.
 * @param {Object | null} user - O objeto de usuário do Firebase ou null se deslogado.
 */
async function updateUIForAuthState(user) {
    console.log('Auth state changed. User:', user ? user.uid : 'null');
    if (user) {
        currentUserId = user.uid;
        let usernameToDisplay = user.email; // Padrão é o email

        // Tenta buscar o nome de usuário do Firestore
        try {
            const userDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}`);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().username) {
                usernameToDisplay = userDocSnap.data().username;
            }
        } catch (error) {
            console.warn("Não foi possível buscar o nome de usuário do Firestore:", error);
        }

        userInfoSpan.textContent = `Usuário: ${usernameToDisplay}`; // Exibe o nome de usuário
        authSection.classList.add('hidden');
        wishlistSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        setupRealtimeListener(currentUserId); // Inicia o listener em tempo real
        console.log('Usuário logado. Exibindo wishlist.');
    } else {
        currentUserId = null;
        userInfoSpan.textContent = '';
        authSection.classList.remove('hidden');
        wishlistSection.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        wishlistItemsDiv.innerHTML = '<p class="text-center text-gray-500 col-span-full" id="no-items-message">Nenhum item na sua wishlist ainda. Adicione um!</p>';
        if (unsubscribeFromWishlist) {
            unsubscribeFromWishlist(); // Desinscreve o listener anterior
        }
        showInitialAuthChoices(); // Garante que as opções iniciais sejam mostradas ao deslogar
        console.log('Usuário deslogado. Exibindo opções de autenticação.');
    }
    hideLoading();
}

// --- Funções de Autenticação Firebase ---

/**
 * Tenta logar o usuário com email e senha.
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
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login realizado com sucesso!', 'success');
        console.log('Login bem-sucedido para:', email);
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        let errorMessage = 'Erro ao fazer login. Verifique seu email e senha.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Email ou senha inválidos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de email inválido.';
        }
        showMessage(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Tenta criar uma nova conta de usuário com email e senha.
 */
async function handleSignUp() {
    console.log('Tentando criar conta...');
    showLoading();
    const username = signupUsernameInput.value.trim(); // Captura o nome de usuário
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();

    // Expressão regular para validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password) {
        showMessage('Por favor, preencha o nome de usuário, email e senha para criar a conta.', 'error');
        hideLoading();
        return;
    }
    if (!emailRegex.test(email)) { // Valida o formato do e-mail
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salva o nome de usuário no Firestore em um documento de usuário
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
        await setDoc(userDocRef, {
            email: user.email,
            username: username, // Salva o nome de usuário
            createdAt: new Date()
        }, { merge: true }); // merge: true para não sobrescrever outros campos se existirem

        showMessage('Conta criada com sucesso! Você já está logado.', 'success');
        console.log('Conta criada com sucesso para:', email, 'Username:', username);
    } catch (error) {
        console.error("Erro ao criar conta:", error);
        let errorMessage = 'Erro ao criar conta.';
        if (error.code) {
            errorMessage += ` Código: ${error.code}.`;
        }
        if (error.message) {
            errorMessage += ` Mensagem: ${error.message}.`;
        }

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está em uso. Tente fazer login ou use outro email.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha é muito fraca. Por favor, use uma senha mais forte.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de email inválido.'; // Esta mensagem será sobreposta pela nossa validação customizada se o formato for o problema
        } else if (error.code === 'auth/api-key-not-valid') {
            errorMessage = 'Erro de configuração do Firebase. A chave da API não é válida ou o domínio não está autorizado. Verifique as configurações do seu projeto Firebase e adicione `localhost` e `127.0.0.1` aos domínios autorizados.';
        }
        showMessage(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Desloga o usuário.
 */
async function handleSignOut() {
    console.log('Tentando sair...');
    showLoading();
    try {
        await signOut(auth);
        showMessage('Você saiu com sucesso!', 'success');
        console.log('Usuário saiu.');
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

// --- Funções do Firestore (Wishlist) ---

/**
 * Adiciona um novo item à wishlist do usuário no Firestore.
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
        // Define o caminho da coleção para dados privados do usuário
        const userWishlistRef = collection(db, `artifacts/${appId}/users/${currentUserId}/wishlist`);
        await addDoc(userWishlistRef, {
            name,
            imageUrl,
            productUrl,
            description,
            purchased: false,
            createdAt: new Date()
        });
        // Limpa os campos após adicionar
        itemUrlInput.value = '';
        itemNameInput.value = '';
        itemImageUrlInput.value = '';
        itemDescriptionInput.value = '';
        productPreview.classList.add('hidden'); // Esconde o preview
        previewImage.src = '';
        previewName.textContent = '';

        showMessage('Item adicionado com sucesso!', 'success');
        console.log('Item adicionado ao Firestore.');
    } catch (error) {
        console.error("Erro ao adicionar item:", error);
        showMessage(`Erro ao adicionar item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Exclui um item da wishlist do usuário no Firestore.
 * @param {string} itemId - ID do documento do item a ser excluído.
 */
async function deleteWishlistItem(itemId) {
    if (!currentUserId) return;
    console.log('Excluindo item da wishlist:', itemId);
    showLoading();
    try {
        const itemRef = doc(db, `artifacts/${appId}/users/${currentUserId}/wishlist`, itemId);
        await deleteDoc(itemRef);
        showMessage('Item excluído com sucesso!', 'success');
        console.log('Item excluído do Firestore.');
    } catch (error) {
        console.error("Erro ao excluir item:", error);
        showMessage(`Erro ao excluir item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Alterna o status de "comprado" de um item na wishlist.
 * @param {string} itemId - ID do documento do item.
 * @param {boolean} isPurchased - O novo status de comprado.
 */
async function togglePurchased(itemId, isPurchased) {
    if (!currentUserId) return;
    console.log('Alternando status de comprado para item:', itemId, 'para', isPurchased);
    showLoading();
    try {
        const itemRef = doc(db, `artifacts/${appId}/users/${currentUserId}/wishlist`, itemId);
        await updateDoc(itemRef, {
            purchased: isPurchased
        });
        showMessage(`Item marcado como ${isPurchased ? 'comprado' : 'não comprado'}!`, 'success');
        console.log('Status de comprado atualizado no Firestore.');
    } catch (error) {
        console.error("Erro ao atualizar item:", error);
        showMessage(`Erro ao atualizar item: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Renderiza a lista de itens da wishlist no DOM.
 * @param {Array<Object>} items - Array de objetos de item da wishlist.
 */
function renderWishlist(items) {
    console.log('Renderizando wishlist. Itens:', items.length);
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
                <img src="${item.imageUrl || 'https://placehold.co/400x200/2d2d2d/e0e0e0?text=Sem+Imagem'}"
                     alt="${item.name}"
                     class="object-cover w-full h-full"
                     onerror="this.onerror=null;this.src='https://placehold.co/400x200/2d2d2d/e0e0e0?text=Sem+Imagem';">
            </div>
            <h3 class="text-xl font-semibold text-blue-400">${item.name}</h3>
            ${item.description ? `<p class="text-sm text-gray-400 flex-grow">${item.description}</p>` : ''}
            ${item.productUrl ? `<a href="${item.productUrl}" target="_blank" class="text-red-500 hover:underline text-sm"><i class="fas fa-external-link-alt mr-1"></i>Ver Produto</a>` : ''}
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

/**
 * Configura o listener em tempo real para a wishlist do usuário.
 * @param {string} userId - O ID do usuário logado.
 */
function setupRealtimeListener(userId) {
    console.log('Configurando listener em tempo real para o usuário:', userId);
    if (unsubscribeFromWishlist) {
        unsubscribeFromWishlist(); // Desinscreve qualquer listener anterior
        console.log('Listener anterior desinscrito.');
    }
    const userWishlistRef = collection(db, `artifacts/${appId}/users/${userId}/wishlist`);
    // Ordena por data de criação para exibir os mais novos primeiro
    const q = query(userWishlistRef); // Firestore não suporta orderBy sem índice, então vamos ordenar no JS.

    unsubscribeFromWishlist = onSnapshot(q, (snapshot) => {
        console.log('Atualização de snapshot do Firestore recebida.');
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        // Ordena os itens por data de criação no JavaScript
        items.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        renderWishlist(items);
    }, (error) => {
        console.error("Erro ao ouvir a wishlist:", error);
        showMessage(`Erro ao carregar wishlist: ${error.message}`, 'error');
    });
}

// --- Event Listeners ---

// Listeners para mostrar os formulários específicos
showLoginFormBtn.addEventListener('click', () => {
    console.log('Botão "Já tenho uma conta (Entrar)" clicado.');
    showLoginForm();
});
showSignupFormBtn.addEventListener('click', () => {
    console.log('Botão "Quero criar uma conta" clicado.');
    showSignupForm();
});

// Listeners para os botões de voltar
backToChoicesFromLoginBtn.addEventListener('click', () => {
    console.log('Botão "Voltar" do login clicado.');
    showInitialAuthChoices();
});
backToChoicesFromSignupBtn.addEventListener('click', () => {
    console.log('Botão "Voltar" do cadastro clicado.');
    showInitialAuthChoices();
});

// Listeners para os botões de submissão dos formulários
loginSubmitBtn.addEventListener('click', () => {
    console.log('Botão "Entrar" do formulário de login clicado.');
    handleLogin();
});
signupSubmitBtn.addEventListener('click', () => {
    console.log('Botão "Criar Conta" do formulário de cadastro clicado.');
    handleSignUp();
});

// Listener para o botão de sair
logoutBtn.addEventListener('click', () => {
    console.log('Botão "Sair" clicado.');
    handleSignOut();
});

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
    console.log('Formulário de adicionar item submetido.');
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
closeModalBtn.addEventListener('click', () => {
    console.log('Botão "OK" do modal de mensagem clicado.');
    hideMessage();
});

// --- Inicialização ---

// Observa mudanças no estado de autenticação do Firebase
onAuthStateChanged(auth, (user) => {
    console.log('Estado de autenticação do Firebase alterado.');
    updateUIForAuthState(user);
});

// Garante que as opções iniciais de autenticação sejam mostradas ao carregar a página
// se o usuário não estiver logado.
window.onload = () => {
    console.log('Página carregada. Verificando estado de autenticação inicial.');
    if (!auth.currentUser) {
        showInitialAuthChoices();
    }
};
