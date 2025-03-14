// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let configData = {
    geral: {
        idioma: 'pt-BR',
        tema: 'light',
        itensPorPagina: 10,
        formatoData: 'dd/mm/yyyy',
        formatoMoeda: 'BRL',
        notificacoes: {
            email: true,
            sistema: true,
            browser: false
        }
    },
    empresa: {
        nome: 'Kauan Lauer Tech',
        cnpj: '',
        ie: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        telefone: '',
        email: '',
        website: '',
        logo: 'https://cdn-icons-png.flaticon.com/512/3682/3682323.png'
    }
};

let categoriasData = {
    servicos: [
        'Formatação',
        'Instalação Windows',
        'Limpeza',
        'Instalação Software',
        'Criação Site',
        'Criação Sistema',
        'Manutenção',
        'Outros'
    ],
    receitas: [
        'Serviço',
        'Venda de Produto',
        'Consultoria',
        'Manutenção',
        'Suporte',
        'Desenvolvimento',
        'Outros'
    ],
    despesas: [
        'Material',
        'Equipamento',
        'Software',
        'Aluguel',
        'Energia',
        'Internet',
        'Telefone',
        'Transporte',
        'Alimentação',
        'Impostos',
        'Salários',
        'Marketing',
        'Outros'
    ]
};

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando módulo de configurações...");
    
    // Carregar configurações salvas
    carregarConfiguracoesSalvas();
    
    // Configurar navegação do menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Configurar navegação por abas
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            showConfigTab(tabType);
        });
    });
    
    // Configurar navegação nas abas de categorias
    document.querySelectorAll('.categoria-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.catTab;
            showCategoriaTab(tabType);
        });
    });
    
    // Configurar botões de ação
    document.getElementById('btn-save-config-geral').addEventListener('click', salvarConfiguracoesGerais);
    document.getElementById('btn-reset-config-geral').addEventListener('click', resetarConfiguracoesGerais);
    document.getElementById('btn-save-empresa').addEventListener('click', salvarDadosEmpresa);
    
    // Configurar ações para categorias
    document.getElementById('btn-add-categoria').addEventListener('click', adicionarCategoriaServico);
    document.getElementById('btn-add-categoria-receita').addEventListener('click', adicionarCategoriaReceita);
    document.getElementById('btn-add-categoria-despesa').addEventListener('click', adicionarCategoriaDespesa);
    
    // Configurar botões de edição e exclusão para categorias existentes
    configurarBotoesCategoria();
    
    // Configurar ações para usuários
    document.getElementById('btn-novo-usuario').addEventListener('click', () => abrirModalUsuario());
    document.getElementById('btn-save-usuario').addEventListener('click', salvarUsuario);
    
    // Configurar ações para backup
    document.getElementById('btn-gerar-backup').addEventListener('click', gerarBackup);
    document.getElementById('btn-select-backup').addEventListener('click', () => document.getElementById('restaurar-arquivo').click());
    document.getElementById('restaurar-arquivo').addEventListener('change', habilitarRestauracao);
    document.getElementById('btn-restaurar-backup').addEventListener('click', restaurarBackup);
    
    // Configurar modais
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Toggle do sidebar em dispositivos móveis
    document.querySelector('.mobile-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Configurar upload de logo
    document.getElementById('btn-select-logo').addEventListener('click', () => document.getElementById('empresa-logo').click());
    document.getElementById('empresa-logo').addEventListener('change', previewLogo);
});

// Funções utilitárias
function showSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.classList.add('active');
    }
}

function hideSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.classList.remove('active');
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        ${message}
        <span class="alert-close" onclick="this.parentElement.remove()">&times;</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Função para navegar entre páginas
function navigateTo(page) {
    console.log(`Navegando para: ${page}`);
    
    // Mapeamento de páginas para arquivos
    const pageMapping = {
        'dashboard': 'index.html',
        'clientes': 'Cad_Clientes.html',
        'servicos': 'Cad_Servicos.html',
        'ordens': 'Cad_Ordens.html',
        'garantias': 'Cad_Garantias.html',
        'financeiro': 'Financeiro.html',
        'relatorios': 'Relatorios.html',
        'configuracoes': 'Configuracoes.html'
    };
    
    // Verificar se o arquivo existe no mapeamento
    if (pageMapping[page]) {
        window.location.href = pageMapping[page];
    } else {
        showAlert(`A página "${page}" ainda está em desenvolvimento.`, 'info');
    }
}

