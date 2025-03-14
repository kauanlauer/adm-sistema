// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentTab = 'transacoes';
let transacoesData = {
    todas: [],
    receitas: [],
    despesas: []
};
let currentPage = {
    transacoes: 1,
    receitas: 1,
    despesas: 1
};
const itemsPerPage = 10;
let filtroAtual = {
    periodo: 'mes',
    dataInicio: null,
    dataFim: null
};

// Categorias
const categorias = {
    Receita: [
        'Serviço',
        'Venda de Produto',
        'Consultoria',
        'Manutenção',
        'Suporte',
        'Desenvolvimento',
        'Outros'
    ],
    Despesa: [
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
    console.log("Iniciando módulo financeiro...");
    
    // Configurar períodos de data
    configurarPeriodos();
    
    // Carregar dados financeiros
    loadFinanceiroData();
    
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
    
    // Configurar botão de filtro
    document.getElementById('btn-filtrar').addEventListener('click', aplicarFiltros);
    
    // Configurar combobox de período
    document.getElementById('periodo').addEventListener('change', function() {
        const dataPersonalizada = document.querySelectorAll('.data-personalizada');
        
        if (this.value === 'personalizado') {
            dataPersonalizada.forEach(elem => elem.style.display = 'block');
        } else {
            dataPersonalizada.forEach(elem => elem.style.display = 'none');
        }
    });
    
    // Configurar botões de nova transação
    document.getElementById('btn-new-transacao').addEventListener('click', () => openTransacaoModal());
    document.getElementById('btn-new-receita').addEventListener('click', () => openTransacaoModal('Receita'));
    document.getElementById('btn-new-despesa').addEventListener('click', () => openTransacaoModal('Despesa'));
    
    // Configurar tipos de transação
    document.getElementById('transacao-tipo').addEventListener('change', atualizarCategorias);
    
    // Configurar busca
    document.getElementById('btn-search-transacao').addEventListener('click', () => buscarTransacoes('transacoes'));
    document.getElementById('btn-search-receita').addEventListener('click', () => buscarTransacoes('receitas'));
    document.getElementById('btn-search-despesa').addEventListener('click', () => buscarTransacoes('despesas'));
    
    document.getElementById('search-transacao').addEventListener('keyup', e => {
        if (e.key === 'Enter') buscarTransacoes('transacoes');
    });
    
    document.getElementById('search-receita').addEventListener('keyup', e => {
        if (e.key === 'Enter') buscarTransacoes('receitas');
    });
    
    document.getElementById('search-despesa').addEventListener('keyup', e => {
        if (e.key === 'Enter') buscarTransacoes('despesas');
    });
    
    // Configurar salvar transação
    document.getElementById('btn-save-transacao').addEventListener('click', salvarTransacao);
    
    // Configurar modal
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Fechar modal ao clicar fora
    document.getElementById('transacao-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('transacao-modal')) {
            document.getElementById('transacao-modal').style.display = 'none';
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

// Configurar períodos de data
function configurarPeriodos() {
    const hoje = new Date();
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    
    // Definir data fim como hoje
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    
    dataFim.value = `${year}-${month}-${day}`;
    
    // Definir data inicio como primeiro dia do mês
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const primeiroMes = String(primeiroDiaMes.getMonth() + 1).padStart(2, '0');
    const primeiroDia = String(primeiroDiaMes.getDate()).padStart(2, '0');
    
    dataInicio.value = `${year}-${primeiroMes}-${primeiroDia}`;
    
    // Configurar filtro atual
    filtroAtual.dataInicio = primeiroDiaMes;
    filtroAtual.dataFim = hoje;
}

// Aplicar filtros de data
function aplicarFiltros() {
    console.log("Aplicando filtros...");
    
    const periodo = document.getElementById('periodo').value;
    filtroAtual.periodo = periodo;
    
    const hoje = new Date();
    let dataInicio, dataFim;
    
    switch (periodo) {
        case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = hoje;
            break;
        case 'trimestre':
            const mesTrimestre = Math.floor(hoje.getMonth() / 3) * 3;
            dataInicio = new Date(hoje.getFullYear(), mesTrimestre, 1);
            dataFim = hoje;
            break;
        case 'ano':
            dataInicio = new Date(hoje.getFullYear(), 0, 1);
            dataFim = hoje;
            break;
        case 'personalizado':
            const dataInicioInput = document.getElementById('data-inicio').value;
            const dataFimInput = document.getElementById('data-fim').value;
            
            if (!dataInicioInput || !dataFimInput) {
                showAlert('Por favor, defina as datas de início e fim para o período personalizado.', 'danger');
                return;
            }
            
            dataInicio = new Date(dataInicioInput);
            dataFim = new Date(dataFimInput);
            break;
    }
    
    filtroAtual.dataInicio = dataInicio;
    filtroAtual.dataFim = dataFim;
    
    // Recarregar dados com filtros
    loadFinanceiroData();
}

// Carregar dados financeiros
async function loadFinanceiroData() {
    console.log("Carregando dados financeiros...");
    showSpinner();
    
    try {
        // Buscar dados das transações
        const response = await fetch(`${SHEET_API}?sheet=Financeiro`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Financeiro):", response.status, response.statusText);
            throw new Error(`Erro ao buscar dados financeiros: ${response.status}`);
        }
        
        const transacoes = await response.json();
        console.log(`${transacoes.length} transações carregadas`);
        
        // Filtrar transações por data
        const transacoesFiltradas = transacoes.filter(transacao => {
            if (!transacao.Data) return false;
            
            const parts = transacao.Data.split('/');
            const dataTransacao = new Date(parts[2], parts[1] - 1, parts[0]);
            
            return dataTransacao >= filtroAtual.dataInicio && dataTransacao <= filtroAtual.dataFim;
        });
        
        // Separar receitas e despesas
        transacoesData.todas = transacoesFiltradas;
        transacoesData.receitas = transacoesFiltradas.filter(t => t.Tipo === 'Receita');
        transacoesData.despesas = transacoesFiltradas.filter(t => t.Tipo === 'Despesa');
        
        // Calcular totais
        calcularTotais();
        
        // Renderizar tabelas
        renderTransacoesTable('transacoes', transacoesData.todas);
        renderTransacoesTable('receitas', transacoesData.receitas);
        renderTransacoesTable('despesas', transacoesData.despesas);
        
        // Configurar paginação
        setupPagination('transacoes', transacoesData.todas);
        setupPagination('receitas', transacoesData.receitas);
        setupPagination('despesas', transacoesData.despesas);
    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        showAlert('Erro ao carregar dados financeiros. Por favor, tente novamente.', 'danger');
        
        // Limpar tabelas com mensagem de erro
        document.querySelectorAll('[id$=-table]').forEach(table => {
            if (table.id.includes('transacoes') || table.id.includes('receitas') || table.id.includes('despesas')) {
                table.innerHTML = '<tr><td colspan="8" class="text-center">Erro ao carregar dados</td></tr>';
            }
        });
    } finally {
        hideSpinner();
    }
}

// Calcular totais
function calcularTotais() {
    // Calcular total de receitas
    const totalReceitas = transacoesData.receitas
        .filter(t => t.Status === 'Pago')
        .reduce((total, t) => total + (parseFloat(t.Valor) || 0), 0);
    
    // Calcular total de despesas
    const totalDespesas = transacoesData.despesas
        .filter(t => t.Status === 'Pago')
        .reduce((total, t) => total + (parseFloat(t.Valor) || 0), 0);
    
    // Calcular saldo
    const saldo = totalReceitas - totalDespesas;
    
    // Calcular pendentes
    const totalPendentes = transacoesData.todas
        .filter(t => t.Status === 'Pendente')
        .reduce((total, t) => {
            const valor = parseFloat(t.Valor) || 0;
            return t.Tipo === 'Receita' ? total + valor : total - valor;
        }, 0);
    
    // Atualizar elementos na interface
    document.getElementById('total-receitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
    document.getElementById('total-despesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
    document.getElementById('saldo-total').textContent = `R$ ${saldo.toFixed(2)}`;
    document.getElementById('total-pendentes').textContent = `R$ ${Math.abs(totalPendentes).toFixed(2)}`;
    
    // Ajustar cor do saldo
    const saldoElement = document.getElementById('saldo-total');
    if (saldo >= 0) {
        saldoElement.style.color = '#27ae60';
    } else {
        saldoElement.style.color = '#e74c3c';
    }
}

// Renderizar tabela de transações
function renderTransacoesTable(tipo, transacoes, page = 1) {
    console.log(`Renderizando tabela de ${tipo}...`);
    
    const tableId = `${tipo}-table`;
    const table = document.getElementById(tableId);
    
    if (!table) {
        console.warn(`Tabela ${tableId} não encontrada`);
        return;
    }
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransacoes = transacoes.slice(startIndex, endIndex);
    
    table.innerHTML = '';
    
    if (paginatedTransacoes.length === 0) {
        const colspan = tipo === 'despesas' ? 7 : 8;
        table.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Nenhuma transação encontrada</td></tr>`;
        return;
    }
    
    for (const transacao of paginatedTransacoes) {
        let statusClass = '';
        
        switch (transacao.Status) {
            case 'Pago':
                statusClass = 'active';
                break;
            case 'Pendente':
                statusClass = 'pending';
                break;
            case 'Cancelado':
                statusClass = 'inactive';
                break;
            default:
                statusClass = 'pending';
        }
        
        const tipoClass = transacao.Tipo === 'Receita' ? 'income' : 'expense';
        
        // Construir linha específica para cada tipo
        let row = `
            <tr>
                <td>${transacao.ID_Transacao || ''}</td>
                <td>${transacao.Data || ''}</td>
                <td>${transacao.Descricao || ''}</td>
                <td>${transacao.Categoria || ''}</td>
        `;
        
        // Adicionar coluna específica dependendo do tipo
        if (tipo === 'transacoes') {
            row += `<td class="transaction-type ${tipoClass}">${transacao.Tipo || ''}</td>`;
        } else if (tipo === 'receitas') {
            row += `<td>${transacao.ID_OS || ''}</td>`;
        }
        
        // Continuar com colunas comuns
        row += `
                <td>${formatarValor(transacao.Valor, transacao.Tipo)}</td>
                <td><span class="status ${statusClass}">${transacao.Status || ''}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editarTransacao('${transacao.ID_Transacao}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmarExclusaoTransacao('${transacao.ID_Transacao}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        
        table.innerHTML += row;
    }
}

// Formatar valor
function formatarValor(valor, tipo) {
    const valorNum = parseFloat(valor) || 0;
    return `${tipo === 'Despesa' ? '-' : ''}R$ ${valorNum.toFixed(2)}`;
}

// Configurar paginação
function setupPagination(tipo, transacoes) {
    const paginationId = `${tipo}-pagination`;
    const paginationElement = document.getElementById(paginationId);
    
    if (!paginationElement) {
        console.warn(`Paginação ${paginationId} não encontrada`);
        return;
    }
    
    const totalPages = Math.ceil(transacoes.length / itemsPerPage);
    
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
            
            renderTransacoesTable(tipo, transacoes, i);
        });
        
        paginationElement.appendChild(pageButton);
    }
}

// Função para buscar transações
function buscarTransacoes(tipo) {
    const searchId = `search-${tipo === 'transacoes' ? 'transacao' : tipo === 'receitas' ? 'receita' : 'despesa'}`;
    const searchInput = document.getElementById(searchId);
    
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        // Se não houver termo de busca, recarregar dados originais
        renderTransacoesTable(tipo, tipo === 'transacoes' ? transacoesData.todas : 
                                     tipo === 'receitas' ? transacoesData.receitas : transacoesData.despesas);
        setupPagination(tipo, tipo === 'transacoes' ? transacoesData.todas : 
                              tipo === 'receitas' ? transacoesData.receitas : transacoesData.despesas);
        return;
    }
    
    console.log(`Buscando ${tipo}: "${searchTerm}"`);
    
    // Dados a serem filtrados
    const dadosOriginal = tipo === 'transacoes' ? transacoesData.todas : 
                          tipo === 'receitas' ? transacoesData.receitas : transacoesData.despesas;
    
    // Filtrar transações
    const filteredTransacoes = dadosOriginal.filter(transacao => 
        (transacao.Descricao && transacao.Descricao.toLowerCase().includes(searchTerm)) ||
        (transacao.Categoria && transacao.Categoria.toLowerCase().includes(searchTerm)) ||
        (transacao.Valor && transacao.Valor.toString().includes(searchTerm))
    );
    
    // Renderizar resultados
    renderTransacoesTable(tipo, filteredTransacoes);
    setupPagination(tipo, filteredTransacoes);
}

// Atualizar categorias de acordo com o tipo
function atualizarCategorias() {
    const tipo = document.getElementById('transacao-tipo').value;
    const categoriaSelect = document.getElementById('transacao-categoria');
    
    // Limpar opções
    categoriaSelect.innerHTML = '<option value="">Selecione</option>';
    
    // Adicionar categorias de acordo com o tipo
    categorias[tipo].forEach(categoria => {
        categoriaSelect.innerHTML += `<option value="${categoria}">${categoria}</option>`;
    });
    
    // Mostrar ou ocultar campo de OS
    const osContainer = document.getElementById('ordem-servico-container');
    if (tipo === 'Receita') {
        osContainer.style.display = 'block';
    } else {
        osContainer.style.display = 'none';
    }
}

// Abrir modal de nova transação
async function openTransacaoModal(tipo = null) {
    console.log(`Abrindo modal de ${tipo || 'nova transação'}...`);
    
    // Limpar formulário
    document.getElementById('transacao-form').reset();
    document.getElementById('transacao-id').value = '';
    
    // Definir tipo se for especificado
    if (tipo) {
        document.getElementById('transacao-tipo').value = tipo;
    }
    
    // Configurar data para hoje
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    
    document.getElementById('transacao-data').value = `${year}-${month}-${day}`;
    
    // Atualizar categorias
    atualizarCategorias();
    
    // Carregar ordens de serviço se for receita
    if (tipo === 'Receita' || document.getElementById('transacao-tipo').value === 'Receita') {
        await carregarOrdens();
    }
    
    // Definir título
    document.getElementById('transacao-modal-title').textContent = tipo ? 
        `Nova ${tipo}` : 'Nova Transação';
    
    // Abrir modal
    document.getElementById('transacao-modal').style.display = 'flex';
}

// Carregar ordens de serviço
async function carregarOrdens() {
    console.log("Carregando ordens de serviço...");
    
    try {
        // Buscar ordens concluídas
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Ordens):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordens: ${response.status}`);
        }
        
        const ordens = await response.json();
        
        // Preencher dropdown
        const selectOs = document.getElementById('transacao-os');
        if (!selectOs) return;
        
        selectOs.innerHTML = '<option value="">Selecione (opcional)</option>';
        
        ordens.forEach(ordem => {
            selectOs.innerHTML += `<option value="${ordem.ID}">${ordem.ID} - ${ordem.Cliente} (R$ ${parseFloat(ordem.Valor_Total || 0).toFixed(2)})</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        showAlert('Erro ao carregar ordens de serviço', 'danger');
    }
}

