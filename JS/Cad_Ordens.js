// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentPage = 1;
const itemsPerPage = 10;
let ordensData = [];
let clientesData = [];
let servicosData = [];
let filtroAtual = {
    status: '',
    cliente: '',
    periodo: 'todos'
};

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando módulo de ordens de serviço...");
    
    // Configurar data atual para nova ordem
    definirDataAtual();
    
    // Carregar dados
    loadOrdensData();
    
    // Carregar dados de clientes e serviços para os formulários
    loadClientesData();
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
    document.getElementById('btn-search-ordem').addEventListener('click', buscarOrdens);
    document.getElementById('search-ordem').addEventListener('keyup', e => {
        if (e.key === 'Enter') buscarOrdens();
    });
    
    // Configurar botão de nova ordem
    document.getElementById('btn-nova-ordem').addEventListener('click', () => openOrdemModal());
    
    // Configurar salvar ordem
    document.getElementById('btn-save-ordem').addEventListener('click', salvarOrdem);
    
    // Configurar mudança de status
    document.getElementById('ordem-status').addEventListener('change', toggleCamposConclusao);
    
    // Configurar botão de imprimir
    document.getElementById('btn-print-ordem').addEventListener('click', imprimirOrdem);
    
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

// Definir data atual para formulário
function definirDataAtual() {
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    
    document.getElementById('ordem-data-abertura').value = `${year}-${month}-${day}`;
}

// Aplicar filtros
function aplicarFiltros() {
    console.log("Aplicando filtros");
    
    // Obter valores dos filtros
    filtroAtual.status = document.getElementById('filtro-status').value;
    filtroAtual.cliente = document.getElementById('filtro-cliente').value;
    filtroAtual.periodo = document.getElementById('filtro-periodo').value;
    
    // Reiniciar paginação
    currentPage = 1;
    
    // Carregar dados filtrados
    loadOrdensData();
}

// Carregar dados das ordens
async function loadOrdensData() {
    console.log("Carregando dados de ordens de serviço...");
    showSpinner();
    
    try {
        // Buscar dados das ordens
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API:", response.status, response.statusText);
            throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const ordens = await response.json();
        console.log(`${ordens.length} ordens carregadas`);
        
        // Aplicar filtros
        let ordensFiltradas = [...ordens];
        
        // Filtrar por status
        if (filtroAtual.status) {
            ordensFiltradas = ordensFiltradas.filter(ordem => ordem.Status === filtroAtual.status);
        }
        
        // Filtrar por cliente
        if (filtroAtual.cliente) {
            ordensFiltradas = ordensFiltradas.filter(ordem => ordem.ID_Cliente === filtroAtual.cliente);
        }
        
        // Filtrar por período
        if (filtroAtual.periodo !== 'todos') {
            const hoje = new Date();
            let diasAtras;
            
            switch (filtroAtual.periodo) {
                case '7dias':
                    diasAtras = 7;
                    break;
                case '30dias':
                    diasAtras = 30;
                    break;
                case '90dias':
                    diasAtras = 90;
                    break;
                default:
                    diasAtras = 0;
            }
            
            if (diasAtras > 0) {
                const dataLimite = new Date();
                dataLimite.setDate(hoje.getDate() - diasAtras);
                
                ordensFiltradas = ordensFiltradas.filter(ordem => {
                    if (!ordem.Data_Abertura) return false;
                    
                    const parts = ordem.Data_Abertura.split('/');
                    const dataOrdem = new Date(parts[2], parts[1] - 1, parts[0]);
                    
                    return dataOrdem >= dataLimite;
                });
            }
        }
        
        // Armazenar dados filtrados
        ordensData = ordensFiltradas;
        
        // Atualizar estatísticas
        atualizarEstatisticas();
        
        // Renderizar tabela
        renderOrdensTable(ordensData);
        
        // Configurar paginação
        setupPagination(ordensData);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados. Por favor, tente novamente.', 'danger');
        
        document.getElementById('ordens-table').innerHTML = '<tr><td colspan="8" class="text-center">Erro ao carregar dados</td></tr>';
    } finally {
        hideSpinner();
    }
}