// Função para mostrar aba de configuração
function showConfigTab(tab) {
    console.log(`Mostrando aba de configuração: ${tab}`);
    
    // Atualizar abas ativas
    document.querySelectorAll('.config-tab').forEach(tabElement => {
        if (tabElement.dataset.tab === tab) {
            tabElement.classList.add('active');
        } else {
            tabElement.classList.remove('active');
        }
    });
    
    // Atualizar conteúdo das abas
    document.querySelectorAll('.config-content').forEach(content => {
        if (content.id === `${tab}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Função para mostrar aba de categoria
function showCategoriaTab(tab) {
    console.log(`Mostrando aba de categoria: ${tab}`);
    
    // Atualizar abas ativas
    document.querySelectorAll('.categoria-tab').forEach(tabElement => {
        if (tabElement.dataset.catTab === tab) {
            tabElement.classList.add('active');
        } else {
            tabElement.classList.remove('active');
        }
    });
    
    // Atualizar conteúdo das abas
    document.querySelectorAll('.categorias-tab-content').forEach(content => {
        if (content.id === `${tab}-tab-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Carregar configurações salvas
function carregarConfiguracoesSalvas() {
    console.log("Carregando configurações salvas...");
    
    // Tentar carregar do localStorage
    const savedConfig = localStorage.getItem('kl-config');
    
    if (savedConfig) {
        try {
            const parsedConfig = JSON.parse(savedConfig);
            configData = { ...configData, ...parsedConfig };
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        }
    }
    
    // Tentar carregar categorias
    const savedCategorias = localStorage.getItem('kl-categorias');
    
    if (savedCategorias) {
        try {
            const parsedCategorias = JSON.parse(savedCategorias);
            categoriasData = { ...categoriasData, ...parsedCategorias };
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        }
    }
    
    // Aplicar configurações carregadas
    aplicarConfiguracoes();
}

// Aplicar configurações aos elementos do formulário
function aplicarConfiguracoes() {
    // Configurações gerais
    document.getElementById('config-idioma').value = configData.geral.idioma;
    document.getElementById('config-tema').value = configData.geral.tema;
    document.getElementById('config-itens-pagina').value = configData.geral.itensPorPagina;
    document.getElementById('config-formato-data').value = configData.geral.formatoData;
    document.getElementById('config-formato-moeda').value = configData.geral.formatoMoeda;
    
    document.getElementById('config-notif-email').checked = configData.geral.notificacoes.email;
    document.getElementById('config-notif-sistema').checked = configData.geral.notificacoes.sistema;
    document.getElementById('config-notif-browser').checked = configData.geral.notificacoes.browser;
    
    // Dados da empresa
    document.getElementById('empresa-nome').value = configData.empresa.nome;
    document.getElementById('empresa-cnpj').value = configData.empresa.cnpj;
    document.getElementById('empresa-ie').value = configData.empresa.ie;
    document.getElementById('empresa-endereco').value = configData.empresa.endereco;
    document.getElementById('empresa-cidade').value = configData.empresa.cidade;
    document.getElementById('empresa-estado').value = configData.empresa.estado;
    document.getElementById('empresa-cep').value = configData.empresa.cep;
    document.getElementById('empresa-telefone').value = configData.empresa.telefone;
    document.getElementById('empresa-email').value = configData.empresa.email;
    document.getElementById('empresa-website').value = configData.empresa.website;
    
    // Atualizar preview da logo
    const logoPreview = document.getElementById('logo-preview');
    if (logoPreview) {
        logoPreview.innerHTML = `<img src="${configData.empresa.logo}" alt="Logo da Empresa">`;
    }
    
    // Aplicar tema
    aplicarTema(configData.geral.tema);
}

// Aplicar tema
function aplicarTema(tema) {
    const body = document.body;
    
    if (tema === 'dark') {
        body.classList.add('dark-theme');
    } else if (tema === 'light') {
        body.classList.remove('dark-theme');
    } else if (tema === 'system') {
        // Detectar tema do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (prefersDark) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }
}

// Salvar configurações gerais
function salvarConfiguracoesGerais() {
    console.log("Salvando configurações gerais...");
    
    // Obter valores do formulário
    const idioma = document.getElementById('config-idioma').value;
    const tema = document.getElementById('config-tema').value;
    const itensPorPagina = document.getElementById('config-itens-pagina').value;
    const formatoData = document.getElementById('config-formato-data').value;
    const formatoMoeda = document.getElementById('config-formato-moeda').value;
    
    const notifEmail = document.getElementById('config-notif-email').checked;
    const notifSistema = document.getElementById('config-notif-sistema').checked;
    const notifBrowser = document.getElementById('config-notif-browser').checked;
    
    // Atualizar objeto de configurações
    configData.geral = {
        idioma,
        tema,
        itensPorPagina,
        formatoData,
        formatoMoeda,
        notificacoes: {
            email: notifEmail,
            sistema: notifSistema,
            browser: notifBrowser
        }
    };
    
    // Salvar no localStorage
    localStorage.setItem('kl-config', JSON.stringify(configData));
    
    // Aplicar tema
    aplicarTema(tema);
    
    // Exibir mensagem de sucesso
    showAlert('Configurações salvas com sucesso!', 'success');
}

// Resetar configurações gerais
function resetarConfiguracoesGerais() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
        // Restaurar valores padrão
        const defaultConfig = {
            geral: {
                idioma: 'pt-BR',
                tema: 'light',
                itensPorPagina: 10,
                formatoData: 'dd/mm/yyyy',
                formatoMoeda: 'BRL',
                notificacoes: {
                    email: true,
                    sistema: true,
                    browser: false
                }
            }
        };
        
        // Atualizar configurações
        configData.geral = defaultConfig.geral;
        
        // Aplicar configurações
        aplicarConfiguracoes();
        
        // Salvar no localStorage
        localStorage.setItem('kl-config', JSON.stringify(configData));
        
        // Exibir mensagem de sucesso
        showAlert('Configurações restauradas para os valores padrão.', 'success');
    }
}

// Salvar dados da empresa
function salvarDadosEmpresa() {
    console.log("Salvando dados da empresa...");
    
    // Obter valores do formulário
    const nome = document.getElementById('empresa-nome').value;
    const cnpj = document.getElementById('empresa-cnpj').value;
    const ie = document.getElementById('empresa-ie').value;
    const endereco = document.getElementById('empresa-endereco').value;
    const cidade = document.getElementById('empresa-cidade').value;
    const estado = document.getElementById('empresa-estado').value;
    const cep = document.getElementById('empresa-cep').value;
    const telefone = document.getElementById('empresa-telefone').value;
    const email = document.getElementById('empresa-email').value;
    const website = document.getElementById('empresa-website').value;
    
    // Validar campos obrigatórios
    if (!nome) {
        showAlert('O nome da empresa é obrigatório.', 'danger');
        return;
    }
    
    // Atualizar objeto de configurações
    configData.empresa = {
        ...configData.empresa,
        nome,
        cnpj,
        ie,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        email,
        website
    };
    
    // Salvar no localStorage
    localStorage.setItem('kl-config', JSON.stringify(configData));
    
    // Exibir mensagem de sucesso
    showAlert('Dados da empresa salvos com sucesso!', 'success');
}

// Preview de logo
function previewLogo(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const logoPreview = document.getElementById('logo-preview');
            logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo da Empresa">`;
            
            // Atualizar logo na configuração
            configData.empresa.logo = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
}

// Configurar botões para categorias
function configurarBotoesCategoria() {
    // Configurar botões de edição
    document.querySelectorAll('.categoria-item .btn-icon.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoriaItem = this.closest('.categoria-item');
            const categoriaTexto = categoriaItem.querySelector('span').textContent;
            
            // Determinar o tipo de categoria
            const categoriaTipo = categoriaItem.closest('.categorias-tab-content') 
                ? categoriaItem.closest('.categorias-tab-content').id.split('-')[0] // receitas ou despesas
                : 'servicos';
            
            // Abrir prompt para editar
            const novoNome = prompt('Editar categoria:', categoriaTexto);
            
            if (novoNome && novoNome.trim() !== '') {
                // Atualizar nome da categoria
                categoriaItem.querySelector('span').textContent = novoNome;
                
                // Atualizar na lista de categorias
                atualizarCategoria(categoriaTipo, categoriaTexto, novoNome);
            }
        });
    });
    
    // Configurar botões de exclusão
    document.querySelectorAll('.categoria-item .btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoriaItem = this.closest('.categoria-item');
            const categoriaTexto = categoriaItem.querySelector('span').textContent;
            
            // Determinar o tipo de categoria
            const categoriaTipo = categoriaItem.closest('.categorias-tab-content') 
                ? categoriaItem.closest('.categorias-tab-content').id.split('-')[0] // receitas ou despesas
                : 'servicos';
            
            // Confirmar exclusão
            if (confirm(`Tem certeza que deseja excluir a categoria "${categoriaTexto}"?`)) {
                // Remover do DOM
                categoriaItem.remove();
                
                // Remover da lista de categorias
                removerCategoria(categoriaTipo, categoriaTexto);
            }
        });
    });
}