// Função para editar transação
async function editarTransacao(id) {
    console.log(`Editando transação: ${id}`);
    showSpinner();
    
    try {
        // Buscar transação
        const response = await fetch(`${SHEET_API}/search?sheet=Financeiro&ID_Transacao=${id}`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Buscar transação):", response.status, response.statusText);
            throw new Error(`Erro ao buscar transação: ${response.status}`);
        }
        
        const transacoes = await response.json();
        
        if (!transacoes || transacoes.length === 0) {
            showAlert('Transação não encontrada', 'danger');
            return;
        }
        
        const transacao = transacoes[0];
        
        // Definir tipo
        document.getElementById('transacao-tipo').value = transacao.Tipo || 'Receita';
        
        // Atualizar categorias
        atualizarCategorias();
        
        // Carregar ordens de serviço se for receita
        if (transacao.Tipo === 'Receita') {
            await carregarOrdens();
        }
        
        // Preencher formulário
        document.getElementById('transacao-id').value = transacao.ID_Transacao || '';
        document.getElementById('transacao-descricao').value = transacao.Descricao || '';
        document.getElementById('transacao-categoria').value = transacao.Categoria || '';
        
        // Converter data
        if (transacao.Data) {
            const parts = transacao.Data.split('/');
            document.getElementById('transacao-data').value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        
        document.getElementById('transacao-os').value = transacao.ID_OS || '';
        document.getElementById('transacao-valor').value = transacao.Valor || '';
        document.getElementById('transacao-forma-pagamento').value = transacao.Forma_Pagamento || '';
        document.getElementById('transacao-status').value = transacao.Status || 'Pendente';
        document.getElementById('transacao-observacoes').value = transacao.Observacoes || '';
        
        // Definir título
        document.getElementById('transacao-modal-title').textContent = `Editar ${transacao.Tipo}`;
        
        // Abrir modal
        document.getElementById('transacao-modal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao editar transação:', error);
        showAlert('Erro ao carregar dados da transação', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para salvar transação
async function salvarTransacao() {
    console.log("Salvando transação...");
    
    // Capturar dados do formulário
    const transacaoId = document.getElementById('transacao-id').value;
    const tipo = document.getElementById('transacao-tipo').value;
    const descricao = document.getElementById('transacao-descricao').value;
    const categoria = document.getElementById('transacao-categoria').value;
    const data = document.getElementById('transacao-data').value;
    const osId = document.getElementById('transacao-os').value;
    const valor = document.getElementById('transacao-valor').value;
    const formaPagamento = document.getElementById('transacao-forma-pagamento').value;
    const status = document.getElementById('transacao-status').value;
    const observacoes = document.getElementById('transacao-observacoes').value;
    
    // Validar campos obrigatórios
    if (!tipo || !descricao || !categoria || !data || !valor) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    // Converter data para formato BR
    const dataFormatted = data ? formatDateToBR(data) : '';
    
    showSpinner();
    
    // Preparar dados
    const transacaoData = {
        Tipo: tipo,
        Descricao: descricao,
        Categoria: categoria,
        Data: dataFormatted,
        ID_OS: osId,
        Valor: valor,
        Forma_Pagamento: formaPagamento,
        Status: status,
        Observacoes: observacoes
    };
    
    try {
        if (transacaoId) {
            // Atualizar transação existente
            console.log(`Atualizando transação: ${transacaoId}`);
            
            const response = await fetch(`${SHEET_API}/ID_Transacao/${transacaoId}?sheet=Financeiro`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: transacaoData })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Atualizar transação):", response.status, response.statusText);
                throw new Error(`Erro ao atualizar transação: ${response.status}`);
            }
            
            showAlert('Transação atualizada com sucesso!', 'success');
        } else {
            // Adicionar nova transação
            console.log("Adicionando nova transação");
            
            // Gerar ID
            const transacoes = await fetch(`${SHEET_API}?sheet=Financeiro`).then(res => res.json());
            
            const lastId = transacoes.length > 0 
                ? Math.max(...transacoes.map(t => parseInt(t.ID_Transacao?.replace('TR', '') || '0')))
                : 0;
            
            transacaoData.ID_Transacao = `TR${String(lastId + 1).padStart(4, '0')}`;
            
            const response = await fetch(`${SHEET_API}?sheet=Financeiro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [transacaoData] })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Adicionar transação):", response.status, response.statusText);
                throw new Error(`Erro ao adicionar transação: ${response.status}`);
            }
            
            showAlert('Transação adicionada com sucesso!', 'success');
        }
        
        // Fechar modal e recarregar dados
        document.getElementById('transacao-modal').style.display = 'none';
        loadFinanceiroData();
    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        showAlert('Erro ao salvar transação. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para confirmar exclusão de transação
function confirmarExclusaoTransacao(id) {
    if (confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) {
        excluirTransacao(id);
    }
}

// Função para excluir transação
async function excluirTransacao(id) {
    console.log(`Excluindo transação: ${id}`);
    showSpinner();
    
    try {
        const response = await fetch(`${SHEET_API}/ID_Transacao/${id}?sheet=Financeiro`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Excluir transação):", response.status, response.statusText);
            throw new Error(`Erro ao excluir transação: ${response.status}`);
        }
        
        showAlert('Transação excluída com sucesso!', 'success');
        loadFinanceiroData();
    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        showAlert('Erro ao excluir transação', 'danger');
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
// Funções para geração de relatórios
// ===============================

// Gerar relatório em CSV
async function exportarCSV(tipo) {
    console.log(`Exportando ${tipo} para CSV...`);
    
    // Determinar quais dados exportar
    const dados = tipo === 'transacoes' ? transacoesData.todas :
                 tipo === 'receitas' ? transacoesData.receitas :
                 transacoesData.despesas;
    
    if (!dados || dados.length === 0) {
        showAlert('Não há dados para exportar', 'warning');
        return;
    }
    
    // Criar cabeçalho
    let headers = ['ID', 'Data', 'Descrição', 'Categoria'];
    
    if (tipo === 'transacoes') {
        headers.push('Tipo');
    } else if (tipo === 'receitas') {
        headers.push('Ordem de Serviço');
    }
    
    headers = headers.concat(['Valor', 'Status', 'Forma de Pagamento', 'Observações']);
    
    // Criar linhas
    const rows = dados.map(item => {
        let row = [
            item.ID_Transacao || '',
            item.Data || '',
            item.Descricao || '',
            item.Categoria || ''
        ];
        
        if (tipo === 'transacoes') {
            row.push(item.Tipo || '');
        } else if (tipo === 'receitas') {
            row.push(item.ID_OS || '');
        }
        
        row = row.concat([
            item.Valor || '',
            item.Status || '',
            item.Forma_Pagamento || '',
            item.Observacoes || ''
        ]);
        
        return row;
    });
    
    // Converter para formato CSV
    let csvContent = headers.join(',') + '\n';
    
    rows.forEach(row => {
        // Escapar campos com vírgulas ou aspas
        const processedRow = row.map(field => {
            // Se o campo contém vírgula, aspas ou quebra de linha, envolve em aspas
            if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                // Substituir aspas por aspas duplas
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        });
        
        csvContent += processedRow.join(',') + '\n';
    });
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Criar link para download
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${tipo}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`Relatório de ${tipo} exportado com sucesso!`, 'success');
}

// Adicionar botões de exportação após carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar botões de exportação a cada aba
    const abas = ['transacoes', 'receitas', 'despesas'];
    
    abas.forEach(aba => {
        const pageHeader = document.querySelector(`#${aba}-content .page-header`);
        
        if (pageHeader) {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-secondary';
            exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Exportar CSV';
            exportBtn.addEventListener('click', () => exportarCSV(aba));
            
            // Inserir botão antes do botão de nova transação
            const addBtn = pageHeader.querySelector('button');
            pageHeader.insertBefore(exportBtn, addBtn);
        }
    });
});

