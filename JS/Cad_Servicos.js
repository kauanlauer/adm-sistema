// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentPage = 1;
const itemsPerPage = 10;
let servicosData = [];
let filtroAtual = {
    categoria: '',
    situacao: ''
};

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando módulo de serviços...");
    
    // Carregar dados
    loadServicosData();
    
    // Configurar navegação do menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Configurar botão de filtrar
    document.getElementById('btn-filtrar').addEventListener('click', aplicarFiltros);
    
    // Configurar busca
    document.getElementById('btn-search-servico').addEventListener('click', buscarServicos);
    document.getElementById('search-servico').addEventListener('keyup', e => {
        if (e.key === 'Enter') buscarServicos();
    });
    
    // Configurar botão de novo serviço
    document.getElementById('btn-novo-servico').addEventListener('click', () => openServicoModal());
    
    // Configurar salvar serviço
    document.getElementById('btn-save-servico').addEventListener('click', salvarServico);
    
    // Configurar modais
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Fechar modal ao clicar fora
    document.getElementById('servico-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('servico-modal')) {
            document.getElementById('servico-modal').style.display = 'none';
        }
    });
    
    // Toggle do sidebar em dispositivos móveis
    document.querySelector('.mobile-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
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

// Aplicar filtros
function aplicarFiltros() {
    console.log("Aplicando filtros");
    
    // Obter valores dos filtros
    filtroAtual.categoria = document.getElementById('filtro-categoria').value;
    filtroAtual.situacao = document.getElementById('filtro-situacao').value;
    
    // Reiniciar paginação
    currentPage = 1;
    
    // Carregar dados filtrados
    loadServicosData();
}

// Carregar dados dos serviços
async function loadServicosData() {
    console.log("Carregando dados de serviços...");
    showSpinner();
    
    try {
        // Buscar dados dos serviços
        const response = await fetch(`${SHEET_API}?sheet=Servicos`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API:", response.status, response.statusText);
            throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const servicos = await response.json();
        console.log(`${servicos.length} serviços carregados`);
        
        // Aplicar filtros
        let servicosFiltrados = [...servicos];
        
        // Filtrar por categoria
        if (filtroAtual.categoria) {
            servicosFiltrados = servicosFiltrados.filter(servico => servico.Categoria === filtroAtual.categoria);
        }
        
        // Filtrar por situação
        if (filtroAtual.situacao) {
            servicosFiltrados = servicosFiltrados.filter(servico => servico.Situacao === filtroAtual.situacao);
        }
        
        // Armazenar dados filtrados
        servicosData = servicosFiltrados;
        
        // Renderizar tabela
        renderServicosTable(servicosData);
        
        // Configurar paginação
        setupPagination(servicosData);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados. Por favor, tente novamente.', 'danger');
        
        document.getElementById('servicos-table').innerHTML = '<tr><td colspan="8" class="text-center">Erro ao carregar dados</td></tr>';
    } finally {
        hideSpinner();
    }
}

// Renderizar tabela de serviços
function renderServicosTable(servicos, page = 1) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedServicos = servicos.slice(startIndex, endIndex);
    
    const table = document.getElementById('servicos-table');
    
    if (!table) {
        console.warn('Tabela não encontrada');
        return;
    }
    
    table.innerHTML = '';
    
    if (paginatedServicos.length === 0) {
        table.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum serviço encontrado</td></tr>';
        return;
    }
    
    for (const servico of paginatedServicos) {
        let situacaoClass = servico.Situacao === 'Ativo' ? 'active' : 'inactive';
        
        table.innerHTML += `
            <tr>
                <td>${servico.ID || ''}</td>
                <td>${servico.Nome || ''}</td>
                <td>${servico.Categoria || ''}</td>
                <td>${truncateText(servico.Descricao || '', 50)}</td>
                <td>R$ ${parseFloat(servico.Preco || 0).toFixed(2)}</td>
                <td>${servico.Garantia || '0'}</td>
                <td><span class="status ${situacaoClass}">${servico.Situacao || ''}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editarServico('${servico.ID}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmarExclusaoServico('${servico.ID}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
}

// Truncar texto longo
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Configurar paginação
function setupPagination(servicos) {
    const totalPages = Math.ceil(servicos.length / itemsPerPage);
    const pagination = document.getElementById('servicos-pagination');
    
    if (!pagination) {
        console.warn('Elemento de paginação não encontrado');
        return;
    }
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Adicionar botões de paginação
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('div');
        pageButton.className = `pagination-item ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            
            document.querySelectorAll('#servicos-pagination .pagination-item').forEach(item => 
                item.classList.remove('active')
            );
            pageButton.classList.add('active');
            
            renderServicosTable(servicosData, i);
        });
        
        pagination.appendChild(pageButton);
    }
}

// Função de busca
function buscarServicos() {
    const searchTerm = document.getElementById('search-servico').value.toLowerCase();
    
    if (!searchTerm) {
        renderServicosTable(servicosData);
        setupPagination(servicosData);
        return;
    }
    
    // Filtrar serviços
    const filteredServicos = servicosData.filter(servico => 
        (servico.Nome && servico.Nome.toLowerCase().includes(searchTerm)) ||
        (servico.Categoria && servico.Categoria.toLowerCase().includes(searchTerm)) ||
        (servico.Descricao && servico.Descricao.toLowerCase().includes(searchTerm))
    );
    
    // Renderizar resultados
    currentPage = 1;
    renderServicosTable(filteredServicos);
    setupPagination(filteredServicos);
}