// Adicionar categoria de serviço
function adicionarCategoriaServico() {
    const input = document.getElementById('categoria-nome');
    const novaCategoria = input.value.trim();
    
    if (!novaCategoria) {
        showAlert('Digite um nome para a categoria.', 'warning');
        return;
    }
    
    // Verificar se já existe
    if (categoriasData.servicos.includes(novaCategoria)) {
        showAlert('Esta categoria já existe.', 'warning');
        return;
    }
    
    // Adicionar à lista de categorias
    categoriasData.servicos.push(novaCategoria);
    
    // Adicionar ao DOM
    const categoriasList = document.querySelector('#categorias-content .categorias-list');
    
    const novoItem = document.createElement('div');
    novoItem.className = 'categoria-item';
    novoItem.innerHTML = `
        <span>${novaCategoria}</span>
        <div class="categoria-actions">
            <button class="btn-icon edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    categoriasList.appendChild(novoItem);
    
    // Configurar botões
    const editButton = novoItem.querySelector('.btn-icon.edit');
    const deleteButton = novoItem.querySelector('.btn-icon.delete');
    
    editButton.addEventListener('click', function() {
        const categoriaTexto = novoItem.querySelector('span').textContent;
        const novoNome = prompt('Editar categoria:', categoriaTexto);
        
        if (novoNome && novoNome.trim() !== '') {
            novoItem.querySelector('span').textContent = novoNome;
            atualizarCategoria('servicos', categoriaTexto, novoNome);
        }
    });
    
    deleteButton.addEventListener('click', function() {
        const categoriaTexto = novoItem.querySelector('span').textContent;
        
        if (confirm(`Tem certeza que deseja excluir a categoria "${categoriaTexto}"?`)) {
            novoItem.remove();
            removerCategoria('servicos', categoriaTexto);
        }
    });
    
    // Limpar input
    input.value = '';
    
    // Exibir mensagem de sucesso
    showAlert('Categoria adicionada com sucesso!', 'success');
    
    // Salvar categorias
    salvarCategorias();
}

// Adicionar categoria de receita
function adicionarCategoriaReceita() {
    const input = document.getElementById('receita-categoria-nome');
    const novaCategoria = input.value.trim();
    
    if (!novaCategoria) {
        showAlert('Digite um nome para a categoria.', 'warning');
        return;
    }
    
    // Verificar se já existe
    if (categoriasData.receitas.includes(novaCategoria)) {
        showAlert('Esta categoria já existe.', 'warning');
        return;
    }
    
    // Adicionar à lista de categorias
    categoriasData.receitas.push(novaCategoria);
    
    // Adicionar ao DOM
    const categoriasList = document.querySelector('#receitas-tab-content .categorias-list');
    
    const novoItem = document.createElement('div');
    novoItem.className = 'categoria-item';
    novoItem.innerHTML = `
        <span>${novaCategoria}</span>
        <div class="categoria-actions">
            <button class="btn-icon edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    categoriasList.appendChild(novoItem);
    
    // Configurar botões
    const editButton = novoItem.querySelector('.btn-icon.edit');
    const deleteButton = novoItem.querySelector('.btn-icon.delete');
    
    editButton.addEventListener('click', function() {
        const categoriaTexto = novoItem.querySelector('span').textContent;
        const novoNome = prompt('Editar categoria:', categoriaTexto);
        
        if (novoNome && novoNome.trim() !== '') {
            novoItem.querySelector('span').textContent = novoNome;
            atualizarCategoria('receitas', categoriaTexto, novoNome);
        }
    });
    
    deleteButton.addEventListener('click', function() {
        const categoriaTexto = novoItem.querySelector('span').textContent;
        
        if (confirm(`Tem certeza que deseja excluir a categoria "${categoriaTexto}"?`)) {
            novoItem.remove();
            removerCategoria('receitas', categoriaTexto);
        }
    });
    
    // Limpar input
    input.value = '';
    
    // Exibir mensagem de sucesso
    showAlert('Categoria adicionada com sucesso!', 'success');
    
    // Salvar categorias
    salvarCategorias();
}