// Funções de análise financeira
// =============================

// Calcular métricas financeiras
function calcularMetricasFinanceiras() {
    console.log("Calculando métricas financeiras...");
    
    // Verificar se existem dados
    if (!transacoesData.receitas.length && !transacoesData.despesas.length) {
        return null;
    }
    
    // Calcular receitas e despesas
    const totalReceitas = transacoesData.receitas
        .filter(t => t.Status === 'Pago')
        .reduce((total, t) => total + (parseFloat(t.Valor) || 0), 0);
    
    const totalDespesas = transacoesData.despesas
        .filter(t => t.Status === 'Pago')
        .reduce((total, t) => total + (parseFloat(t.Valor) || 0), 0);
    
    // Calcular métricas
    const saldo = totalReceitas - totalDespesas;
    const margemLucro = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;
    
    // Calcular receitas e despesas por categoria
    const receitasPorCategoria = {};
    const despesasPorCategoria = {};
    
    // Agrupar receitas por categoria
    transacoesData.receitas.forEach(receita => {
        if (receita.Status === 'Pago' && receita.Categoria) {
            const valor = parseFloat(receita.Valor) || 0;
            receitasPorCategoria[receita.Categoria] = (receitasPorCategoria[receita.Categoria] || 0) + valor;
        }
    });
    
    // Agrupar despesas por categoria
    transacoesData.despesas.forEach(despesa => {
        if (despesa.Status === 'Pago' && despesa.Categoria) {
            const valor = parseFloat(despesa.Valor) || 0;
            despesasPorCategoria[despesa.Categoria] = (despesasPorCategoria[despesa.Categoria] || 0) + valor;
        }
    });
    
    // Ordenar categorias por valor
    const receitasCategoriasOrdenadas = Object.entries(receitasPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, valor]) => ({ categoria, valor }));
    
    const despesasCategoriasOrdenadas = Object.entries(despesasPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, valor]) => ({ categoria, valor }));
    
    return {
        totalReceitas,
        totalDespesas,
        saldo,
        margemLucro,
        receitasPorCategoria: receitasCategoriasOrdenadas,
        despesasPorCategoria: despesasCategoriasOrdenadas
    };
}