// Abrir modal de novo serviço
function openServicoModal(id = null) {
    console.log(`Abrindo modal de ${id ? 'edição' : 'novo'} serviço`);
    
    // Limpar formulário
    document.getElementById('servico-form').reset();
    document.getElementById('servico-id').value = '';
    
    // Definir título
    document.getElementById('servico-modal-title').textContent = id ? 'Editar Serviço' : 'Novo Serviço';
    
    // Carregar dados se for edição
    if (id) {
        carregarDadosServico(id);
    }
    
    // Abrir modal
    document.getElementById('servico-modal').style.display = 'flex';
}

// Carregar dados de um serviço para edição
async function carregarDadosServico(id) {
    showSpinner();
    
    try {
        // Buscar serviço específico
        const response = await fetch(`${SHEET_API}/search?sheet=Servicos&ID=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar serviço):", response.status, response.statusText);
            throw new Error(`Erro ao buscar serviço: ${response.status}`);
        }
        
        const servicos = await response.json();
        
        if (!servicos || servicos.length === 0) {
            showAlert('Serviço não encontrado', 'danger');
            return;
        }
        
        const servico = servicos[0];
        
        // Preencher formulário
        document.getElementById('servico-id').value = servico.ID || '';
        document.getElementById('servico-nome').value = servico.Nome || '';
        document.getElementById('servico-categoria').value = servico.Categoria || '';
        document.getElementById('servico-descricao').value = servico.Descricao || '';
        document.getElementById('servico-preco').value = servico.Preco || '';
        document.getElementById('servico-tempo').value = servico.Tempo_Estimado || '';
        document.getElementById('servico-garantia').value = servico.Garantia || '';
        document.getElementById('servico-situacao').value = servico.Situacao || 'Ativo';
    } catch (error) {
        console.error('Erro ao carregar dados do serviço:', error);
        showAlert('Erro ao carregar dados do serviço', 'danger');
    } finally {
        hideSpinner();
    }
}

// Salvar serviço
async function salvarServico() {
    // Validar campos obrigatórios
    const nome = document.getElementById('servico-nome').value;
    const categoria = document.getElementById('servico-categoria').value;
    const preco = document.getElementById('servico-preco').value;
    
    if (!nome || !categoria || !preco) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    showSpinner();
    
    try {
        // Preparar dados do serviço
        const servicoId = document.getElementById('servico-id').value;
        const descricao = document.getElementById('servico-descricao').value;
        const tempoEstimado = document.getElementById('servico-tempo').value;
        const garantia = document.getElementById('servico-garantia').value;
        const situacao = document.getElementById('servico-situacao').value;
        
        const servicoData = {
            Nome: nome,
            Categoria: categoria,
            Descricao: descricao,
            Preco: preco,
            Tempo_Estimado: tempoEstimado,
            Garantia: garantia,
            Situacao: situacao
        };
        
        if (servicoId) {
            // Atualizar serviço existente
            const response = await fetch(`${SHEET_API}/ID/${servicoId}?sheet=Servicos`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: servicoData })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Atualizar serviço):", response.status, response.statusText);
                throw new Error(`Erro ao atualizar serviço: ${response.status}`);
            }
            
            showAlert('Serviço atualizado com sucesso!', 'success');
        } else {
            // Adicionar novo serviço
            // Gerar ID
            const newId = await generateNewServicoId();
            servicoData.ID = newId;
            
            const response = await fetch(`${SHEET_API}?sheet=Servicos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [servicoData] })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Adicionar serviço):", response.status, response.statusText);
                throw new Error(`Erro ao adicionar serviço: ${response.status}`);
            }
            
            showAlert('Serviço adicionado com sucesso!', 'success');
        }
        
        // Fechar modal e recarregar dados
        document.getElementById('servico-modal').style.display = 'none';
        loadServicosData();
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        showAlert('Erro ao salvar serviço. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Gerar novo ID de serviço
async function generateNewServicoId() {
    try {
        // Buscar todos os serviços para encontrar o último ID
        const response = await fetch(`${SHEET_API}?sheet=Servicos`);
        const servicos = await response.json();
        
        let maxId = 0;
        servicos.forEach(servico => {
            if (servico.ID) {
                const idNumber = parseInt(servico.ID.replace('SV', ''));
                maxId = Math.max(maxId, idNumber);
            }
        });
        
        return `SV${String(maxId + 1).padStart(4, '0')}`;
    } catch (error) {
        console.error('Erro ao gerar ID:', error);
        // Gerar ID baseado em timestamp como fallback
        const timestamp = Date.now().toString().slice(-6);
        return `SV${timestamp}`;
    }
}

// Editar serviço
function editarServico(id) {
    openServicoModal(id);
}

// Confirmar exclusão de serviço
function confirmarExclusaoServico(id) {
    if (confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
        excluirServico(id);
    }
}

// Excluir serviço
async function excluirServico(id) {
    console.log(`Excluindo serviço: ${id}`);
    showSpinner();
    
    try {
        const response = await fetch(`${SHEET_API}/ID/${id}?sheet=Servicos`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Excluir serviço):", response.status, response.statusText);
            throw new Error(`Erro ao excluir serviço: ${response.status}`);
        }
        
        showAlert('Serviço excluído com sucesso!', 'success');
        loadServicosData();
    } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        showAlert('Erro ao excluir serviço', 'danger');
    } finally {
        hideSpinner();
    }
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