// Adicionar categoria de despesa
function adicionarCategoriaDespesa() {
    const input = document.getElementById('despesa-categoria-nome');
    const novaCategoria = input.value.trim();
    
    if (!novaCategoria) {
        showAlert('Digite um nome para a categoria.', 'warning');
        return;
    }
    
    // Verificar se já existe
    if (categoriasData.despesas.includes(novaCategoria)) {
        showAlert('Esta categoria já existe.', 'warning');
        return;
    }
    
    // Adicionar à lista de categorias
    categoriasData.despesas.push(novaCategoria);
    
    // Adicionar ao DOM
    const categoriasList = document.querySelector('#despesas-tab-content .categorias-list');
    
    const novoItem = document.createElement('div');
    novoItem.className = 'categoria-item';
    novoItem.innerHTML = `
        <span>${novaCategoria}</span>
        <div class="categoria-actions">
            <button class="btn-icon edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    categoriasList.appendChild(novoItem);
    
    // Configurar botões
    const editButton = novoItem.querySelector('.btn-icon.edit');
    const deleteButton = novoItem.querySelector('.btn-icon.delete');
    
    editButton.addEventListener('click', function() {
        const categoriaTexto = novoItem.querySelector('span').textContent;
        const novoNome = prompt('Editar categoria:', categoriaTexto);
        
        if (novoNome && novoNome.trim() !== '') {
            novoItem.querySelector('span').textContent = novoNome;
            atualizarCategoria('despesas', categoriaTexto, novoNome);
        }
    });
    
    deleteButton.addEventListener('click', function() {
        const categoriaTexto = novoItem.querySelector('span').textContent;
        
        if (confirm(`Tem certeza que deseja excluir a categoria "${categoriaTexto}"?`)) {
            novoItem.remove();
            removerCategoria('despesas', categoriaTexto);
        }
    });
    
    // Limpar input
    input.value = '';
    
    // Exibir mensagem de sucesso
    showAlert('Categoria adicionada com sucesso!', 'success');
    
    // Salvar categorias
    salvarCategorias();
}

// Atualizar categoria
function atualizarCategoria(tipo, categoriaAntiga, categoriaNova) {
    // Atualizar na lista de categorias
    const index = categoriasData[tipo].indexOf(categoriaAntiga);
    
    if (index !== -1) {
        categoriasData[tipo][index] = categoriaNova;
        
        // Salvar categorias
        salvarCategorias();
    }
}

// Remover categoria
function removerCategoria(tipo, categoria) {
    // Remover da lista de categorias
    const index = categoriasData[tipo].indexOf(categoria);
    
    if (index !== -1) {
        categoriasData[tipo].splice(index, 1);
        
        // Salvar categorias
        salvarCategorias();
    }
}

// Salvar categorias no localStorage
function salvarCategorias() {
    localStorage.setItem('kl-categorias', JSON.stringify(categoriasData));
}

// Abrir modal de usuário
function abrirModalUsuario(id = null) {
    console.log(`Abrindo modal de ${id ? 'edição' : 'novo'} usuário`);
    
    // Limpar formulário
    document.getElementById('usuario-form').reset();
    document.getElementById('usuario-id').value = '';
    
    // Definir título
    document.getElementById('usuario-modal-title').textContent = id ? 'Editar Usuário' : 'Novo Usuário';
    
    // Carregar dados se for edição
    if (id) {
        carregarDadosUsuario(id);
    } else {
        // Se for novo usuário, marcar campos de senha como obrigatórios
        document.getElementById('usuario-senha').required = true;
        document.getElementById('usuario-confirmar-senha').required = true;
    }
    
    // Abrir modal
    document.getElementById('usuario-modal').style.display = 'flex';
}

// Carregar dados de usuário para edição
function carregarDadosUsuario(id) {
    // Simulação de carregamento de dados
    showSpinner();
    
    setTimeout(() => {
        // Dados simulados para edição
        let userData = {};
        
        if (id === 1) {
            userData = {
                id: 1,
                nome: 'Kauan Lauer',
                email: 'admin@kauanlauer.com',
                funcao: 'Administrador',
                permissoes: {
                    clientes: true,
                    servicos: true,
                    ordens: true,
                    financeiro: true,
                    relatorios: true,
                    configuracoes: true
                },
                situacao: 'Ativo'
            };
        } else if (id === 2) {
            userData = {
                id: 2,
                nome: 'Suporte Técnico',
                email: 'suporte@kauanlauer.com',
                funcao: 'Técnico',
                permissoes: {
                    clientes: true,
                    servicos: true,
                    ordens: true,
                    financeiro: false,
                    relatorios: false,
                    configuracoes: false
                },
                situacao: 'Ativo'
            };
        } else if (id === 3) {
            userData = {
                id: 3,
                nome: 'Atendimento',
                email: 'atendimento@kauanlauer.com',
                funcao: 'Atendente',
                permissoes: {
                    clientes: true,
                    servicos: true,
                    ordens: true,
                    financeiro: false,
                    relatorios: false,
                    configuracoes: false
                },
                situacao: 'Inativo'
            };
        }
        
        // Preencher formulário
        document.getElementById('usuario-id').value = userData.id || '';
        document.getElementById('usuario-nome').value = userData.nome || '';
        document.getElementById('usuario-email').value = userData.email || '';
        document.getElementById('usuario-funcao').value = userData.funcao || '';
        document.getElementById('usuario-situacao').value = userData.situacao || 'Ativo';
        
        // Limpar campos de senha (não exibimos a senha atual)
        document.getElementById('usuario-senha').value = '';
        document.getElementById('usuario-confirmar-senha').value = '';
        
        // Marcar campos de senha como não obrigatórios na edição
        document.getElementById('usuario-senha').required = false;
        document.getElementById('usuario-confirmar-senha').required = false;
        
        // Preencher permissões
        document.getElementById('perm-clientes').checked = userData.permissoes?.clientes || false;
        document.getElementById('perm-servicos').checked = userData.permissoes?.servicos || false;
        document.getElementById('perm-ordens').checked = userData.permissoes?.ordens || false;
        document.getElementById('perm-financeiro').checked = userData.permissoes?.financeiro || false;
        document.getElementById('perm-relatorios').checked = userData.permissoes?.relatorios || false;
        document.getElementById('perm-configuracoes').checked = userData.permissoes?.configuracoes || false;
        
        hideSpinner();
    }, 500);
}

// Salvar usuário
function salvarUsuario() {
    // Validar campos obrigatórios
    const nome = document.getElementById('usuario-nome').value;
    const email = document.getElementById('usuario-email').value;
    const funcao = document.getElementById('usuario-funcao').value;
    const senha = document.getElementById('usuario-senha').value;
    const confirmarSenha = document.getElementById('usuario-confirmar-senha').value;
    
    if (!nome || !email || !funcao) {
        showAlert('Preencha todos os campos obrigatórios.', 'danger');
        return;
    }
    
    // Validar e-mail
    if (!validarEmail(email)) {
        showAlert('Digite um e-mail válido.', 'danger');
        return;
    }
    
    // Se for novo usuário ou senha preenchida, validar senhas
    const userId = document.getElementById('usuario-id').value;
    if (!userId || senha) {
        if (!senha) {
            showAlert('A senha é obrigatória para novos usuários.', 'danger');
            return;
        }
        
        if (senha !== confirmarSenha) {
            showAlert('As senhas não coincidem.', 'danger');
            return;
        }
        
        if (senha.length < 6) {
            showAlert('A senha deve ter pelo menos 6 caracteres.', 'danger');
            return;
        }
    }
    
    // Mostrar loading
    showSpinner();
    
    // Simular ação de salvar
    setTimeout(() => {
        hideSpinner();
        
        // Fechar modal
        document.getElementById('usuario-modal').style.display = 'none';
        
        // Exibir mensagem de sucesso
        if (userId) {
            showAlert('Usuário atualizado com sucesso!', 'success');
        } else {
            showAlert('Usuário adicionado com sucesso!', 'success');
        }
        
        // Na vida real, aqui atualizaríamos a lista de usuários
        // Como é uma simulação, não precisamos fazer nada
    }, 1000);
}

// Validar e-mail
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Editar usuário
function editarUsuario(id) {
    abrirModalUsuario(id);
}

// Confirmar exclusão de usuário
function confirmarExclusaoUsuario(id) {
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
        excluirUsuario(id);
    }
}

// Excluir usuário
function excluirUsuario(id) {
    console.log(`Excluindo usuário: ${id}`);
    showSpinner();
    
    // Simular ação de exclusão
    setTimeout(() => {
        hideSpinner();
        showAlert('Usuário excluído com sucesso!', 'success');
        
        // Na vida real, aqui atualizaríamos a lista de usuários
        // Como é uma simulação, vamos simplesmente recarregar a página
        window.location.reload();
    }, 1000);
}

// Gerar backup
function gerarBackup() {
    console.log("Gerando backup...");
    
    // Verificar quais módulos foram selecionados
    const incluirClientes = document.getElementById('backup-clientes').checked;
    const incluirServicos = document.getElementById('backup-servicos').checked;
    const incluirOrdens = document.getElementById('backup-ordens').checked;
    const incluirFinanceiro = document.getElementById('backup-financeiro').checked;
    const incluirConfig = document.getElementById('backup-config').checked;
    
    if (!incluirClientes && !incluirServicos && !incluirOrdens && !incluirFinanceiro && !incluirConfig) {
        showAlert('Selecione pelo menos um módulo para backup.', 'warning');
        return;
    }
    
    showSpinner();
    
    // Simular geração de backup
    setTimeout(() => {
        hideSpinner();
        
        // Criar conteúdo do backup
        const backupData = {
            timestamp: new Date().toISOString(),
            config: incluirConfig ? configData : null,
            categorias: incluirServicos ? categoriasData : null
            // Aqui incluiríamos os dados reais de cada módulo
        };
        
        // Criar blob com os dados do backup
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Criar link para download
        const a = document.createElement('a');
        a.href = url;
        a.download = `KL_Backup_${formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Exibir mensagem de sucesso
        showAlert('Backup gerado com sucesso!', 'success');
    }, 1500);
}

// Habilitar botão de restauração
function habilitarRestauracao(event) {
    const file = event.target.files[0];
    const restoreBtn = document.getElementById('btn-restaurar-backup');
    
    if (file) {
        restoreBtn.disabled = false;
    } else {
        restoreBtn.disabled = true;
    }
}

// Restaurar backup
function restaurarBackup() {
    console.log("Restaurando backup...");
    
    const fileInput = document.getElementById('restaurar-arquivo');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Selecione um arquivo de backup para restaurar.', 'warning');
        return;
    }
    
    // Confirmar restauração
    if (!confirm('ATENÇÃO! Esta ação substituirá todos os dados atuais do sistema. Deseja continuar?')) {
        return;
    }
    
    showSpinner();
    
    // Simular processamento de restauração
    setTimeout(() => {
        hideSpinner();
        
        // Exibir mensagem de sucesso
        showAlert('Backup restaurado com sucesso! O sistema será reiniciado.', 'success');
        
        // Simular reinicialização
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }, 2000);
}

// Formatar data como string (YYYY-MM-DD_HHMMSS)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}
// Funções utilitárias
function showSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.classList.add('active');
    }
}

function hideSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.classList.remove('active');
    }
}