// Atualizar gráficos e indicadores
function atualizarDashboardFinanceiro() {
    console.log("Atualizando dashboard financeiro...");
    
    // Calcular métricas
    const metricas = calcularMetricasFinanceiras();
    
    if (!metricas) return;
    
    // Verificar se existe o container para gráficos
    const chartContainer = document.getElementById('financeiro-charts');
    
    if (!chartContainer) {
        console.log("Container de gráficos não encontrado. Criando...");
        
        // Criar container de gráficos após o resumo financeiro
        const summaryContainer = document.querySelector('.financial-summary');
        
        if (summaryContainer) {
            const container = document.createElement('div');
            container.id = 'financeiro-charts';
            container.className = 'charts-container';
            
            // Estrutura para gráficos
            container.innerHTML = `
                <div class="chart-grid">
                    <div class="chart-card">
                        <h4>Receitas por Categoria</h4>
                        <div id="receitas-chart" class="chart-area"></div>
                    </div>
                    <div class="chart-card">
                        <h4>Despesas por Categoria</h4>
                        <div id="despesas-chart" class="chart-area"></div>
                    </div>
                </div>
            `;
            
            // Inserir após o resumo financeiro
            summaryContainer.parentNode.insertBefore(container, summaryContainer.nextSibling);
            
            // Adicionar estilos se necessário
            const style = document.createElement('style');
            style.textContent = `
                .charts-container {
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }
                .chart-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1rem;
                }
                .chart-card {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    padding: 1rem;
                }
                .chart-area {
                    height: 300px;
                    margin-top: 1rem;
                }
                @media (max-width: 768px) {
                    .chart-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(style);
        } else {
            console.warn("Container de resumo financeiro não encontrado");
            return;
        }
    }
    
    // Gerar visualização de dados
    // Aqui você pode implementar gráficos com bibliotecas como Chart.js
    // Exemplo com texto simples para demonstração
    
    const receitasChartEl = document.getElementById('receitas-chart');
    const despesasChartEl = document.getElementById('despesas-chart');
    
    if (receitasChartEl && despesasChartEl) {
        // Renderizar lista de receitas por categoria
        receitasChartEl.innerHTML = '<div class="chart-placeholder">';
        
        if (metricas.receitasPorCategoria.length > 0) {
            receitasChartEl.innerHTML += `
                <ul class="chart-list">
                    ${metricas.receitasPorCategoria.map(item => `
                        <li>
                            <span class="chart-label">${item.categoria}</span>
                            <div class="chart-bar-container">
                                <div class="chart-bar" style="width: ${(item.valor / metricas.totalReceitas) * 100}%; background-color: #27ae60;"></div>
                                <span class="chart-value">R$ ${item.valor.toFixed(2)}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            receitasChartEl.innerHTML += '<p class="text-center">Sem dados de receitas no período</p>';
        }
        
        receitasChartEl.innerHTML += '</div>';
        
        // Renderizar lista de despesas por categoria
        despesasChartEl.innerHTML = '<div class="chart-placeholder">';
        
        if (metricas.despesasPorCategoria.length > 0) {
            despesasChartEl.innerHTML += `
                <ul class="chart-list">
                    ${metricas.despesasPorCategoria.map(item => `
                        <li>
                            <span class="chart-label">${item.categoria}</span>
                            <div class="chart-bar-container">
                                <div class="chart-bar" style="width: ${(item.valor / metricas.totalDespesas) * 100}%; background-color: #e74c3c;"></div>
                                <span class="chart-value">R$ ${item.valor.toFixed(2)}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            despesasChartEl.innerHTML += '<p class="text-center">Sem dados de despesas no período</p>';
        }
        
        despesasChartEl.innerHTML += '</div>';
        
        // Adicionar estilos se necessário
        const chartStyles = document.createElement('style');
        chartStyles.textContent = `
            .chart-placeholder {
                width: 100%;
                height: 100%;
                overflow-y: auto;
            }
            .chart-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .chart-list li {
                margin-bottom: 0.5rem;
            }
            .chart-label {
                display: block;
                margin-bottom: 0.25rem;
                font-weight: 500;
            }
            .chart-bar-container {
                display: flex;
                align-items: center;
                height: 24px;
                background-color: #f1f1f1;
                border-radius: 4px;
                overflow: hidden;
            }
            .chart-bar {
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            .chart-value {
                margin-left: 0.5rem;
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(chartStyles);
    }
}

// Adicionar a função de atualização do dashboard após carregar os dados
document.addEventListener('DOMContentLoaded', () => {
    // Observar quando os dados financeiros são carregados
    const originalLoadFinanceiroData = loadFinanceiroData;
    
    // Sobrescrever a função original para adicionar a atualização do dashboard
    window.loadFinanceiroData = async function() {
        await originalLoadFinanceiroData.call(this);
        
        // Atualizar dashboard com gráficos
        atualizarDashboardFinanceiro();
    };
});

// Fluxo de caixa projetado
// ========================

// Função para projetar fluxo de caixa
function projetarFluxoCaixa(meses = 3) {
    console.log(`Projetando fluxo de caixa para ${meses} meses...`);
    
    // Obter data atual
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    
    // Array para armazenar projeção
    const projecao = [];
    
    // Para cada mês da projeção
    for (let i = 0; i < meses; i++) {
        const mes = (mesAtual + i) % 12;
        const ano = anoAtual + Math.floor((mesAtual + i) / 12);
        
        // Filtrar transações pendentes para este mês
        const transacoesPendentes = transacoesData.todas.filter(t => {
            if (t.Status !== 'Pendente' || !t.Data) return false;
            
            const [dia, mesStr, anoStr] = t.Data.split('/');
            const dataPrevista = new Date(parseInt(anoStr), parseInt(mesStr) - 1, parseInt(dia));
            
            return dataPrevista.getMonth() === mes && dataPrevista.getFullYear() === ano;
        });
        
        // Calcular valores previstos
        const receitasPrevistas = transacoesPendentes
            .filter(t => t.Tipo === 'Receita')
            .reduce((total, t) => total + (parseFloat(t.Valor) || 0), 0);
        
        const despesasPrevistas = transacoesPendentes
            .filter(t => t.Tipo === 'Despesa')
            .reduce((total, t) => total + (parseFloat(t.Valor) || 0), 0);
        
        // Adicionar ao array de projeção
        projecao.push({
            mes: `${String(mes + 1).padStart(2, '0')}/${ano}`,
            receitasPrevistas,
            despesasPrevistas,
            saldoPrevisto: receitasPrevistas - despesasPrevistas
        });
    }
    
    return projecao;
}

// Função para exibir projeção de fluxo de caixa
function exibirProjecaoFluxoCaixa() {
    console.log("Exibindo projeção de fluxo de caixa...");
    
    // Obter projeção para 3 meses
    const projecao = projetarFluxoCaixa(3);
    
    // Criar modal para exibir projeção
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'projecao-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>Projeção de Fluxo de Caixa</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="projecao-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mês</th>
                                <th>Receitas Previstas</th>
                                <th>Despesas Previstas</th>
                                <th>Saldo Previsto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projecao.map(p => `
                                <tr>
                                    <td>${p.mes}</td>
                                    <td class="text-right">R$ ${p.receitasPrevistas.toFixed(2)}</td>
                                    <td class="text-right">R$ ${p.despesasPrevistas.toFixed(2)}</td>
                                    <td class="text-right" style="color: ${p.saldoPrevisto >= 0 ? '#27ae60' : '#e74c3c'};">
                                        R$ ${p.saldoPrevisto.toFixed(2)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="projecao-disclaimer">
                        <p><strong>Nota:</strong> Esta projeção considera apenas as transações pendentes 
                        registradas no sistema. Resultados reais podem variar.</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary modal-close">Fechar</button>
            </div>
        </div>
    `;
    
    // Adicionar modal ao corpo do documento
    document.body.appendChild(modal);
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Configurar fechamento do modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    });
}

// Adicionar botão de projeção de fluxo de caixa
document.addEventListener('DOMContentLoaded', () => {
    // Criar botão
    const btnProjecao = document.createElement('button');
    btnProjecao.className = 'btn btn-info';
    btnProjecao.innerHTML = '<i class="fas fa-chart-line"></i> Projeção de Fluxo de Caixa';
    btnProjecao.addEventListener('click', exibirProjecaoFluxoCaixa);
    
    // Adicionar após o resumo financeiro
    const summaryContainer = document.querySelector('.financial-summary');
    
    if (summaryContainer) {
        const container = document.createElement('div');
        container.className = 'projecao-button-container';
        container.style.textAlign = 'right';
        container.style.padding = '0.5rem 1rem';
        
        container.appendChild(btnProjecao);
        summaryContainer.parentNode.insertBefore(container, summaryContainer.nextSibling);
    }
});

// Função para importar dados financeiros em massa (CSV)
function importarDadosFinanceiros() {
    console.log("Abrindo importação de dados financeiros...");
    
    // Criar modal de importação
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'importacao-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Importar Dados Financeiros</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="import-container">
                    <p>Selecione um arquivo CSV com os dados financeiros para importar.</p>
                    <p>O arquivo deve conter as seguintes colunas: Tipo, Descrição, Categoria, Data, Valor, Status</p>
                    
                    <div class="form-group">
                        <label for="import-file">Arquivo CSV</label>
                        <input type="file" id="import-file" accept=".csv" class="form-control">
                    </div>
                    
                    <div class="import-preview" style="display: none;">
                        <h4>Pré-visualização</h4>
                        <p>Registros encontrados: <span id="import-count">0</span></p>
                        <table class="data-table" id="import-preview-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="6" class="text-center">Selecione um arquivo CSV</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancelar</button>
                <button class="btn btn-primary" id="btn-import-data" disabled>Importar Dados</button>
            </div>
        </div>
    `;
    
    // Adicionar modal ao corpo do documento
    document.body.appendChild(modal);
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Configurar fechamento do modal
    const closeModal = () => {
        modal.style.display = 'none';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Configurar upload de arquivo
    const fileInput = document.getElementById('import-file');
    let parsedData = null;
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const content = event.target.result;
            
            // Parsear CSV
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Verificar colunas necessárias
            const requiredColumns = ['Tipo', 'Descrição', 'Categoria', 'Data', 'Valor', 'Status'];
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            
            if (missingColumns.length > 0) {
                showAlert(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`, 'danger');
                return;
            }
            
            // Processar linhas
            parsedData = [];
            let validRows = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (!line) continue;
                
                // Split CSV considerando valores entre aspas
                const values = [];
                let inQuotes = false;
                let currentValue = '';
                
                for (let j = 0; j < line.length; j++) {
                    const char = line[j];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue);
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                
                values.push(currentValue);
                
                // Criar objeto com valores
                const rowData = {};
                
                for (let j = 0; j < headers.length; j++) {
                    rowData[headers[j]] = values[j] || '';
                }
                
                // Validar campos obrigatórios
                if (rowData['Tipo'] && rowData['Descrição'] && rowData['Data'] && rowData['Valor']) {
                    parsedData.push(rowData);
                    validRows++;
                }
            }
            
            // Exibir pré-visualização
            const previewContainer = document.querySelector('.import-preview');
            const previewTable = document.getElementById('import-preview-table');
            const importCount = document.getElementById('import-count');
            
            if (validRows > 0) {
                previewContainer.style.display = 'block';
                importCount.textContent = validRows;
                
                // Montar tabela de pré-visualização (limitar a 5 registros)
                const previewData = parsedData.slice(0, 5);
                
                let tableHtml = '';
                
                previewData.forEach(row => {
                    tableHtml += `
                        <tr>
                            <td>${row['Tipo'] || ''}</td>
                            <td>${row['Descrição'] || ''}</td>
                            <td>${row['Categoria'] || ''}</td>
                            <td>${row['Data'] || ''}</td>
                            <td>${row['Valor'] || ''}</td>
                            <td>${row['Status'] || ''}</td>
                        </tr>
                    `;
                });
                
                previewTable.querySelector('tbody').innerHTML = tableHtml;
                
                // Habilitar botão de importação
                document.getElementById('btn-import-data').disabled = false;
            } else {
                showAlert('Nenhum dado válido encontrado no arquivo', 'warning');
                previewContainer.style.display = 'none';
                document.getElementById('btn-import-data').disabled = true;
            }
        };
        
        reader.readAsText(file);
    });
    
    // Configurar botão de importação
    document.getElementById('btn-import-data').addEventListener('click', async () => {
        if (!parsedData || parsedData.length === 0) {
            showAlert('Nenhum dado para importar', 'warning');
            return;
        }
        
        // Confirmar importação
        if (!confirm(`Você está prestes a importar ${parsedData.length} registros. Deseja continuar?`)) {
            return;
        }
        
        showSpinner();
        
        try {
            // Transformar dados para o formato da API
            const transacoesData = parsedData.map((row, index) => {
                // Gerar ID para a transação
                const idNum = index + 1;
                
                return {
                    ID_Transacao: `IMPORT${String(idNum).padStart(4, '0')}`,
                    Tipo: row['Tipo'],
                    Descricao: row['Descrição'],
                    Categoria: row['Categoria'],
                    Data: row['Data'],
                    ID_OS: row['Ordem de Serviço'] || '',
                    Valor: row['Valor'],
                    Forma_Pagamento: row['Forma de Pagamento'] || '',
                    Status: row['Status'] || 'Pendente',
                    Observacoes: row['Observações'] || ''
                };
            });
            
            // Enviar para a API
            const response = await fetch(`${SHEET_API}?sheet=Financeiro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: transacoesData })
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API (Importação):", response.status, response.statusText);
                throw new Error(`Erro ao importar dados: ${response.status}`);
            }
            
            showAlert(`${transacoesData.length} transações importadas com sucesso!`, 'success');
            
            // Fechar modal e recarregar dados
            closeModal();
            loadFinanceiroData();
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showAlert('Erro ao importar dados. Por favor, tente novamente.', 'danger');
        } finally {
            hideSpinner();
        }
    });
}

// Adicionar botão de importação
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se a seção de filtros existe
    const filterContainer = document.querySelector('.filter-container');
    
    if (filterContainer) {
        // Criar botão de importação
        const importBtn = document.createElement('div');
        importBtn.className = 'filter-item';
        importBtn.innerHTML = `
            <label>&nbsp;</label>
            <button id="btn-import" class="btn btn-secondary">
                <i class="fas fa-file-import"></i> Importar
            </button>
        `;
        
        // Adicionar botão à seção de filtros
        filterContainer.appendChild(importBtn);
        
        // Configurar evento de clique
        document.getElementById('btn-import').addEventListener('click', importarDadosFinanceiros);
    }
});