// Carregar dados de clientes
async function loadClientesData() {
    try {
        // Buscar dados dos clientes
        const response = await fetch(`${SHEET_API}?sheet=Clientes`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Clientes):", response.status, response.statusText);
            throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        
        const clientes = await response.json();
        clientesData = clientes;
        
        // Preencher select de clientes
        const selectCliente = document.getElementById('ordem-cliente');
        const filtroCliente = document.getElementById('filtro-cliente');
        
        if (selectCliente && filtroCliente) {
            // Manter a primeira opção
            selectCliente.innerHTML = '<option value="">Selecione o cliente</option>';
            filtroCliente.innerHTML = '<option value="">Todos</option>';
            
            // Adicionar clientes ordenados por nome
            clientesData
                .filter(cliente => cliente.Situacao === 'Ativo')
                .sort((a, b) => a.Nome.localeCompare(b.Nome))
                .forEach(cliente => {
                    selectCliente.innerHTML += `<option value="${cliente.ID}">${cliente.Nome}</option>`;
                    filtroCliente.innerHTML += `<option value="${cliente.ID}">${cliente.Nome}</option>`;
                });
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showAlert('Erro ao carregar lista de clientes', 'danger');
    }
}

// Carregar dados de serviços
async function loadServicosData() {
    try {
        // Buscar dados dos serviços
        const response = await fetch(`${SHEET_API}?sheet=Servicos`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Serviços):", response.status, response.statusText);
            throw new Error(`Erro ao buscar serviços: ${response.status}`);
        }
        
        const servicos = await response.json();
        servicosData = servicos;
        
        // Preencher checkboxes de serviços
        const servicosContainer = document.getElementById('servicos-container');
        
        if (servicosContainer) {
            servicosContainer.innerHTML = '';
            
            // Adicionar serviços ordenados por categoria
            servicosData
                .filter(servico => servico.Situacao === 'Ativo')
                .sort((a, b) => {
                    // Ordenar primeiro por categoria, depois por nome
                    if (a.Categoria !== b.Categoria) {
                        return a.Categoria.localeCompare(b.Categoria);
                    }
                    return a.Nome.localeCompare(b.Nome);
                })
                .forEach(servico => {
                    // Verificar se já existe um container para esta categoria
                    let categoriaDiv = document.querySelector(`.categoria-servicos[data-categoria="${servico.Categoria}"]`);
                    
                    if (!categoriaDiv) {
                        categoriaDiv = document.createElement('div');
                        categoriaDiv.className = 'categoria-servicos';
                        categoriaDiv.dataset.categoria = servico.Categoria;
                        
                        const categoriaTitle = document.createElement('div');
                        categoriaTitle.className = 'categoria-title';
                        categoriaTitle.textContent = servico.Categoria;
                        
                        categoriaDiv.appendChild(categoriaTitle);
                        servicosContainer.appendChild(categoriaDiv);
                    }
                    
                    // Adicionar checkbox para o serviço
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'checkbox-item';
                    checkboxDiv.innerHTML = `
                        <input type="checkbox" id="servico-${servico.ID}" name="servicos" value="${servico.ID}" data-preco="${servico.Preco || 0}">
                        <label for="servico-${servico.ID}">${servico.Nome} - R$ ${parseFloat(servico.Preco || 0).toFixed(2)}</label>
                    `;
                    
                    categoriaDiv.appendChild(checkboxDiv);
                });
            
            // Adicionar evento para atualizar valor total ao selecionar serviços
            document.querySelectorAll('input[name="servicos"]').forEach(checkbox => {
                checkbox.addEventListener('change', calcularValorTotal);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        showAlert('Erro ao carregar lista de serviços', 'danger');
        
        // Exibir mensagem de erro no container
        const servicosContainer = document.getElementById('servicos-container');
        if (servicosContainer) {
            servicosContainer.innerHTML = '<div class="error-message">Erro ao carregar serviços. Por favor, recarregue a página.</div>';
        }
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const abertas = ordensData.filter(ordem => ordem.Status === 'Aberto').length;
    const andamento = ordensData.filter(ordem => ordem.Status === 'Em Andamento').length;
    const concluidas = ordensData.filter(ordem => ordem.Status === 'Concluído').length;
    const canceladas = ordensData.filter(ordem => ordem.Status === 'Cancelado').length;
    
    document.getElementById('ordens-abertas').textContent = abertas;
    document.getElementById('ordens-andamento').textContent = andamento;
    document.getElementById('ordens-concluidas').textContent = concluidas;
    document.getElementById('ordens-canceladas').textContent = canceladas;
}

// Renderizar tabela de ordens
function renderOrdensTable(ordens, page = 1) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrdens = ordens.slice(startIndex, endIndex);
    
    const table = document.getElementById('ordens-table');
    
    if (!table) {
        console.warn('Tabela não encontrada');
        return;
    }
    
    table.innerHTML = '';
    
    if (paginatedOrdens.length === 0) {
        table.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma ordem de serviço encontrada</td></tr>';
        return;
    }
    
    for (const ordem of paginatedOrdens) {
        // Encontrar nome do cliente
        const cliente = clientesData.find(c => c.ID === ordem.ID_Cliente);
        const clienteNome = cliente ? cliente.Nome : 'Cliente não encontrado';
        
        // Formatar serviços
        let servicosTexto = 'N/A';
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            const servicosNomes = servicosIds.map(id => {
                const servico = servicosData.find(s => s.ID === id);
                return servico ? servico.Nome : 'Serviço não encontrado';
            });
            servicosTexto = servicosNomes.join(', ');
        }
        
        let statusClass = '';
        switch (ordem.Status) {
            case 'Aberto':
                statusClass = 'pending';
                break;
            case 'Em Andamento':
                statusClass = 'progress';
                break;
            case 'Concluído':
                statusClass = 'active';
                break;
            case 'Cancelado':
                statusClass = 'inactive';
                break;
        }
        
        table.innerHTML += `
            <tr>
                <td>${ordem.ID || ''}</td>
                <td>${clienteNome}</td>
                <td>${servicosTexto}</td>
                <td>${ordem.Data_Abertura || ''}</td>
                <td>R$ ${parseFloat(ordem.Valor_Total || 0).toFixed(2)}</td>
                <td><span class="status ${statusClass}">${ordem.Status || ''}</span></td>
                <td>${ordem.Tecnico || ''}</td>
                <td>
                    <button class="btn-icon info" onclick="verDetalhesOrdem('${ordem.ID}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="editarOrdem('${ordem.ID}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmarExclusaoOrdem('${ordem.ID}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
}

// Configurar paginação
function setupPagination(ordens) {
    const totalPages = Math.ceil(ordens.length / itemsPerPage);
    const pagination = document.getElementById('ordens-pagination');
    
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
            
            document.querySelectorAll('#ordens-pagination .pagination-item').forEach(item => 
                item.classList.remove('active')
            );
            pageButton.classList.add('active');
            
            renderOrdensTable(ordensData, i);
        });
        
        pagination.appendChild(pageButton);
    }
}

// Função de busca
function buscarOrdens() {
    const searchTerm = document.getElementById('search-ordem').value.toLowerCase();
    
    if (!searchTerm) {
        renderOrdensTable(ordensData);
        setupPagination(ordensData);
        return;
    }
    
    // Filtrar ordens
    const filteredOrdens = ordensData.filter(ordem => {
        // Encontrar cliente
        const cliente = clientesData.find(c => c.ID === ordem.ID_Cliente);
        const clienteNome = cliente ? cliente.Nome.toLowerCase() : '';
        
        // Buscar por serviços
        let servicosTexto = '';
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            servicosIds.forEach(id => {
                const servico = servicosData.find(s => s.ID === id);
                if (servico) {
                    servicosTexto += servico.Nome.toLowerCase() + ' ';
                }
            });
        }
        
        return (
            (ordem.ID && ordem.ID.toLowerCase().includes(searchTerm)) ||
            clienteNome.includes(searchTerm) ||
            servicosTexto.includes(searchTerm) ||
            (ordem.Descricao_Problema && ordem.Descricao_Problema.toLowerCase().includes(searchTerm))
        );
    });
    
    // Renderizar resultados
    currentPage = 1;
    renderOrdensTable(filteredOrdens);
    setupPagination(filteredOrdens);
}

// Abrir modal de nova ordem
function openOrdemModal(id = null) {
    console.log(`Abrindo modal de ${id ? 'edição' : 'nova'} ordem`);
    
    // Limpar formulário
    document.getElementById('ordem-form').reset();
    document.getElementById('ordem-id').value = '';
    
    // Configurar data para hoje
    definirDataAtual();
    
    // Desmarcar todos os serviços
    document.querySelectorAll('input[name="servicos"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Mostrar/ocultar campos relevantes
    toggleCamposConclusao();
    
    // Definir título
    document.getElementById('ordem-modal-title').textContent = id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço';
    
    // Carregar dados se for edição
    if (id) {
        carregarDadosOrdem(id);
    }
    
    // Abrir modal
    document.getElementById('ordem-modal').style.display = 'flex';
}

// Carregar dados de uma ordem para edição
async function carregarDadosOrdem(id) {
    showSpinner();
    
    try {
        // Buscar ordem específica
        const response = await fetch(`${SHEET_API}/search?sheet=Ordens_Servico&ID=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar ordem):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordem: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        if (!ordens || ordens.length === 0) {
            showAlert('Ordem não encontrada', 'danger');
            return;
        }
        
        const ordem = ordens[0];
        
        // Preencher formulário
        document.getElementById('ordem-id').value = ordem.ID || '';
        document.getElementById('ordem-cliente').value = ordem.ID_Cliente || '';
        document.getElementById('ordem-descricao-problema').value = ordem.Descricao_Problema || '';
        document.getElementById('ordem-status').value = ordem.Status || 'Aberto';
        document.getElementById('ordem-valor-total').value = ordem.Valor_Total || '';
        document.getElementById('ordem-forma-pagamento').value = ordem.Forma_Pagamento || '';
        document.getElementById('ordem-status-pagamento').value = ordem.Status_Pagamento || 'Pendente';
        document.getElementById('ordem-tecnico').value = ordem.Tecnico || '';
        document.getElementById('ordem-solucao').value = ordem.Solucao || '';
        
        // Converter datas
        if (ordem.Data_Abertura) {
            const parts = ordem.Data_Abertura.split('/');
            document.getElementById('ordem-data-abertura').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        if (ordem.Data_Conclusao) {
            const parts = ordem.Data_Conclusao.split('/');
            document.getElementById('ordem-data-conclusao').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        // Marcar serviços
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            
            document.querySelectorAll('input[name="servicos"]').forEach(checkbox => {
                checkbox.checked = servicosIds.includes(checkbox.value);
            });
        }
        
        // Mostrar/ocultar campos relevantes
        toggleCamposConclusao();
    } catch (error) {
        console.error('Erro ao carregar dados da ordem:', error);
        showAlert('Erro ao carregar dados da ordem', 'danger');
    } finally {
        hideSpinner();
    }
}

// Toggle campos de conclusão com base no status
function toggleCamposConclusao() {
    const status = document.getElementById('ordem-status').value;
    const dataConclusaoContainer = document.querySelector('.data-conclusao-container');
    const solucaoContainer = document.querySelector('.solucao-container');
    
    if (status === 'Concluído') {
        dataConclusaoContainer.style.display = 'block';
        solucaoContainer.style.display = 'block';
        
        // Se não houver data de conclusão preenchida, usar data atual
        if (!document.getElementById('ordem-data-conclusao').value) {
            const hoje = new Date();
            const year = hoje.getFullYear();
            const month = String(hoje.getMonth() + 1).padStart(2, '0');
            const day = String(hoje.getDate()).padStart(2, '0');
            
            document.getElementById('ordem-data-conclusao').value = `${year}-${month}-${day}`;
        }
    } else {
        dataConclusaoContainer.style.display = 'none';
        solucaoContainer.style.display = 'none';
    }
}

// Calcular valor total com base nos serviços selecionados
function calcularValorTotal() {
    let valorTotal = 0;
    
    document.querySelectorAll('input[name="servicos"]:checked').forEach(checkbox => {
        valorTotal += parseFloat(checkbox.dataset.preco || 0);
    });
    
    document.getElementById('ordem-valor-total').value = valorTotal.toFixed(2);
}

// Salvar ordem
async function salvarOrdem() {
    // Validar campos obrigatórios
    const cliente = document.getElementById('ordem-cliente').value;
    const dataAbertura = document.getElementById('ordem-data-abertura').value;
    const status = document.getElementById('ordem-status').value;
    const valorTotal = document.getElementById('ordem-valor-total').value;
    
    if (!cliente || !dataAbertura || !status || !valorTotal) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    // Verificar se pelo menos um serviço foi selecionado
    const servicosSelecionados = document.querySelectorAll('input[name="servicos"]:checked');
    if (servicosSelecionados.length === 0) {
        showAlert('Selecione pelo menos um serviço', 'danger');
        return;
    }
    
    // Verificar campos adicionais para status concluído
    if (status === 'Concluído') {
        const dataConclusao = document.getElementById('ordem-data-conclusao').value;
        
        if (!dataConclusao) {
            showAlert('Informe a data de conclusão', 'danger');
            return;
        }
    }
    
    showSpinner();
    
    try {
        // Preparar dados da ordem
        const ordemId = document.getElementById('ordem-id').value;
        const descricaoProblema = document.getElementById('ordem-descricao-problema').value;
        const formaPagamento = document.getElementById('ordem-forma-pagamento').value;
        const statusPagamento = document.getElementById('ordem-status-pagamento').value;
        const tecnico = document.getElementById('ordem-tecnico').value;
        const solucao = document.getElementById('ordem-solucao').value;
        
        // Converter datas para formato BR
        const dataAberturaFormatted = formatDateToBR(dataAbertura);
        
        let dataConclusaoFormatted = '';
        if (status === 'Concluído') {
            const dataConclusao = document.getElementById('ordem-data-conclusao').value;
            dataConclusaoFormatted = formatDateToBR(dataConclusao);
        }
        
        // Obter IDs dos serviços selecionados
        const servicosIds = Array.from(servicosSelecionados).map(checkbox => checkbox.value);
        
        const ordemData = {
            ID_Cliente: cliente,
            Servicos: servicosIds.join(','),
            Descricao_Problema: descricaoProblema,
            Data_Abertura: dataAberturaFormatted,
            Data_Conclusao: dataConclusaoFormatted,
            Status: status,
            Valor_Total: valorTotal,
            Forma_Pagamento: formaPagamento,
            Status_Pagamento: statusPagamento,
            Tecnico: tecnico,
            Solucao: solucao
        };
        
        if (ordemId) {
            // Atualizar ordem existente
            const response = await fetch(`${SHEET_API}/ID/${ordemId}?sheet=Ordens_Servico`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: ordemData })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Atualizar ordem):", response.status, response.statusText);
                throw new Error(`Erro ao atualizar ordem: ${response.status}`);
            }
            
            showAlert('Ordem de serviço atualizada com sucesso!', 'success');
        } else {
            // Adicionar nova ordem
            // Gerar ID
            const newId = await generateNewOrdemId();
            ordemData.ID = newId;
            
            const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [ordemData] })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Adicionar ordem):", response.status, response.statusText);
                throw new Error(`Erro ao adicionar ordem: ${response.status}`);
            }
            
            showAlert('Ordem de serviço adicionada com sucesso!', 'success');
        }
        
        // Fechar modal e recarregar dados
        document.getElementById('ordem-modal').style.display = 'none';
        loadOrdensData();
    } catch (error) {
        console.error('Erro ao salvar ordem:', error);
        showAlert('Erro ao salvar ordem de serviço. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Gerar novo ID de ordem
async function generateNewOrdemId() {
    try {
        // Buscar todas as ordens para encontrar o último ID
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        const ordens = await response.json();
        
        let maxId = 0;
        ordens.forEach(ordem => {
            if (ordem.ID) {
                const idNumber = parseInt(ordem.ID.replace('OS', ''));
                maxId = Math.max(maxId, idNumber);
            }
        });
        
        return `OS${String(maxId + 1).padStart(4, '0')}`;
    } catch (error) {
        console.error('Erro ao gerar ID:', error);
        // Gerar ID baseado em timestamp como fallback
        const timestamp = Date.now().toString().slice(-6);
        return `OS${timestamp}`;
    }
}

// Ver detalhes da ordem
async function verDetalhesOrdem(id) {
    console.log(`Visualizando detalhes da ordem: ${id}`);
    showSpinner();
    
    try {
        // Buscar ordem específica
        const response = await fetch(`${SHEET_API}/search?sheet=Ordens_Servico&ID=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar ordem):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordem: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        if (!ordens || ordens.length === 0) {
            showAlert('Ordem não encontrada', 'danger');
            return;
        }
        
        const ordem = ordens[0];
        
        // Encontrar cliente
        const cliente = clientesData.find(c => c.ID === ordem.ID_Cliente);
        const clienteNome = cliente ? cliente.Nome : 'Cliente não encontrado';
        const clienteTelefone = cliente ? cliente.Telefone : 'N/A';
        
        // Formatar serviços
        let servicosHTML = '<p class="no-services">Nenhum serviço registrado</p>';
        
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            const servicosDetalhes = servicosIds.map(id => {
                const servico = servicosData.find(s => s.ID === id);
                return servico || { Nome: 'Serviço não encontrado', Preco: 0 };
            });
            
            if (servicosDetalhes.length > 0) {
                servicosHTML = '<ul class="services-list">';
                servicosDetalhes.forEach(servico => {
                    servicosHTML += `<li>${servico.Nome} - R$ ${parseFloat(servico.Preco || 0).toFixed(2)}</li>`;
                });
                servicosHTML += '</ul>';
            }
        }
        
        // Determinar status da garantia
        let garantiaStatus = 'N/A';
        let garantiaClass = '';
        
        if (ordem.Status === 'Concluído' && ordem.Data_Conclusao) {
            // Verificar se algum serviço tem garantia
            const servicosIds = ordem.Servicos ? ordem.Servicos.split(',').map(id => id.trim()) : [];
            const servicosComGarantia = servicosIds
                .map(id => servicosData.find(s => s.ID === id))
                .filter(s => s && s.Garantia && parseInt(s.Garantia) > 0);
            
            if (servicosComGarantia.length > 0) {
                // Pegar a maior garantia
                const maiorGarantia = Math.max(...servicosComGarantia.map(s => parseInt(s.Garantia)));
                
                // Calcular data de fim da garantia
                const [dia, mes, ano] = ordem.Data_Conclusao.split('/');
                const dataConclusao = new Date(ano, mes - 1, dia);
                const dataFimGarantia = new Date(dataConclusao);
                dataFimGarantia.setDate(dataFimGarantia.getDate() + maiorGarantia);
                
                // Verificar se ainda está na garantia
                if (dataFimGarantia >= new Date()) {
                    garantiaStatus = `Em garantia até ${dataFimGarantia.toLocaleDateString('pt-BR')}`;
                    garantiaClass = 'em-garantia';
                } else {
                    garantiaStatus = 'Garantia expirada';
                    garantiaClass = 'garantia-expirada';
                }
            } else {
                garantiaStatus = 'Sem garantia';
            }
        }
        
        // Definir título do modal
        document.getElementById('detalhes-modal-title').textContent = `Ordem de Serviço - ${id}`;
        
        // Preencher detalhes
        document.getElementById('detalhes-content').innerHTML = `
            <div class="detalhes-grid">
                <div class="detalhes-section">
                    <h4>Informações Gerais</h4>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="status ${getStatusClass(ordem.Status)}">${ordem.Status || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Data de Abertura:</span>
                        <span>${ordem.Data_Abertura || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Data de Conclusão:</span>
                        <span>${ordem.Data_Conclusao || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Técnico:</span>
                        <span>${ordem.Tecnico || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Garantia:</span>
                        <span class="${garantiaClass}">${garantiaStatus}</span>
                    </div>
                </div>
                
                <div class="detalhes-section">
                    <h4>Cliente</h4>
                    <div class="info-row">
                        <span class="info-label">Nome:</span>
                        <span>${clienteNome}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Telefone:</span>
                        <span>${clienteTelefone}</span>
                    </div>
                </div>
                
                <div class="detalhes-section full-width">
                    <h4>Descrição do Problema</h4>
                    <div class="problema-texto">
                        ${ordem.Descricao_Problema ? `<p>${ordem.Descricao_Problema}</p>` : '<p class="no-data">Sem descrição</p>'}
                    </div>
                </div>
                
                <div class="detalhes-section full-width">
                    <h4>Solução Aplicada</h4>
                    <div class="solucao-texto">
                        ${ordem.Solucao ? `<p>${ordem.Solucao}</p>` : '<p class="no-data">Sem solução registrada</p>'}
                    </div>
                </div>
                
                <div class="detalhes-section">
                    <h4>Serviços Realizados</h4>
                    <div class="servicos-lista">
                        ${servicosHTML}
                    </div>
                </div>
                
                <div class="detalhes-section">
                    <h4>Pagamento</h4>
                    <div class="info-row">
                        <span class="info-label">Valor Total:</span>
                        <span>R$ ${parseFloat(ordem.Valor_Total || 0).toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Forma de Pagamento:</span>
                        <span>${ordem.Forma_Pagamento || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status do Pagamento:</span>
                        <span class="status-pagamento ${ordem.Status_Pagamento === 'Pago' ? 'pago' : 'pendente'}">
                            ${ordem.Status_Pagamento || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // Abrir modal
        document.getElementById('detalhes-modal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao carregar detalhes da ordem:', error);
        showAlert('Erro ao carregar detalhes da ordem', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para obter classe CSS para status
function getStatusClass(status) {
    switch (status) {
        case 'Aberto':
            return 'pending';
        case 'Em Andamento':
            return 'progress';
        case 'Concluído':
            return 'active';
        case 'Cancelado':
            return 'inactive';
        default:
            return 'pending';
    }
}

// Editar ordem
function editarOrdem(id) {
    openOrdemModal(id);
}

// Confirmar exclusão de ordem
function confirmarExclusaoOrdem(id) {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) {
        excluirOrdem(id);
    }
}

// Excluir ordem
async function excluirOrdem(id) {
    console.log(`Excluindo ordem: ${id}`);
    showSpinner();
    
    try {
        const response = await fetch(`${SHEET_API}/ID/${id}?sheet=Ordens_Servico`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Excluir ordem):", response.status, response.statusText);
            throw new Error(`Erro ao excluir ordem: ${response.status}`);
        }
        
        showAlert('Ordem de serviço excluída com sucesso!', 'success');
        loadOrdensData();
    } catch (error) {
        console.error('Erro ao excluir ordem:', error);
        showAlert('Erro ao excluir ordem', 'danger');
    } finally {
        hideSpinner();
    }
}

// Imprimir ordem
function imprimirOrdem() {
    window.print();
}

// Função para formatar data para o formato BR (DD/MM/YYYY)
function formatDateToBR(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentPage = 1;
const itemsPerPage = 10;
let ordensData = [];
let clientesData = [];
let servicosData = [];
let filtroAtual = {
    status: '',
    cliente: '',
    periodo: 'todos'
};

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando módulo de ordens de serviço...");
    
    // Configurar data atual para nova ordem
    definirDataAtual();
    
    // Carregar dados
    loadOrdensData();
    
    // Carregar dados de clientes e serviços para os formulários
    loadClientesData();
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
    document.getElementById('btn-search-ordem').addEventListener('click', buscarOrdens);
    document.getElementById('search-ordem').addEventListener('keyup', e => {
        if (e.key === 'Enter') buscarOrdens();
    });
    
    // Configurar botão de nova ordem
    document.getElementById('btn-nova-ordem').addEventListener('click', () => openOrdemModal());
    
    // Configurar salvar ordem
    document.getElementById('btn-save-ordem').addEventListener('click', salvarOrdem);
    
    // Configurar mudança de status
    document.getElementById('ordem-status').addEventListener('change', toggleCamposConclusao);
    
    // Configurar botão de imprimir
    document.getElementById('btn-print-ordem').addEventListener('click', imprimirOrdem);
    
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

// Definir data atual para formulário
function definirDataAtual() {
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    
    document.getElementById('ordem-data-abertura').value = `${year}-${month}-${day}`;
}

// Aplicar filtros
function aplicarFiltros() {
    console.log("Aplicando filtros");
    
    // Obter valores dos filtros
    filtroAtual.status = document.getElementById('filtro-status').value;
    filtroAtual.cliente = document.getElementById('filtro-cliente').value;
    filtroAtual.periodo = document.getElementById('filtro-periodo').value;
    
    // Reiniciar paginação
    currentPage = 1;
    
    // Carregar dados filtrados
    loadOrdensData();
}

// Carregar dados das ordens
async function loadOrdensData() {
    console.log("Carregando dados de ordens de serviço...");
    showSpinner();
    
    try {
        // Buscar dados das ordens
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API:", response.status, response.statusText);
            throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const ordens = await response.json();
        console.log(`${ordens.length} ordens carregadas`);
        
        // Aplicar filtros
        let ordensFiltradas = [...ordens];
        
        // Filtrar por status
        if (filtroAtual.status) {
            ordensFiltradas = ordensFiltradas.filter(ordem => ordem.Status === filtroAtual.status);
        }
        
        // Filtrar por cliente
        if (filtroAtual.cliente) {
            ordensFiltradas = ordensFiltradas.filter(ordem => ordem.ID_Cliente === filtroAtual.cliente);
        }
        
        // Filtrar por período
        if (filtroAtual.periodo !== 'todos') {
            const hoje = new Date();
            let diasAtras;
            
            switch (filtroAtual.periodo) {
                case '7dias':
                    diasAtras = 7;
                    break;
                case '30dias':
                    diasAtras = 30;
                    break;
                case '90dias':
                    diasAtras = 90;
                    break;
                default:
                    diasAtras = 0;
            }
            
            if (diasAtras > 0) {
                const dataLimite = new Date();
                dataLimite.setDate(hoje.getDate() - diasAtras);
                
                ordensFiltradas = ordensFiltradas.filter(ordem => {
                    if (!ordem.Data_Abertura) return false;
                    
                    const parts = ordem.Data_Abertura.split('/');
                    const dataOrdem = new Date(parts[2], parts[1] - 1, parts[0]);
                    
                    return dataOrdem >= dataLimite;
                });
            }
        }
        
        // Armazenar dados filtrados
        ordensData = ordensFiltradas;
        
        // Atualizar estatísticas
        atualizarEstatisticas();
        
        // Renderizar tabela
        renderOrdensTable(ordensData);
        
        // Configurar paginação
        setupPagination(ordensData);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados. Por favor, tente novamente.', 'danger');
        
        document.getElementById('ordens-table').innerHTML = '<tr><td colspan="8" class="text-center">Erro ao carregar dados</td></tr>';
    } finally {
        hideSpinner();
    }
}

// Carregar dados de clientes
async function loadClientesData() {
    try {
        // Buscar dados dos clientes
        const response = await fetch(`${SHEET_API}?sheet=Clientes`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Clientes):", response.status, response.statusText);
            throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        
        const clientes = await response.json();
        clientesData = clientes;
        
        // Preencher select de clientes
        const selectCliente = document.getElementById('ordem-cliente');
        const filtroCliente = document.getElementById('filtro-cliente');
        
        if (selectCliente && filtroCliente) {
            // Manter a primeira opção
            selectCliente.innerHTML = '<option value="">Selecione o cliente</option>';
            filtroCliente.innerHTML = '<option value="">Todos</option>';
            
            // Adicionar clientes ordenados por nome
            clientesData
                .filter(cliente => cliente.Situacao === 'Ativo')
                .sort((a, b) => a.Nome.localeCompare(b.Nome))
                .forEach(cliente => {
                    selectCliente.innerHTML += `<option value="${cliente.ID}">${cliente.Nome}</option>`;
                    filtroCliente.innerHTML += `<option value="${cliente.ID}">${cliente.Nome}</option>`;
                });
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showAlert('Erro ao carregar lista de clientes', 'danger');
    }
}

// Carregar dados de serviços
async function loadServicosData() {
    try {
        // Buscar dados dos serviços
        const response = await fetch(`${SHEET_API}?sheet=Servicos`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Serviços):", response.status, response.statusText);
            throw new Error(`Erro ao buscar serviços: ${response.status}`);
        }
        
        const servicos = await response.json();
        servicosData = servicos;
        
        // Preencher checkboxes de serviços
        const servicosContainer = document.getElementById('servicos-container');
        
        if (servicosContainer) {
            servicosContainer.innerHTML = '';
            
            // Adicionar serviços ordenados por categoria
            servicosData
                .filter(servico => servico.Situacao === 'Ativo')
                .sort((a, b) => {
                    // Ordenar primeiro por categoria, depois por nome
                    if (a.Categoria !== b.Categoria) {
                        return a.Categoria.localeCompare(b.Categoria);
                    }
                    return a.Nome.localeCompare(b.Nome);
                })
                .forEach(servico => {
                    // Verificar se já existe um container para esta categoria
                    let categoriaDiv = document.querySelector(`.categoria-servicos[data-categoria="${servico.Categoria}"]`);
                    
                    if (!categoriaDiv) {
                        categoriaDiv = document.createElement('div');
                        categoriaDiv.className = 'categoria-servicos';
                        categoriaDiv.dataset.categoria = servico.Categoria;
                        
                        const categoriaTitle = document.createElement('div');
                        categoriaTitle.className = 'categoria-title';
                        categoriaTitle.textContent = servico.Categoria;
                        
                        categoriaDiv.appendChild(categoriaTitle);
                        servicosContainer.appendChild(categoriaDiv);
                    }
                    
                    // Adicionar checkbox para o serviço
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'checkbox-item';
                    checkboxDiv.innerHTML = `
                        <input type="checkbox" id="servico-${servico.ID}" name="servicos" value="${servico.ID}" data-preco="${servico.Preco || 0}">
                        <label for="servico-${servico.ID}">${servico.Nome} - R$ ${parseFloat(servico.Preco || 0).toFixed(2)}</label>
                    `;
                    
                    categoriaDiv.appendChild(checkboxDiv);
                });
            
            // Adicionar evento para atualizar valor total ao selecionar serviços
            document.querySelectorAll('input[name="servicos"]').forEach(checkbox => {
                checkbox.addEventListener('change', calcularValorTotal);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        showAlert('Erro ao carregar lista de serviços', 'danger');
        
        // Exibir mensagem de erro no container
        const servicosContainer = document.getElementById('servicos-container');
        if (servicosContainer) {
            servicosContainer.innerHTML = '<div class="error-message">Erro ao carregar serviços. Por favor, recarregue a página.</div>';
        }
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const abertas = ordensData.filter(ordem => ordem.Status === 'Aberto').length;
    const andamento = ordensData.filter(ordem => ordem.Status === 'Em Andamento').length;
    const concluidas = ordensData.filter(ordem => ordem.Status === 'Concluído').length;
    const canceladas = ordensData.filter(ordem => ordem.Status === 'Cancelado').length;
    
    document.getElementById('ordens-abertas').textContent = abertas;
    document.getElementById('ordens-andamento').textContent = andamento;
    document.getElementById('ordens-concluidas').textContent = concluidas;
    document.getElementById('ordens-canceladas').textContent = canceladas;
}

// Renderizar tabela de ordens
function renderOrdensTable(ordens, page = 1) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrdens = ordens.slice(startIndex, endIndex);
    
    const table = document.getElementById('ordens-table');
    
    if (!table) {
        console.warn('Tabela não encontrada');
        return;
    }
    
    table.innerHTML = '';
    
    if (paginatedOrdens.length === 0) {
        table.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma ordem de serviço encontrada</td></tr>';
        return;
    }
    
    for (const ordem of paginatedOrdens) {
        // Encontrar nome do cliente
        const cliente = clientesData.find(c => c.ID === ordem.ID_Cliente);
        const clienteNome = cliente ? cliente.Nome : 'Cliente não encontrado';
        
        // Formatar serviços
        let servicosTexto = 'N/A';
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            const servicosNomes = servicosIds.map(id => {
                const servico = servicosData.find(s => s.ID === id);
                return servico ? servico.Nome : 'Serviço não encontrado';
            });
            servicosTexto = servicosNomes.join(', ');
        }
        
        let statusClass = '';
        switch (ordem.Status) {
            case 'Aberto':
                statusClass = 'pending';
                break;
            case 'Em Andamento':
                statusClass = 'progress';
                break;
            case 'Concluído':
                statusClass = 'active';
                break;
            case 'Cancelado':
                statusClass = 'inactive';
                break;
        }
        
        table.innerHTML += `
            <tr>
                <td>${ordem.ID || ''}</td>
                <td>${clienteNome}</td>
                <td>${servicosTexto}</td>
                <td>${ordem.Data_Abertura || ''}</td>
                <td>R$ ${parseFloat(ordem.Valor_Total || 0).toFixed(2)}</td>
                <td><span class="status ${statusClass}">${ordem.Status || ''}</span></td>
                <td>${ordem.Tecnico || ''}</td>
                <td>
                    <button class="btn-icon info" onclick="verDetalhesOrdem('${ordem.ID}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="editarOrdem('${ordem.ID}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmarExclusaoOrdem('${ordem.ID}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
}

// Configurar paginação
function setupPagination(ordens) {
    const totalPages = Math.ceil(ordens.length / itemsPerPage);
    const pagination = document.getElementById('ordens-pagination');
    
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
            
            document.querySelectorAll('#ordens-pagination .pagination-item').forEach(item => 
                item.classList.remove('active')
            );
            pageButton.classList.add('active');
            
            renderOrdensTable(ordensData, i);
        });
        
        pagination.appendChild(pageButton);
    }
}

// Função de busca
function buscarOrdens() {
    const searchTerm = document.getElementById('search-ordem').value.toLowerCase();
    
    if (!searchTerm) {
        renderOrdensTable(ordensData);
        setupPagination(ordensData);
        return;
    }
    
    // Filtrar ordens
    const filteredOrdens = ordensData.filter(ordem => {
        // Encontrar cliente
        const cliente = clientesData.find(c => c.ID === ordem.ID_Cliente);
        const clienteNome = cliente ? cliente.Nome.toLowerCase() : '';
        
        // Buscar por serviços
        let servicosTexto = '';
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            servicosIds.forEach(id => {
                const servico = servicosData.find(s => s.ID === id);
                if (servico) {
                    servicosTexto += servico.Nome.toLowerCase() + ' ';
                }
            });
        }
        
        return (
            (ordem.ID && ordem.ID.toLowerCase().includes(searchTerm)) ||
            clienteNome.includes(searchTerm) ||
            servicosTexto.includes(searchTerm) ||
            (ordem.Descricao_Problema && ordem.Descricao_Problema.toLowerCase().includes(searchTerm))
        );
    });
    
    // Renderizar resultados
    currentPage = 1;
    renderOrdensTable(filteredOrdens);
    setupPagination(filteredOrdens);
}

// Abrir modal de nova ordem
function openOrdemModal(id = null) {
    console.log(`Abrindo modal de ${id ? 'edição' : 'nova'} ordem`);
    
    // Limpar formulário
    document.getElementById('ordem-form').reset();
    document.getElementById('ordem-id').value = '';
    
    // Configurar data para hoje
    definirDataAtual();
    
    // Desmarcar todos os serviços
    document.querySelectorAll('input[name="servicos"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Mostrar/ocultar campos relevantes
    toggleCamposConclusao();
    
    // Definir título
    document.getElementById('ordem-modal-title').textContent = id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço';
    
    // Carregar dados se for edição
    if (id) {
        carregarDadosOrdem(id);
    }
    
    // Abrir modal
    document.getElementById('ordem-modal').style.display = 'flex';
}

// Carregar dados de uma ordem para edição
async function carregarDadosOrdem(id) {
    showSpinner();
    
    try {
        // Buscar ordem específica
        const response = await fetch(`${SHEET_API}/search?sheet=Ordens_Servico&ID=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar ordem):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordem: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        if (!ordens || ordens.length === 0) {
            showAlert('Ordem não encontrada', 'danger');
            return;
        }
        
        const ordem = ordens[0];
        
        // Preencher formulário
        document.getElementById('ordem-id').value = ordem.ID || '';
        document.getElementById('ordem-cliente').value = ordem.ID_Cliente || '';
        document.getElementById('ordem-descricao-problema').value = ordem.Descricao_Problema || '';
        document.getElementById('ordem-status').value = ordem.Status || 'Aberto';
        document.getElementById('ordem-valor-total').value = ordem.Valor_Total || '';
        document.getElementById('ordem-forma-pagamento').value = ordem.Forma_Pagamento || '';
        document.getElementById('ordem-status-pagamento').value = ordem.Status_Pagamento || 'Pendente';
        document.getElementById('ordem-tecnico').value = ordem.Tecnico || '';
        document.getElementById('ordem-solucao').value = ordem.Solucao || '';
        
        // Converter datas
        if (ordem.Data_Abertura) {
            const parts = ordem.Data_Abertura.split('/');
            document.getElementById('ordem-data-abertura').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        if (ordem.Data_Conclusao) {
            const parts = ordem.Data_Conclusao.split('/');
            document.getElementById('ordem-data-conclusao').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        // Marcar serviços
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            
            document.querySelectorAll('input[name="servicos"]').forEach(checkbox => {
                checkbox.checked = servicosIds.includes(checkbox.value);
            });
        }
        
        // Mostrar/ocultar campos relevantes
        toggleCamposConclusao();
    } catch (error) {
        console.error('Erro ao carregar dados da ordem:', error);
        showAlert('Erro ao carregar dados da ordem', 'danger');
    } finally {
        hideSpinner();
    }
}

// Toggle campos de conclusão com base no status
function toggleCamposConclusao() {
    const status = document.getElementById('ordem-status').value;
    const dataConclusaoContainer = document.querySelector('.data-conclusao-container');
    const solucaoContainer = document.querySelector('.solucao-container');
    
    if (status === 'Concluído') {
        dataConclusaoContainer.style.display = 'block';
        solucaoContainer.style.display = 'block';
        
        // Se não houver data de conclusão preenchida, usar data atual
        if (!document.getElementById('ordem-data-conclusao').value) {
            const hoje = new Date();
            const year = hoje.getFullYear();
            const month = String(hoje.getMonth() + 1).padStart(2, '0');
            const day = String(hoje.getDate()).padStart(2, '0');
            
            document.getElementById('ordem-data-conclusao').value = `${year}-${month}-${day}`;
        }
    } else {
        dataConclusaoContainer.style.display = 'none';
        solucaoContainer.style.display = 'none';
    }
}

// Calcular valor total com base nos serviços selecionados
function calcularValorTotal() {
    let valorTotal = 0;
    
    document.querySelectorAll('input[name="servicos"]:checked').forEach(checkbox => {
        valorTotal += parseFloat(checkbox.dataset.preco || 0);
    });
    
    document.getElementById('ordem-valor-total').value = valorTotal.toFixed(2);
}

// Salvar ordem
async function salvarOrdem() {
    // Validar campos obrigatórios
    const cliente = document.getElementById('ordem-cliente').value;
    const dataAbertura = document.getElementById('ordem-data-abertura').value;
    const status = document.getElementById('ordem-status').value;
    const valorTotal = document.getElementById('ordem-valor-total').value;
    
    if (!cliente || !dataAbertura || !status || !valorTotal) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    // Verificar se pelo menos um serviço foi selecionado
    const servicosSelecionados = document.querySelectorAll('input[name="servicos"]:checked');
    if (servicosSelecionados.length === 0) {
        showAlert('Selecione pelo menos um serviço', 'danger');
        return;
    }
    
    // Verificar campos adicionais para status concluído
    if (status === 'Concluído') {
        const dataConclusao = document.getElementById('ordem-data-conclusao').value;
        
        if (!dataConclusao) {
            showAlert('Informe a data de conclusão', 'danger');
            return;
        }
    }
    
    showSpinner();
    
    try {
        // Preparar dados da ordem
        const ordemId = document.getElementById('ordem-id').value;
        const descricaoProblema = document.getElementById('ordem-descricao-problema').value;
        const formaPagamento = document.getElementById('ordem-forma-pagamento').value;
        const statusPagamento = document.getElementById('ordem-status-pagamento').value;
        const tecnico = document.getElementById('ordem-tecnico').value;
        const solucao = document.getElementById('ordem-solucao').value;
        
        // Converter datas para formato BR
        const dataAberturaFormatted = formatDateToBR(dataAbertura);
        
        let dataConclusaoFormatted = '';
        if (status === 'Concluído') {
            const dataConclusao = document.getElementById('ordem-data-conclusao').value;
            dataConclusaoFormatted = formatDateToBR(dataConclusao);
        }
        
        // Obter IDs dos serviços selecionados
        const servicosIds = Array.from(servicosSelecionados).map(checkbox => checkbox.value);
        
        const ordemData = {
            ID_Cliente: cliente,
            Servicos: servicosIds.join(','),
            Descricao_Problema: descricaoProblema,
            Data_Abertura: dataAberturaFormatted,
            Data_Conclusao: dataConclusaoFormatted,
            Status: status,
            Valor_Total: valorTotal,
            Forma_Pagamento: formaPagamento,
            Status_Pagamento: statusPagamento,
            Tecnico: tecnico,
            Solucao: solucao
        };
        
        if (ordemId) {
            // Atualizar ordem existente
            const response = await fetch(`${SHEET_API}/ID/${ordemId}?sheet=Ordens_Servico`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: ordemData })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Atualizar ordem):", response.status, response.statusText);
                throw new Error(`Erro ao atualizar ordem: ${response.status}`);
            }
            
            showAlert('Ordem de serviço atualizada com sucesso!', 'success');
        } else {
            // Adicionar nova ordem
            // Gerar ID
            const newId = await generateNewOrdemId();
            ordemData.ID = newId;
            
            const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [ordemData] })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Adicionar ordem):", response.status, response.statusText);
                throw new Error(`Erro ao adicionar ordem: ${response.status}`);
            }
            
            showAlert('Ordem de serviço adicionada com sucesso!', 'success');
        }
        
        // Fechar modal e recarregar dados
        document.getElementById('ordem-modal').style.display = 'none';
        loadOrdensData();
    } catch (error) {
        console.error('Erro ao salvar ordem:', error);
        showAlert('Erro ao salvar ordem de serviço. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Gerar novo ID de ordem
async function generateNewOrdemId() {
    try {
        // Buscar todas as ordens para encontrar o último ID
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        const ordens = await response.json();
        
        let maxId = 0;
        ordens.forEach(ordem => {
            if (ordem.ID) {
                const idNumber = parseInt(ordem.ID.replace('OS', ''));
                maxId = Math.max(maxId, idNumber);
            }
        });
        
        return `OS${String(maxId + 1).padStart(4, '0')}`;
    } catch (error) {
        console.error('Erro ao gerar ID:', error);
        // Gerar ID baseado em timestamp como fallback
        const timestamp = Date.now().toString().slice(-6);
        return `OS${timestamp}`;
    }
}

// Ver detalhes da ordem
async function verDetalhesOrdem(id) {
    console.log(`Visualizando detalhes da ordem: ${id}`);
    showSpinner();
    
    try {
        // Buscar ordem específica
        const response = await fetch(`${SHEET_API}/search?sheet=Ordens_Servico&ID=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar ordem):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordem: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        if (!ordens || ordens.length === 0) {
            showAlert('Ordem não encontrada', 'danger');
            return;
        }
        
        const ordem = ordens[0];
        
        // Encontrar cliente
        const cliente = clientesData.find(c => c.ID === ordem.ID_Cliente);
        const clienteNome = cliente ? cliente.Nome : 'Cliente não encontrado';
        const clienteTelefone = cliente ? cliente.Telefone : 'N/A';
        
        // Formatar serviços
        let servicosHTML = '<p class="no-services">Nenhum serviço registrado</p>';
        
        if (ordem.Servicos) {
            const servicosIds = ordem.Servicos.split(',').map(id => id.trim());
            const servicosDetalhes = servicosIds.map(id => {
                const servico = servicosData.find(s => s.ID === id);
                return servico || { Nome: 'Serviço não encontrado', Preco: 0 };
            });
            
            if (servicosDetalhes.length > 0) {
                servicosHTML = '<ul class="services-list">';
                servicosDetalhes.forEach(servico => {
                    servicosHTML += `<li>${servico.Nome} - R$ ${parseFloat(servico.Preco || 0).toFixed(2)}</li>`;
                });
                servicosHTML += '</ul>';
            }
        }
        
        // Determinar status da garantia
        let garantiaStatus = 'N/A';
        let garantiaClass = '';
        
        if (ordem.Status === 'Concluído' && ordem.Data_Conclusao) {
            // Verificar se algum serviço tem garantia
            const servicosIds = ordem.Servicos ? ordem.Servicos.split(',').map(id => id.trim()) : [];
            const servicosComGarantia = servicosIds
                .map(id => servicosData.find(s => s.ID === id))
                .filter(s => s && s.Garantia && parseInt(s.Garantia) > 0);
            
            if (servicosComGarantia.length > 0) {
                // Pegar a maior garantia
                const maiorGarantia = Math.max(...servicosComGarantia.map(s => parseInt(s.Garantia)));
                
                // Calcular data de fim da garantia
                const [dia, mes, ano] = ordem.Data_Conclusao.split('/');
                const dataConclusao = new Date(ano, mes - 1, dia);
                const dataFimGarantia = new Date(dataConclusao);
                dataFimGarantia.setDate(dataFimGarantia.getDate() + maiorGarantia);
                
                // Verificar se ainda está na garantia
                if (dataFimGarantia >= new Date()) {
                    garantiaStatus = `Em garantia até ${dataFimGarantia.toLocaleDateString('pt-BR')}`;
                    garantiaClass = 'em-garantia';
                } else {
                    garantiaStatus = 'Garantia expirada';
                    garantiaClass = 'garantia-expirada';
                }
            } else {
                garantiaStatus = 'Sem garantia';
            }
        }
        
        // Definir título do modal
        document.getElementById('detalhes-modal-title').textContent = `Ordem de Serviço - ${id}`;
        
        // Preencher detalhes
        document.getElementById('detalhes-content').innerHTML = `
            <div class="detalhes-grid">
                <div class="detalhes-section">
                    <h4>Informações Gerais</h4>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="status ${getStatusClass(ordem.Status)}">${ordem.Status || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Data de Abertura:</span>
                        <span>${ordem.Data_Abertura || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Data de Conclusão:</span>
                        <span>${ordem.Data_Conclusao || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Técnico:</span>
                        <span>${ordem.Tecnico || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Garantia:</span>
                        <span class="${garantiaClass}">${garantiaStatus}</span>
                    </div>
                </div>
                
                <div class="detalhes-section">
                    <h4>Cliente</h4>
                    <div class="info-row">
                        <span class="info-label">Nome:</span>
                        <span>${clienteNome}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Telefone:</span>
                        <span>${clienteTelefone}</span>
                    </div>
                </div>
                
                <div class="detalhes-section full-width">
                    <h4>Descrição do Problema</h4>
                    <div class="problema-texto">
                        ${ordem.Descricao_Problema ? `<p>${ordem.Descricao_Problema}</p>` : '<p class="no-data">Sem descrição</p>'}
                    </div>
                </div>
                
                <div class="detalhes-section full-width">
                    <h4>Solução Aplicada</h4>
                    <div class="solucao-texto">
                        ${ordem.Solucao ? `<p>${ordem.Solucao}</p>` : '<p class="no-data">Sem solução registrada</p>'}
                    </div>
                </div>
                
                <div class="detalhes-section">
                    <h4>Serviços Realizados</h4>
                    <div class="servicos-lista">
                        ${servicosHTML}
                    </div>
                </div>
                
                <div class="detalhes-section">
                    <h4>Pagamento</h4>
                    <div class="info-row">
                        <span class="info-label">Valor Total:</span>
                        <span>R$ ${parseFloat(ordem.Valor_Total || 0).toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Forma de Pagamento:</span>
                        <span>${ordem.Forma_Pagamento || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status do Pagamento:</span>
                        <span class="status-pagamento ${ordem.Status_Pagamento === 'Pago' ? 'pago' : 'pendente'}">
                            ${ordem.Status_Pagamento || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // Abrir modal
        document.getElementById('detalhes-modal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao carregar detalhes da ordem:', error);
        showAlert('Erro ao carregar detalhes da ordem', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para obter classe CSS para status
function getStatusClass(status) {
    switch (status) {
        case 'Aberto':
            return 'pending';
        case 'Em Andamento':
            return 'progress';
        case 'Concluído':
            return 'active';
        case 'Cancelado':
            return 'inactive';
        default:
            return 'pending';
    }
}

// Editar ordem
function editarOrdem(id) {
    openOrdemModal(id);
}

// Confirmar exclusão de ordem
function confirmarExclusaoOrdem(id) {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) {
        excluirOrdem(id);
    }
}

// Excluir ordem
async function excluirOrdem(id) {
    console.log(`Excluindo ordem: ${id}`);
    showSpinner();
    
    try {
        const response = await fetch(`${SHEET_API}/ID/${id}?sheet=Ordens_Servico`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Excluir ordem):", response.status, response.statusText);
            throw new Error(`Erro ao excluir ordem: ${response.status}`);
        }
        
        showAlert('Ordem de serviço excluída com sucesso!', 'success');
        loadOrdensData();
    } catch (error) {
        console.error('Erro ao excluir ordem:', error);
        showAlert('Erro ao excluir ordem', 'danger');
    } finally {
        hideSpinner();
    }
}

// Imprimir ordem
function imprimirOrdem() {
    window.print();
}

// Função para formatar data para o formato BR (DD/MM/YYYY)
function formatDateToBR(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}