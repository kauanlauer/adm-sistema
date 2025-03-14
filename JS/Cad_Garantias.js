// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentTab = 'ativas';
let garantiasData = {
    ativas: [],
    vencidas: [],
    todas: []
};
let currentPage = {
    ativas: 1,
    vencidas: 1,
    todas: 1
};
const itemsPerPage = 10;

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando módulo de garantias...");
    
    // Carregar dados de garantias
    loadGarantiasData();
    
    // Configurar navegação por abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            showTab(tabType);
        });
    });
    
    // Configurar navegação do menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Configurar botão de nova garantia
    const btnNewGarantia = document.getElementById('btn-new-garantia');
    if (btnNewGarantia) {
        btnNewGarantia.addEventListener('click', () => {
            openNewGarantiaModal();
        });
    }
    
    // Configurar busca
    const btnSearchGarantia = document.getElementById('btn-search-garantia');
    if (btnSearchGarantia) {
        btnSearchGarantia.addEventListener('click', buscarGarantias);
    }
    
    const searchGarantia = document.getElementById('search-garantia');
    if (searchGarantia) {
        searchGarantia.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                buscarGarantias();
            }
        });
    }
    
    // Configurar modal
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Evento para salvar garantia
    const btnSaveGarantia = document.getElementById('btn-save-garantia');
    if (btnSaveGarantia) {
        btnSaveGarantia.addEventListener('click', salvarGarantia);
    }
    
    // Fechar modal ao clicar fora
    const garantiaModal = document.getElementById('garantia-modal');
    if (garantiaModal) {
        garantiaModal.addEventListener('click', (e) => {
            if (e.target === garantiaModal) {
                garantiaModal.style.display = 'none';
            }
        });
    }
    
    // Evento de mudança na OS selecionada
    const garantiaOs = document.getElementById('garantia-os');
    if (garantiaOs) {
        garantiaOs.addEventListener('change', () => {
            carregarDadosOS(garantiaOs.value);
        });
    }
    
    // Toggle do sidebar em dispositivos móveis
    const mobileToggle = document.querySelector('.mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        });
    }
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

// Função para trocar entre abas
function showTab(tab) {
    console.log(`Mostrando aba: ${tab}`);
    
    // Atualizar abas ativas
    document.querySelectorAll('.tab').forEach(tabElement => {
        if (tabElement.dataset.tab === tab) {
            tabElement.classList.add('active');
        } else {
            tabElement.classList.remove('active');
        }
    });
    
    // Atualizar conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `${tab}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    currentTab = tab;
}

// Função para carregar dados das garantias
async function loadGarantiasData() {
    console.log("Carregando dados de garantias...");
    showSpinner();
    
    try {
        // Buscar dados das garantias
        const response = await fetch(`${SHEET_API}?sheet=Garantias`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Garantias):", response.status, response.statusText);
            throw new Error(`Erro ao buscar garantias: ${response.status}`);
        }
        
        const garantias = await response.json();
        console.log(`${garantias.length} garantias carregadas`);
        
        // Filtrar garantias por status
        const hoje = new Date();
        garantiasData.todas = garantias;
        
        garantiasData.ativas = garantias.filter(garantia => {
            if (!garantia.Data_Fim_Garantia) return false;
            
            const parts = garantia.Data_Fim_Garantia.split('/');
            const dataFim = new Date(parts[2], parts[1] - 1, parts[0]);
            
            return dataFim >= hoje && garantia.Status !== 'Expirada';
        });
        
        garantiasData.vencidas = garantias.filter(garantia => {
            if (!garantia.Data_Fim_Garantia) return false;
            
            const parts = garantia.Data_Fim_Garantia.split('/');
            const dataFim = new Date(parts[2], parts[1] - 1, parts[0]);
            
            return dataFim < hoje || garantia.Status === 'Expirada';
        });
        
        // Renderizar tabelas
        renderGarantiasTable('ativas', garantiasData.ativas);
        renderGarantiasTable('vencidas', garantiasData.vencidas);
        renderGarantiasTable('todas', garantiasData.todas);
        
        // Configurar paginação
        setupPagination('ativas', garantiasData.ativas);
        setupPagination('vencidas', garantiasData.vencidas);
        setupPagination('todas', garantiasData.todas);
    } catch (error) {
        console.error('Erro ao carregar garantias:', error);
        showAlert('Erro ao carregar garantias. Por favor, tente novamente.', 'danger');
        
        // Limpar tabelas com mensagem de erro
        document.querySelectorAll('[id^=garantias-][id$=-table]').forEach(table => {
            table.innerHTML = '<tr><td colspan="8" class="text-center">Erro ao carregar garantias</td></tr>';
        });
    } finally {
        hideSpinner();
    }
}

// Função para renderizar tabelas de garantias
function renderGarantiasTable(tipo, garantias, page = 1) {
    console.log(`Renderizando tabela de garantias ${tipo}...`);
    
    const tableId = `garantias-${tipo}-table`;
    const table = document.getElementById(tableId);
    
    if (!table) {
        console.warn(`Tabela ${tableId} não encontrada`);
        return;
    }
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGarantias = garantias.slice(startIndex, endIndex);
    
    table.innerHTML = '';
    
    if (paginatedGarantias.length === 0) {
        table.innerHTML = `<tr><td colspan="8" class="text-center">Nenhuma garantia encontrada</td></tr>`;
        return;
    }
    
    for (const garantia of paginatedGarantias) {
        let statusClass = '';
        
        switch (garantia.Status) {
            case 'Ativa':
                statusClass = 'active';
                break;
            case 'Expirada':
                statusClass = 'expired';
                break;
            case 'Acionada':
                statusClass = 'in-progress';
                break;
            default:
                statusClass = 'active';
        }
        
        table.innerHTML += `
            <tr>
                <td>${garantia.ID_Garantia || ''}</td>
                <td>${garantia.ID_OS || ''}</td>
                <td>${garantia.Cliente || ''}</td>
                <td>${garantia.Servico || ''}</td>
                <td>${garantia.Data_Inicio_Garantia || ''}</td>
                <td>${garantia.Data_Fim_Garantia || ''}</td>
                <td><span class="status ${statusClass}">${garantia.Status || 'Ativa'}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editarGarantia('${garantia.ID_Garantia}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmarExclusaoGarantia('${garantia.ID_Garantia}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
}

// Função para configurar paginação
function setupPagination(tipo, garantias) {
    const paginationId = `garantias-${tipo}-pagination`;
    const paginationElement = document.getElementById(paginationId);
    
    if (!paginationElement) {
        console.warn(`Paginação ${paginationId} não encontrada`);
        return;
    }
    
    const totalPages = Math.ceil(garantias.length / itemsPerPage);
    
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Adicionar botões de paginação
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('div');
        pageButton.className = `pagination-item ${i === 1 ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage[tipo] = i;
            
            document.querySelectorAll(`#${paginationId} .pagination-item`).forEach(item => 
                item.classList.remove('active')
            );
            pageButton.classList.add('active');
            
            renderGarantiasTable(tipo, garantias, i);
        });
        
        paginationElement.appendChild(pageButton);
    }
}

// Função para buscar garantias
function buscarGarantias() {
    const searchInput = document.getElementById('search-garantia');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        loadGarantiasData();
        return;
    }
    
    console.log(`Buscando garantias: "${searchTerm}"`);
    showSpinner();
    
    // Filtrar garantias em cada categoria
    const filteredAtivas = garantiasData.ativas.filter(garantia => 
        (garantia.Cliente && garantia.Cliente.toLowerCase().includes(searchTerm)) ||
        (garantia.Servico && garantia.Servico.toLowerCase().includes(searchTerm)) ||
        (garantia.ID_OS && garantia.ID_OS.toLowerCase().includes(searchTerm))
    );
    
    const filteredVencidas = garantiasData.vencidas.filter(garantia => 
        (garantia.Cliente && garantia.Cliente.toLowerCase().includes(searchTerm)) ||
        (garantia.Servico && garantia.Servico.toLowerCase().includes(searchTerm)) ||
        (garantia.ID_OS && garantia.ID_OS.toLowerCase().includes(searchTerm))
    );
    
    const filteredTodas = garantiasData.todas.filter(garantia => 
        (garantia.Cliente && garantia.Cliente.toLowerCase().includes(searchTerm)) ||
        (garantia.Servico && garantia.Servico.toLowerCase().includes(searchTerm)) ||
        (garantia.ID_OS && garantia.ID_OS.toLowerCase().includes(searchTerm))
    );
    
    // Renderizar resultados
    renderGarantiasTable('ativas', filteredAtivas);
    renderGarantiasTable('vencidas', filteredVencidas);
    renderGarantiasTable('todas', filteredTodas);
    
    // Configurar paginação
    setupPagination('ativas', filteredAtivas);
    setupPagination('vencidas', filteredVencidas);
    setupPagination('todas', filteredTodas);
    
    hideSpinner();
}

// Função para abrir modal de nova garantia
async function openNewGarantiaModal() {
    console.log("Abrindo modal de nova garantia...");
    
    // Limpar formulário
    document.getElementById('garantia-form').reset();
    document.getElementById('garantia-id').value = '';
    document.getElementById('garantia-cliente').value = '';
    document.getElementById('garantia-servico').value = '';
    
    // Definir título
    document.getElementById('garantia-modal-title').textContent = 'Nova Garantia';
    
    // Carregar ordens de serviço
    await carregarOrdens();
    
    // Abrir modal
    document.getElementById('garantia-modal').style.display = 'flex';
}

// Função para carregar ordens de serviço
async function carregarOrdens() {
    console.log("Carregando ordens de serviço...");
    showSpinner();
    
    try {
        // Buscar ordens concluídas
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Ordens):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordens: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        // Filtrar ordens concluídas
        const ordensConcluidas = ordens.filter(ordem => ordem.Status === 'Concluído');
        
        // Preencher dropdown
        const selectOs = document.getElementById('garantia-os');
        if (!selectOs) return;
        
        selectOs.innerHTML = '<option value="">Selecione a OS</option>';
        
        ordensConcluidas.forEach(ordem => {
            selectOs.innerHTML += `<option value="${ordem.ID}">${ordem.ID} - ${ordem.Cliente} (${ordem.Data_Conclusao || 'Sem data'})</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        showAlert('Erro ao carregar ordens de serviço. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para carregar dados da OS selecionada
async function carregarDadosOS(idOs) {
    if (!idOs) {
        document.getElementById('garantia-cliente').value = '';
        document.getElementById('garantia-servico').value = '';
        return;
    }
    
    console.log(`Carregando dados da OS: ${idOs}`);
    showSpinner();
    
    try {
        // Buscar ordem específica
        const response = await fetch(`${SHEET_API}/search?sheet=Ordens_Servico&ID=${idOs}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar OS):", response.status, response.statusText);
            throw new Error(`Erro ao buscar OS: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        if (!ordens || ordens.length === 0) {
            showAlert('Ordem de serviço não encontrada', 'danger');
            return;
        }
        
        const ordem = ordens[0];
        
        // Preencher campos
        document.getElementById('garantia-cliente').value = ordem.Cliente || '';
        document.getElementById('garantia-servico').value = ordem.Servicos || '';
        
        // Definir data de início como data de conclusão da OS
        const dataInicio = document.getElementById('garantia-inicio');
        if (dataInicio && ordem.Data_Conclusao) {
            const parts = ordem.Data_Conclusao.split('/');
            const dataFormat = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            dataInicio.value = dataFormat;
            
            // Calcular data de fim (padrão de 90 dias)
            const dataFim = document.getElementById('garantia-fim');
            if (dataFim) {
                const dtInicio = new Date(parts[2], parts[1]-1, parts[0]);
                const dtFim = new Date(dtInicio);
                dtFim.setDate(dtFim.getDate() + 90);
                
                const year = dtFim.getFullYear();
                const month = String(dtFim.getMonth() + 1).padStart(2, '0');
                const day = String(dtFim.getDate()).padStart(2, '0');
                
                dataFim.value = `${year}-${month}-${day}`;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados da OS:', error);
        showAlert('Erro ao carregar dados da ordem de serviço', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para editar garantia
async function editarGarantia(id) {
    console.log(`Editando garantia: ${id}`);
    showSpinner();
    
    try {
        // Buscar garantia
        const response = await fetch(`${SHEET_API}/search?sheet=Garantias&ID_Garantia=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar garantia):", response.status, response.statusText);
            throw new Error(`Erro ao buscar garantia: ${response.status}`);
        }
        
        const garantias = await response.json();
        
        if (!garantias || garantias.length === 0) {
            showAlert('Garantia não encontrada', 'danger');
            return;
        }
        
        const garantia = garantias[0];
        
        // Carregar ordens de serviço
        await carregarOrdens();
        
        // Preencher formulário
        document.getElementById('garantia-id').value = garantia.ID_Garantia || '';
        
        const selectOs = document.getElementById('garantia-os');
        if (selectOs) {
            // Verificar se a opção já existe
            let option = Array.from(selectOs.options).find(opt => opt.value === garantia.ID_OS);
            
            if (!option) {
                // Adicionar opção se não existir
                option = document.createElement('option');
                option.value = garantia.ID_OS;
                option.textContent = `${garantia.ID_OS} - ${garantia.Cliente}`;
                selectOs.appendChild(option);
            }
            
            selectOs.value = garantia.ID_OS;
        }
        
        document.getElementById('garantia-cliente').value = garantia.Cliente || '';
        document.getElementById('garantia-servico').value = garantia.Servico || '';
        
        // Converter datas
        if (garantia.Data_Inicio_Garantia) {
            const parts = garantia.Data_Inicio_Garantia.split('/');
            document.getElementById('garantia-inicio').value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        
        if (garantia.Data_Fim_Garantia) {
            const parts = garantia.Data_Fim_Garantia.split('/');
            document.getElementById('garantia-fim').value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        
        document.getElementById('garantia-status').value = garantia.Status || 'Ativa';
        document.getElementById('garantia-observacoes').value = garantia.Observacoes || '';
        
        // Abrir modal
        document.getElementById('garantia-modal-title').textContent = 'Editar Garantia';
        document.getElementById('garantia-modal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao editar garantia:', error);
        showAlert('Erro ao carregar dados da garantia', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para salvar garantia
async function salvarGarantia() {
    console.log("Salvando garantia...");
    
    // Capturar dados do formulário
    const garantiaId = document.getElementById('garantia-id').value;
    const osId = document.getElementById('garantia-os').value;
    const cliente = document.getElementById('garantia-cliente').value;
    const servico = document.getElementById('garantia-servico').value;
    const dataInicio = document.getElementById('garantia-inicio').value;
    const dataFim = document.getElementById('garantia-fim').value;
    const status = document.getElementById('garantia-status').value;
    const observacoes = document.getElementById('garantia-observacoes').value;
    
    // Validar campos obrigatórios
    if (!osId || !dataInicio || !dataFim) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    // Converter datas para formato BR
    const dataInicioFormatted = dataInicio ? formatDateToBR(dataInicio) : '';
    const dataFimFormatted = dataFim ? formatDateToBR(dataFim) : '';
    
    showSpinner();
    
    // Preparar dados
    const garantiaData = {
        ID_OS: osId,
        Cliente: cliente,
        Servico: servico,
        Data_Inicio_Garantia: dataInicioFormatted,
        Data_Fim_Garantia: dataFimFormatted,
        Status: status,
        Observacoes: observacoes
    };
    
    try {
        if (garantiaId) {
            // Atualizar garantia existente
            console.log(`Atualizando garantia: ${garantiaId}`);
            
            const response = await fetch(`${SHEET_API}/ID_Garantia/${garantiaId}?sheet=Garantias`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: garantiaData })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Atualizar garantia):", response.status, response.statusText);
                throw new Error(`Erro ao atualizar garantia: ${response.status}`);
            }
            
            showAlert('Garantia atualizada com sucesso!', 'success');
        } else {
            // Adicionar nova garantia
            console.log("Adicionando nova garantia");
            
            // Gerar ID
            const garantias = await fetch(`${SHEET_API}?sheet=Garantias`).then(res => res.json());
            
            const lastId = garantias.length > 0 
                ? Math.max(...garantias.map(g => parseInt(g.ID_Garantia?.replace('GA', '') || '0')))
                : 0;
            
            garantiaData.ID_Garantia = `GA${String(lastId + 1).padStart(4, '0')}`;
            
            const response = await fetch(`${SHEET_API}?sheet=Garantias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [garantiaData] })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Adicionar garantia):", response.status, response.statusText);
                throw new Error(`Erro ao adicionar garantia: ${response.status}`);
            }
            
            showAlert('Garantia adicionada com sucesso!', 'success');
        }
        
        // Fechar modal e recarregar dados
        document.getElementById('garantia-modal').style.display = 'none';
        loadGarantiasData();
    } catch (error) {
        console.error('Erro ao salvar garantia:', error);
        showAlert('Erro ao salvar garantia. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para confirmar exclusão de garantia
function confirmarExclusaoGarantia(id) {
    if (confirm('Tem certeza que deseja excluir esta garantia? Esta ação não pode ser desfeita.')) {
        excluirGarantia(id);
    }
}

// Função para excluir garantia
async function excluirGarantia(id) {
    console.log(`Excluindo garantia: ${id}`);
    showSpinner();
    
    try {
        const response = await fetch(`${SHEET_API}/ID_Garantia/${id}?sheet=Garantias`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Excluir garantia):", response.status, response.statusText);
            throw new Error(`Erro ao excluir garantia: ${response.status}`);
        }
        
        showAlert('Garantia excluída com sucesso!', 'success');
        loadGarantiasData();
    } catch (error) {
        console.error('Erro ao excluir garantia:', error);
        showAlert('Erro ao excluir garantia', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para formatar data para o formato BR (DD/MM/YYYY)
function formatDateToBR(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}
