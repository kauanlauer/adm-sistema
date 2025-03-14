// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentPage = 'dashboard';
let currentPageData = {};

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando sistema...");
    
    // Inicialização dos elementos
    const spinnerOverlay = document.getElementById('spinner-overlay');
    const alertContainer = document.getElementById('alert-container');
    
    // Mostrar página inicial
    showPageContent(currentPage);
    
    // Configurar navegação do menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Evento de mudança no timeframe do gráfico
    const chartTimeframe = document.getElementById('chartTimeframe');
    if (chartTimeframe) {
        chartTimeframe.addEventListener('change', () => {
            if (currentPageData.ordens) {
                loadCharts(currentPageData.ordens);
            } else {
                fetch(`${SHEET_API}?sheet=Ordens_Servico`)
                    .then(response => response.json())
                    .then(ordens => {
                        currentPageData.ordens = ordens;
                        loadCharts(ordens);
                    })
                    .catch(error => {
                        console.error('Erro ao recarregar gráficos:', error);
                    });
            }
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
    
    // Configuração para fechar modais
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Fechar modal ao clicar fora do conteúdo
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Configurar botões para abrir modais
    const modalButtons = [
        { btnId: 'btn-new-cliente', modalId: 'cliente-modal' },
        { btnId: 'btn-new-servico', modalId: 'servico-modal' },
        { btnId: 'btn-new-ordem', modalId: 'ordem-modal' }
    ];
    
    modalButtons.forEach(({ btnId, modalId }) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        
        if (btn && modal) {
            btn.addEventListener('click', () => {
                // Limpar formulário
                const form = modal.querySelector('form');
                if (form) form.reset();
                
                // Limpar campos de ID
                const idInput = form ? form.querySelector('input[type="hidden"]') : null;
                if (idInput) idInput.value = '';
                
                // Atualizar título do modal
                const title = modal.querySelector('.modal-header h3');
                if (title) {
                    if (modalId === 'cliente-modal') title.textContent = 'Novo Cliente';
                    if (modalId === 'servico-modal') title.textContent = 'Novo Serviço';
                    if (modalId === 'ordem-modal') title.textContent = 'Nova Ordem de Serviço';
                }
                
                modal.style.display = 'flex';
            });
        }
    });
    
    // Configurar botões para salvar
    const btnSaveCliente = document.getElementById('btn-save-cliente');
    if (btnSaveCliente) {
        btnSaveCliente.addEventListener('click', salvarCliente);
    }
    
    const btnSaveServico = document.getElementById('btn-save-servico');
    if (btnSaveServico) {
        btnSaveServico.addEventListener('click', salvarServico);
    }
    
    // Configurar busca
    const btnSearchCliente = document.getElementById('btn-search-cliente');
    if (btnSearchCliente) {
        btnSearchCliente.addEventListener('click', buscarClientes);
    }
    
    const searchCliente = document.getElementById('search-cliente');
    if (searchCliente) {
        searchCliente.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                buscarClientes();
            }
        });
    }
    
    const btnSearchServico = document.getElementById('btn-search-servico');
    if (btnSearchServico) {
        btnSearchServico.addEventListener('click', buscarServicos);
    }
    
    const searchServico = document.getElementById('search-servico');
    if (searchServico) {
        searchServico.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                buscarServicos();
            }
        });
    }
    
    // Eventos para o status das ordens (mostrar/esconder campos condicionais)
    const ordemStatus = document.getElementById('ordem-status');
    if (ordemStatus) {
        ordemStatus.addEventListener('change', () => {
            const dataConclusaoContainer = document.querySelector('.data-conclusao-container');
            const solucaoContainer = document.querySelector('.solucao-container');
            
            if (dataConclusaoContainer && solucaoContainer) {
                if (ordemStatus.value === 'Concluído') {
                    // Mostrar campos de conclusão
                    dataConclusaoContainer.style.display = 'block';
                    solucaoContainer.style.display = 'block';
                } else {
                    // Esconder campos de conclusão
                    dataConclusaoContainer.style.display = 'none';
                    solucaoContainer.style.display = 'none';
                }
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

// Função para mostrar a página correta
function showPageContent(page) {
    console.log(`Mostrando página: ${page}`);
    
    // Esconder todas as páginas
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Mostrar a página selecionada
    const pageContent = document.getElementById(`${page}-content`);
    if (pageContent) {
        pageContent.classList.add('active');
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
        }
    } else {
        console.warn(`Conteúdo da página ${page} não encontrado`);
    }
    
    // Atualizar item ativo no menu
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Carregar dados específicos da página
    if (page === 'dashboard') {
        loadDashboardData();
        loadRecentOrders();
    } else if (page === 'clientes') {
        loadClientesData();
    } else if (page === 'servicos') {
        loadServicosData();
    } else if (page === 'ordens') {
        // Carregar dados de ordens quando implementado
        showAlert('Módulo de Ordens em desenvolvimento', 'info');
    }
}

// Função de navegação melhorada
function navigateTo(page) {
    console.log(`Navegando para: ${page}`);
    
    // Se for a mesma página, não fazer nada
    if (page === currentPage) return;
    
    // Verificar se a página existe no aplicativo atual
    const pageContent = document.getElementById(`${page}-content`);
    
    if (pageContent) {
        // A página existe, mudar para ela
        currentPage = page;
        showPageContent(page);
    } else {
        // A página não existe, redirecionar para outro arquivo
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
}

// Função para preencher a tabela de ordens recentes
async function loadRecentOrders() {
    console.log("Carregando ordens recentes...");
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) {
        console.warn("Elemento 'recent-orders-table' não encontrado");
        return;
    }
    
    try {
        showSpinner();
        
        // Buscar ordens de serviço
        const response = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Ordens):", response.status, response.statusText);
            throw new Error(`Erro ao buscar ordens: ${response.status}`);
        }
        
        const orders = await response.json();
        currentPageData.ordens = orders;
        
        // Ordenar por data (mais recentes primeiro)
        orders.sort((a, b) => {
            if (!a.Data_Abertura || !b.Data_Abertura) return 0;
            
            const dateA = new Date(a.Data_Abertura.split('/').reverse().join('-'));
            const dateB = new Date(b.Data_Abertura.split('/').reverse().join('-'));
            return dateB - dateA;
        });
        
        // Pegar apenas as 5 mais recentes
        const recentOrders = orders.slice(0, 5);
        
        tableBody.innerHTML = '';
        
        if (recentOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma ordem de serviço encontrada</td></tr>';
            return;
        }
        
        // Preencher a tabela
        for (const order of recentOrders) {
            let statusClass = '';
            
            switch (order.Status) {
                case 'Concluído':
                    statusClass = 'completed';
                    break;
                case 'Em Andamento':
                    statusClass = 'in-progress';
                    break;
                default:
                    statusClass = 'pending';
                    break;
            }
            
            tableBody.innerHTML += `
                <tr>
                    <td>${order.ID || ''}</td>
                    <td>${order.Cliente || ''}</td>
                    <td>${order.Servicos || ''}</td>
                    <td>${order.Data_Abertura || ''}</td>
                    <td>R$ ${parseFloat(order.Valor_Total || 0).toFixed(2)}</td>
                    <td><span class="status ${statusClass}">${order.Status || ''}</span></td>
                    <td>
                        <button class="btn-icon edit" onclick="viewOrder('${order.ID}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar ordens recentes:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Erro ao carregar ordens</td></tr>';
        showAlert('Erro ao carregar ordens recentes. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para carregar dados do dashboard
async function loadDashboardData() {
    console.log("Carregando dados do dashboard...");
    
    try {
        showSpinner();
        
        // Verificar se os elementos existem
        const totalClientesElement = document.getElementById('total-clientes');
        const novosClientesElement = document.getElementById('novos-clientes');
        const totalServicosElement = document.getElementById('total-servicos');
        const servicosMesElement = document.getElementById('servicos-mes');
        const ordensAtivasElement = document.getElementById('ordens-ativas');
        const ordensAndamentoElement = document.getElementById('ordens-andamento');
        const faturamentoValorElement = document.getElementById('faturamento-valor');
        const faturamentoPercentualElement = document.getElementById('faturamento-percentual');
        
        if (!totalClientesElement || !novosClientesElement || !totalServicosElement || 
            !servicosMesElement || !ordensAtivasElement || !ordensAndamentoElement || 
            !faturamentoValorElement || !faturamentoPercentualElement) {
            console.warn("Alguns elementos do dashboard não foram encontrados");
        }
        
        // Buscar dados dos clientes
        console.log("Buscando dados de clientes...");
        const clientesResponse = await fetch(`${SHEET_API}?sheet=Clientes`);
        
        if (!clientesResponse.ok) {
            console.error("Erro na resposta da API (Clientes):", clientesResponse.status, clientesResponse.statusText);
            throw new Error(`Erro ao buscar clientes: ${clientesResponse.status}`);
        }
        
        const clientes = await clientesResponse.json();
        console.log(`${clientes.length} clientes carregados`);
        currentPageData.clientes = clientes;
        
        // Buscar dados dos serviços
        console.log("Buscando dados de serviços...");
        const servicosResponse = await fetch(`${SHEET_API}?sheet=Servicos`);
        
        if (!servicosResponse.ok) {
            console.error("Erro na resposta da API (Serviços):", servicosResponse.status, servicosResponse.statusText);
            throw new Error(`Erro ao buscar serviços: ${servicosResponse.status}`);
        }
        
        const servicos = await servicosResponse.json();
        console.log(`${servicos.length} serviços carregados`);
        currentPageData.servicos = servicos;
        
        // Buscar dados das ordens de serviço
        console.log("Buscando dados de ordens de serviço...");
        const ordensResponse = await fetch(`${SHEET_API}?sheet=Ordens_Servico`);
        
        if (!ordensResponse.ok) {
            console.error("Erro na resposta da API (Ordens):", ordensResponse.status, ordensResponse.statusText);
            throw new Error(`Erro ao buscar ordens: ${ordensResponse.status}`);
        }
        
        const ordens = await ordensResponse.json();
        console.log(`${ordens.length} ordens carregadas`);
        currentPageData.ordens = ordens;
        
        // Contar clientes
        const totalClientes = clientes.length;
        
        // Contar clientes novos (últimos 30 dias)
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        const clientesNovos = clientes.filter(cliente => {
            if (!cliente.Data_Cadastro) return false;
            
            const parts = cliente.Data_Cadastro.split('/');
            const dataCadastro = new Date(parts[2], parts[1] - 1, parts[0]);
            
            return dataCadastro >= trintaDiasAtras;
        }).length;
        
        // Contar serviços
        const totalServicos = servicos.length;
        
        // Contar serviços realizados no mês
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        const servicosMes = ordens.filter(ordem => {
            if (!ordem.Data_Abertura) return false;
            
            const parts = ordem.Data_Abertura.split('/');
            const dataAbertura = new Date(parts[2], parts[1] - 1, parts[0]);
            
            return dataAbertura >= inicioMes;
        }).length;
        
        // Contar ordens ativas
        const ordensAtivas = ordens.filter(ordem => 
            ordem.Status === 'Aberto' || ordem.Status === 'Em Andamento'
        ).length;
        
        const ordensAndamento = ordens.filter(ordem => 
            ordem.Status === 'Em Andamento'
        ).length;
        
        // Calcular faturamento
        const faturamentoMes = ordens
            .filter(ordem => {
                if (!ordem.Data_Abertura) return false;
                
                const parts = ordem.Data_Abertura.split('/');
                const dataAbertura = new Date(parts[2], parts[1] - 1, parts[0]);
                
                return dataAbertura >= inicioMes && ordem.Status_Pagamento === 'Pago';
            })
            .reduce((total, ordem) => total + (parseFloat(ordem.Valor_Total) || 0), 0);
        
        // Calcular faturamento do mês anterior
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        
        const faturamentoMesAnterior = ordens
            .filter(ordem => {
                if (!ordem.Data_Abertura) return false;
                
                const parts = ordem.Data_Abertura.split('/');
                const dataAbertura = new Date(parts[2], parts[1] - 1, parts[0]);
                
                return dataAbertura >= inicioMesAnterior && 
                       dataAbertura <= fimMesAnterior && 
                       ordem.Status_Pagamento === 'Pago';
            })
            .reduce((total, ordem) => total + (parseFloat(ordem.Valor_Total) || 0), 0);
        
        // Calcular percentual de crescimento
        let percentualCrescimento = 0;
        
        if (faturamentoMesAnterior > 0) {
            percentualCrescimento = ((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100;
        }
        
        // Atualizar elementos na interface
        if (totalClientesElement) totalClientesElement.textContent = totalClientes;
        if (novosClientesElement) novosClientesElement.textContent = `${clientesNovos} novos em 30 dias`;
        
        if (totalServicosElement) totalServicosElement.textContent = totalServicos;
        if (servicosMesElement) servicosMesElement.textContent = `${servicosMes} no mês atual`;
        
        if (ordensAtivasElement) ordensAtivasElement.textContent = ordensAtivas;
        if (ordensAndamentoElement) ordensAndamentoElement.textContent = `${ordensAndamento} em andamento`;
        
        if (faturamentoValorElement) faturamentoValorElement.textContent = `R$ ${faturamentoMes.toFixed(2)}`;
        if (faturamentoPercentualElement) {
            faturamentoPercentualElement.textContent = 
                percentualCrescimento >= 0 
                    ? `+${percentualCrescimento.toFixed(1)}% vs mês anterior`
                    : `${percentualCrescimento.toFixed(1)}% vs mês anterior`;
        }
        
        // Carregar gráficos
        loadCharts(ordens);
        
        console.log("Dashboard carregado com sucesso");
        
    } catch (error) {
        console.error('Erro detalhado ao carregar dados do dashboard:', error);
        showAlert('Erro ao carregar dados. Por favor, tente novamente.', 'danger');
    } finally {
        hideSpinner();
    }
}

// Função para carregar os gráficos
function loadCharts(ordens) {
    console.log("Carregando gráficos...");
    
    // Verificar se os elementos existem
    const incomeChartCanvas = document.getElementById('incomeChart');
    const servicesChartCanvas = document.getElementById('servicesChart');
    
    if (!incomeChartCanvas || !servicesChartCanvas) {
        console.warn("Canvas para gráficos não encontrados");
        return;
    }
    
    // Verificar se a biblioteca Chart está disponível
    if (typeof Chart === 'undefined') {
        console.error("Biblioteca Chart.js não está disponível");
        showAlert('Erro ao carregar gráficos: biblioteca Chart.js não disponível', 'danger');
        return;
    }
    
    try {
        // Configurar dados para o gráfico de faturamento
        const chartTimeframe = document.getElementById('chartTimeframe');
        const chartValue = chartTimeframe ? chartTimeframe.value : 'month';
        const hoje = new Date();
        
        let labels = [];
        let data = [];
        
        if (chartValue === 'month') {
            // Dados para o mês atual
            const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
            
            labels = Array.from({length: diasNoMes}, (_, i) => i + 1);
            data = Array(diasNoMes).fill(0);
            
            ordens.forEach(ordem => {
                if (!ordem.Data_Abertura || ordem.Status_Pagamento !== 'Pago') return;
                
                const parts = ordem.Data_Abertura.split('/');
                const dataAbertura = new Date(parts[2], parts[1] - 1, parts[0]);
                
                if (dataAbertura.getMonth() === hoje.getMonth() && dataAbertura.getFullYear() === hoje.getFullYear()) {
                    const dia = dataAbertura.getDate() - 1; // Índice começa em 0
                    data[dia] += parseFloat(ordem.Valor_Total) || 0;
                }
            });
        } else if (chartValue === 'quarter') {
            // Dados para o trimestre atual
            const mesAtual = hoje.getMonth();
            const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
            
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            labels = meses.slice(inicioTrimestre, inicioTrimestre + 3);
            data = Array(3).fill(0);
            
            ordens.forEach(ordem => {
                if (!ordem.Data_Abertura || ordem.Status_Pagamento !== 'Pago') return;
                
                const parts = ordem.Data_Abertura.split('/');
                const mes = parseInt(parts[1]) - 1; // Mês em JavaScript começa em 0
                const ano = parseInt(parts[2]);
                
                if (ano === hoje.getFullYear() && mes >= inicioTrimestre && mes < inicioTrimestre + 3) {
                    const index = mes - inicioTrimestre;
                    data[index] += parseFloat(ordem.Valor_Total) || 0;
                }
            });
        } else if (chartValue === 'year') {
            // Dados para o ano atual
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            labels = meses;
            data = Array(12).fill(0);
            
            ordens.forEach(ordem => {
                if (!ordem.Data_Abertura || ordem.Status_Pagamento !== 'Pago') return;
                
                const parts = ordem.Data_Abertura.split('/');
                const mes = parseInt(parts[1]) - 1; // Mês em JavaScript começa em 0
                const ano = parseInt(parts[2]);
                
                if (ano === hoje.getFullYear()) {
                    data[mes] += parseFloat(ordem.Valor_Total) || 0;
                }
            });
        }
        
        // Renderizar gráfico de faturamento
        const incomeChartCtx = incomeChartCanvas.getContext('2d');
        
        if (window.incomeChart) {
            window.incomeChart.destroy();
        }
        
        window.incomeChart = new Chart(incomeChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: data,
                    backgroundColor: 'rgba(76, 201, 240, 0.7)',
                    borderColor: 'rgba(76, 201, 240, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        
        // Dados para o gráfico de tipos de serviço
        const servicosContagem = {};
        
        ordens.forEach(ordem => {
            if (!ordem.Servicos) return;
            
            const servicos = ordem.Servicos.split(',');
            
            servicos.forEach(servico => {
                const servicoTrim = servico.trim();
                
                if (servicoTrim) {
                    if (servicosContagem[servicoTrim]) {
                        servicosContagem[servicoTrim]++;
                    } else {
                        servicosContagem[servicoTrim] = 1;
                    }
                }
            });
        });
        
        // Pegar os top 5 serviços
        const topServicos = Object.entries(servicosContagem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const servicosLabels = topServicos.map(s => s[0]);
        const servicosData = topServicos.map(s => s[1]);
        
        // Renderizar gráfico de tipos de serviço
        const servicesChartCtx = servicesChartCanvas.getContext('2d');
        
        if (window.servicesChart) {
            window.servicesChart.destroy();
        }
        
        window.servicesChart = new Chart(servicesChartCtx, {
            type: 'doughnut',
            data: {
                labels: servicosLabels,
                datasets: [{
                    data: servicosData,
                    backgroundColor: [
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(58, 12, 163, 0.7)',
                        'rgba(114, 9, 183, 0.7)'
                    ],
                    borderColor: [
                        'rgba(76, 201, 240, 1)',
                        'rgba(67, 97, 238, 1)',
                        'rgba(247, 37, 133, 1)',
                        'rgba(58, 12, 163, 1)',
                        'rgba(114, 9, 183, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        console.log("Gráficos carregados com sucesso");
    } catch (error) {
        console.error("Erro ao carregar gráficos:", error);
        showAlert('Erro ao carregar gráficos', 'danger');
    }
}

// Função para visualizar uma ordem de serviço
function viewOrder(id) {
    // Redirecionar para a página de ordens com o ID específico
    window.location.href = `Cad_Ordens.html?id=${id}`;
}

// Funções para gerenciamento de clientes
function loadClientesData() {
    console.log("Carregando dados de clientes...");
    
    const clientesTable = document.getElementById('clientes-table');
    const clientesPagination = document.getElementById('clientes-pagination');
    
    if (!clientesTable || !clientesPagination) {
        console.warn("Elementos de cliente não encontrados");
        return;
    }
    
    showSpinner();
    
    fetch(`${SHEET_API}?sheet=Clientes`)
        .then(response => {
            if (!response.ok) {
                console.error("Erro na resposta da API (Clientes):", response.status, response.statusText);
                throw new Error('Falha ao buscar clientes');
            }
            return response.json();
        })
        .then(clientes => {
            console.log(`${clientes.length} clientes carregados`);
            currentPageData.clientes = clientes;
            renderClientesTable(clientes);
            setupClientesPagination(clientes);
        })
        .catch(error => {
            console.error('Erro ao carregar clientes:', error);
            showAlert('Erro ao carregar dados dos clientes. Por favor, tente novamente.', 'danger');
            
            if (clientesTable) {
                clientesTable.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">Erro ao carregar clientes</td>
                    </tr>
                `;
            }
        })
        .finally(() => {
            hideSpinner();
        });
}

function renderClientesTable(clientes, page = 1) {
    const clientesTable = document.getElementById('clientes-table');
    if (!clientesTable) return;
    
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClientes = clientes.slice(startIndex, endIndex);
    
    clientesTable.innerHTML = '';
    
    if (paginatedClientes.length === 0) {
        clientesTable.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Nenhum cliente encontrado</td>
            </tr>
        `;
        return;
    }
    
    paginatedClientes.forEach(cliente => {
        const situacaoClass = cliente.Situacao === 'Ativo' ? 'active' : 'inactive';
        
        clientesTable.innerHTML += `
            <tr>
                <td>${cliente.ID || ''}</td>
                <td>${cliente.Nome || ''}</td>
                <td>${cliente.CPF_CNPJ || ''}</td>
                <td>${cliente.Telefone || ''}</td>
                <td>${cliente.Email || ''}</td>
                <td>${cliente.Cidade ? `${cliente.Cidade}/${cliente.Estado || ''}` : ''}</td>
                <td><span class="status ${situacaoClass}">${cliente.Situacao || 'Ativo'}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editarCliente('${cliente.ID}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmarExclusaoCliente('${cliente.ID}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function setupClientesPagination(clientes) {
    const clientesPagination = document.getElementById('clientes-pagination');
    if (!clientesPagination) return;
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(clientes.length / itemsPerPage);
    
    clientesPagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Adicionar botões de paginação
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('div');
        pageButton.className = `pagination-item ${i === 1 ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            document.querySelectorAll('#clientes-pagination .pagination-item').forEach(item => 
                item.classList.remove('active')
            );
            pageButton.classList.add('active');
            renderClientesTable(clientes, i);
        });
        
        clientesPagination.appendChild(pageButton);
    }
}

function editarCliente(id) {
    console.log(`Editando cliente: ${id}`);
    showSpinner();
    
    fetch(`${SHEET_API}/search?sheet=Clientes&ID=${id}`)
        .then(response => {
            if (!response.ok) {
                console.error("Erro na resposta da API (buscar cliente):", response.status, response.statusText);
                throw new Error('Falha ao buscar cliente');
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                showAlert('Cliente não encontrado', 'danger');
                return;
            }
            
            const cliente = data[0];
            console.log("Dados do cliente carregados:", cliente);
            
            // Preencher o formulário
            const idInput = document.getElementById('cliente-id');
            const nomeInput = document.getElementById('cliente-nome');
            const cpfCnpjInput = document.getElementById('cliente-cpf-cnpj');
            const tipoInput = document.getElementById('cliente-tipo');
            const telefoneInput = document.getElementById('cliente-telefone');
            const emailInput = document.getElementById('cliente-email');
            const enderecoInput = document.getElementById('cliente-endereco');
            const cidadeInput = document.getElementById('cliente-cidade');
            const estadoInput = document.getElementById('cliente-estado');
            const cepInput = document.getElementById('cliente-cep');
            const observacoesInput = document.getElementById('cliente-observacoes');
            const situacaoInput = document.getElementById('cliente-situacao');
            
            if (idInput) idInput.value = cliente.ID || '';
            if (nomeInput) nomeInput.value = cliente.Nome || '';
            if (cpfCnpjInput) cpfCnpjInput.value = cliente.CPF_CNPJ || '';
            if (tipoInput) tipoInput.value = cliente.Tipo || 'Pessoa Física';
            if (telefoneInput) telefoneInput.value = cliente.Telefone || '';
            if (emailInput) emailInput.value = cliente.Email || '';
            if (enderecoInput) enderecoInput.value = cliente.Endereco || '';
            if (cidadeInput) cidadeInput.value = cliente.Cidade || '';
            if (estadoInput) estadoInput.value = cliente.Estado || '';
            if (cepInput) cepInput.value = cliente.CEP || '';
            if (observacoesInput) observacoesInput.value = cliente.Observacoes || '';
            if (situacaoInput) situacaoInput.value = cliente.Situacao || 'Ativo';
            
            // Abrir o modal
            const titleElement = document.getElementById('cliente-modal-title');
            if (titleElement) titleElement.textContent = 'Editar Cliente';
            
            const modalElement = document.getElementById('cliente-modal');
            if (modalElement) modalElement.style.display = 'flex';
        })
        .catch(error => {
            console.error('Erro ao editar cliente:', error);
            showAlert('Erro ao carregar dados do cliente', 'danger');
        })
        .finally(() => {
            hideSpinner();
        });
}

function confirmarExclusaoCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
        excluirCliente(id);
    }
}

function excluirCliente(id) {
    console.log(`Excluindo cliente: ${id}`);
    showSpinner();
    
    fetch(`${SHEET_API}/ID/${id}?sheet=Clientes`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                console.error("Erro na resposta da API (excluir cliente):", response.status, response.statusText);
                throw new Error('Falha ao excluir cliente');
            }
            return response.json();
        })
        .then(() => {
            showAlert('Cliente excluído com sucesso!', 'success');
            loadClientesData();
        })
        .catch(error => {
            console.error('Erro ao excluir cliente:', error);
            showAlert('Erro ao excluir cliente', 'danger');
        })
        .finally(() => {
            hideSpinner();
        });
}

function salvarCliente() {
    console.log("Salvando cliente...");
    
    // Capturar dados do formulário
    const clienteId = document.getElementById('cliente-id')?.value;
    const nome = document.getElementById('cliente-nome')?.value;
    const cpfCnpj = document.getElementById('cliente-cpf-cnpj')?.value;
    const tipo = document.getElementById('cliente-tipo')?.value;
    const telefone = document.getElementById('cliente-telefone')?.value;
    const email = document.getElementById('cliente-email')?.value;
    const endereco = document.getElementById('cliente-endereco')?.value;
    const cidade = document.getElementById('cliente-cidade')?.value;
    const estado = document.getElementById('cliente-estado')?.value;
    const cep = document.getElementById('cliente-cep')?.value;
    const observacoes = document.getElementById('cliente-observacoes')?.value;
    const situacao = document.getElementById('cliente-situacao')?.value;
    
    // Validar campos obrigatórios
    if (!nome || !cpfCnpj || !telefone) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    showSpinner();
    
    const clienteData = {
        Nome: nome,
        CPF_CNPJ: cpfCnpj,
        Tipo: tipo,
        Telefone: telefone,
        Email: email,
        Endereco: endereco,
        Cidade: cidade,
        Estado: estado,
        CEP: cep,
        Observacoes: observacoes,
        Situacao: situacao
    };
    
    if (clienteId) {
        // Atualizar cliente existente
        console.log(`Atualizando cliente: ${clienteId}`);
        
        fetch(`${SHEET_API}/ID/${clienteId}?sheet=Clientes`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: clienteData })
        })
            .then(response => {
                if (!response.ok) {
                    console.error("Erro na resposta da API (atualizar cliente):", response.status, response.statusText);
                    throw new Error('Falha ao atualizar cliente');
                }
                return response.json();
            })
            .then(() => {
                showAlert('Cliente atualizado com sucesso!', 'success');
                
                const modal = document.getElementById('cliente-modal');
                if (modal) modal.style.display = 'none';
                
                loadClientesData();
            })
            .catch(error => {
                console.error('Erro ao atualizar cliente:', error);
                showAlert('Erro ao atualizar cliente', 'danger');
            })
            .finally(() => {
                hideSpinner();
            });
    } else {
        // Adicionar novo cliente
        console.log("Adicionando novo cliente");
        
        // Gerar ID
        fetch(`${SHEET_API}?sheet=Clientes`)
            .then(response => response.json())
            .then(clientes => {
                // Gerar ID
                const lastId = clientes.length > 0 
                    ? Math.max(...clientes.map(c => parseInt(c.ID?.replace('CL', '') || '0')))
                    : 0;
                
                clienteData.ID = `CL${String(lastId + 1).padStart(4, '0')}`;
                
                // Definir data de cadastro
                const now = new Date();
                clienteData.Data_Cadastro = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                
                console.log("Enviando dados do cliente:", clienteData);
                
                // Enviar para a API
                return fetch(`${SHEET_API}?sheet=Clientes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ data: [clienteData] })
                });
            })
            .then(response => {
                if (!response.ok) {
                    console.error("Erro na resposta da API (adicionar cliente):", response.status, response.statusText);
                    throw new Error('Falha ao adicionar cliente');
                }
                return response.json();
            })
            .then(() => {
                showAlert('Cliente adicionado com sucesso!', 'success');
                
                const modal = document.getElementById('cliente-modal');
                if (modal) modal.style.display = 'none';
                
                loadClientesData();
            })
            .catch(error => {
                console.error('Erro ao adicionar cliente:', error);
                showAlert('Erro ao adicionar cliente', 'danger');
            })
            .finally(() => {
                hideSpinner();
            });
    }
}

// Função para buscar clientes
function buscarClientes() {
    const searchInput = document.getElementById('search-cliente');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        loadClientesData();
        return;
    }
    
    console.log(`Buscando clientes: "${searchTerm}"`);
    showSpinner();
    
    fetch(`${SHEET_API}?sheet=Clientes`)
        .then(response => response.json())
        .then(clientes => {
            const filteredClientes = clientes.filter(cliente => 
                (cliente.Nome && cliente.Nome.toLowerCase().includes(searchTerm)) ||
                (cliente.CPF_CNPJ && cliente.CPF_CNPJ.toLowerCase().includes(searchTerm)) ||
                (cliente.Email && cliente.Email.toLowerCase().includes(searchTerm)) ||
                (cliente.Telefone && cliente.Telefone.toLowerCase().includes(searchTerm))
            );
            
            console.log(`${filteredClientes.length} clientes encontrados`);
            renderClientesTable(filteredClientes);
            setupClientesPagination(filteredClientes);
        })
        .catch(error => {
            console.error('Erro ao buscar clientes:', error);
            showAlert('Erro ao buscar clientes', 'danger');
        })
        .finally(() => {
            hideSpinner();
        });
}

// Funções para gerenciamento de serviços
function loadServicosData() {
    console.log("Carregando dados de serviços...");
    
    const servicosTable = document.getElementById('servicos-table');
    const servicosPagination = document.getElementById('servicos-pagination');
    
    if (!servicosTable || !servicosPagination) {
        console.warn("Elementos de serviço não encontrados");
        return;
    }
    
    showSpinner();
    
    fetch(`${SHEET_API}?sheet=Servicos`)
        .then(response => {
            if (!response.ok) {
                console.error("Erro na resposta da API (Serviços):", response.status, response.statusText);
                throw new Error('Falha ao buscar serviços');
            }
            return response.json();
        })
        .then(servicos => {
            console.log(`${servicos.length} serviços carregados`);
            currentPageData.servicos = servicos;
            renderServicosTable(servicos);
            setupServicosPagination(servicos);
        })
        .catch(error => {
            console.error('Erro ao carregar serviços:', error);
            showAlert('Erro ao carregar dados dos serviços. Por favor, tente novamente.', 'danger');
            
            if (servicosTable) {
                servicosTable.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">Erro ao carregar serviços</td>
                    </tr>
                `;
            }
        })
        .finally(() => {
            hideSpinner();
        });
}

function renderServicosTable(servicos, page = 1) {
    const servicosTable = document.getElementById('servicos-table');
    if (!servicosTable) return;
    
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedServicos = servicos.slice(startIndex, endIndex);
    
    servicosTable.innerHTML = '';
    
    if (paginatedServicos.length === 0) {
        servicosTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Nenhum serviço encontrado</td>
            </tr>
        `;
        return;
    }
    
    paginatedServicos.forEach(servico => {
        const situacaoClass = servico.Situacao === 'Ativo' ? 'active' : 'inactive';
        
        servicosTable.innerHTML += `
            <tr>
                <td>${servico.ID || ''}</td>
                <td>${servico.Nome || ''}</td>
                <td>${servico.Categoria || ''}</td>
                <td>R$ ${parseFloat(servico.Preco || 0).toFixed(2)}</td>
                <td>${servico.Garantia || '0'}</td>
                <td><span class="status ${situacaoClass}">${servico.Situacao || 'Ativo'}</span></td>
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
    });
}

function setupServicosPagination(servicos) {
    const servicosPagination = document.getElementById('servicos-pagination');
    if (!servicosPagination) return;
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(servicos.length / itemsPerPage);
    
    servicosPagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Adicionar botões de paginação
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('div');
        pageButton.className = `pagination-item ${i === 1 ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            document.querySelectorAll('#servicos-pagination .pagination-item').forEach(item => 
                item.classList.remove('active')
            );
            pageButton.classList.add('active');
            renderServicosTable(servicos, i);
        });
        
        servicosPagination.appendChild(pageButton);
    }
}

function editarServico(id) {
    console.log(`Editando serviço: ${id}`);
    showSpinner();
    
    fetch(`${SHEET_API}/search?sheet=Servicos&ID=${id}`)
        .then(response => {
            if (!response.ok) {
                console.error("Erro na resposta da API (buscar serviço):", response.status, response.statusText);
                throw new Error('Falha ao buscar serviço');
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                showAlert('Serviço não encontrado', 'danger');
                return;
            }
            
            const servico = data[0];
            console.log("Dados do serviço carregados:", servico);
            
            // Preencher o formulário
            const idInput = document.getElementById('servico-id');
            const nomeInput = document.getElementById('servico-nome');
            const categoriaInput = document.getElementById('servico-categoria');
            const descricaoInput = document.getElementById('servico-descricao');
            const precoInput = document.getElementById('servico-preco');
            const tempoInput = document.getElementById('servico-tempo');
            const garantiaInput = document.getElementById('servico-garantia');
            const situacaoInput = document.getElementById('servico-situacao');
            
            if (idInput) idInput.value = servico.ID || '';
            if (nomeInput) nomeInput.value = servico.Nome || '';
            if (categoriaInput) categoriaInput.value = servico.Categoria || '';
            if (descricaoInput) descricaoInput.value = servico.Descricao || '';
            if (precoInput) precoInput.value = servico.Preco || '';
            if (tempoInput) tempoInput.value = servico.Tempo_Estimado || '';
            if (garantiaInput) garantiaInput.value = servico.Garantia || '';
            if (situacaoInput) situacaoInput.value = servico.Situacao || 'Ativo';
            
            // Abrir o modal
            const titleElement = document.getElementById('servico-modal-title');
            if (titleElement) titleElement.textContent = 'Editar Serviço';
            
            const modalElement = document.getElementById('servico-modal');
            if (modalElement) modalElement.style.display = 'flex';
        })
        .catch(error => {
            console.error('Erro ao editar serviço:', error);
            showAlert('Erro ao carregar dados do serviço', 'danger');
        })
        .finally(() => {
            hideSpinner();
        });
}

function confirmarExclusaoServico(id) {
    if (confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
        excluirServico(id);
    }
}

function excluirServico(id) {
    console.log(`Excluindo serviço: ${id}`);
    showSpinner();
    
    fetch(`${SHEET_API}/ID/${id}?sheet=Servicos`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                console.error("Erro na resposta da API (excluir serviço):", response.status, response.statusText);
                throw new Error('Falha ao excluir serviço');
            }
            return response.json();
        })
        .then(() => {
            showAlert('Serviço excluído com sucesso!', 'success');
            loadServicosData();
        })
        .catch(error => {
            console.error('Erro ao excluir serviço:', error);
            showAlert('Erro ao excluir serviço', 'danger');
        })
        .finally(() => {
            hideSpinner();
        });
}

function salvarServico() {
    console.log("Salvando serviço...");
    
    // Capturar dados do formulário
    const servicoId = document.getElementById('servico-id')?.value;
    const nome = document.getElementById('servico-nome')?.value;
    const categoria = document.getElementById('servico-categoria')?.value;
    const descricao = document.getElementById('servico-descricao')?.value;
    const preco = document.getElementById('servico-preco')?.value;
    const tempo = document.getElementById('servico-tempo')?.value;
    const garantia = document.getElementById('servico-garantia')?.value;
    const situacao = document.getElementById('servico-situacao')?.value;
    
    // Validar campos obrigatórios
    if (!nome || !categoria || !preco) {
        showAlert('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    showSpinner();
    
    const servicoData = {
        Nome: nome,
        Categoria: categoria,
        Descricao: descricao,
        Preco: preco,
        Tempo_Estimado: tempo,
        Garantia: garantia,
        Situacao: situacao
    };
    
    if (servicoId) {
        // Atualizar serviço existente
        console.log(`Atualizando serviço: ${servicoId}`);
        
        fetch(`${SHEET_API}/ID/${servicoId}?sheet=Servicos`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: servicoData })
        })
            .then(response => {
                if (!response.ok) {
                    console.error("Erro na resposta da API (atualizar serviço):", response.status, response.statusText);
                    throw new Error('Falha ao atualizar serviço');
                }
                return response.json();
            })
            .then(() => {
                showAlert('Serviço atualizado com sucesso!', 'success');
                
                const modal = document.getElementById('servico-modal');
                if (modal) modal.style.display = 'none';
                
                loadServicosData();
            })
            .catch(error => {
                console.error('Erro ao atualizar serviço:', error);
                showAlert('Erro ao atualizar serviço', 'danger');
            })
            .finally(() => {
                hideSpinner();
            });
    } else {
        // Adicionar novo serviço
        console.log("Adicionando novo serviço");
        
        // Gerar ID
        fetch(`${SHEET_API}?sheet=Servicos`)
            .then(response => response.json())
            .then(servicos => {
                // Gerar ID
                const lastId = servicos.length > 0 
                    ? Math.max(...servicos.map(s => parseInt(s.ID?.replace('SV', '') || '0')))
                    : 0;
                
                servicoData.ID = `SV${String(lastId + 1).padStart(4, '0')}`;
                
                console.log("Enviando dados do serviço:", servicoData);
                
                // Enviar para a API
                return fetch(`${SHEET_API}?sheet=Servicos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ data: [servicoData] })
                });
            })
            .then(response => {
                if (!response.ok) {
                    console.error("Erro na resposta da API (adicionar serviço):", response.status, response.statusText);
                    throw new Error('Falha ao adicionar serviço');
                }
                return response.json();
            })
            .then(() => {
                showAlert('Serviço adicionado com sucesso!', 'success');
                
                const modal = document.getElementById('servico-modal');
                if (modal) modal.style.display = 'none';
                
                loadServicosData();
            })
            .catch(error => {
                console.error('Erro ao adicionar serviço:', error);
                showAlert('Erro ao adicionar serviço', 'danger');
            })
            .finally(() => {
                hideSpinner();
            });
    }
}

// Função para buscar serviços
function buscarServicos() {
    const searchInput = document.getElementById('search-servico');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        loadServicosData();
        return;
    }
    
    console.log(`Buscando serviços: "${searchTerm}"`);
    showSpinner();
    
    fetch(`${SHEET_API}?sheet=Servicos`)
        .then(response => response.json())
        .then(servicos => {
            const filteredServicos = servicos.filter(servico => 
                (servico.Nome && servico.Nome.toLowerCase().includes(searchTerm)) ||
                (servico.Categoria && servico.Categoria.toLowerCase().includes(searchTerm)) ||
                (servico.Descricao && servico.Descricao.toLowerCase().includes(searchTerm))
            );
            
            console.log(`${filteredServicos.length} serviços encontrados`);
            renderServicosTable(filteredServicos);
            setupServicosPagination(filteredServicos);
        })
        .catch(error => {
            console.error('Erro ao buscar serviços:', error);
            showAlert('Erro ao buscar serviços', 'danger');
        })
        .finally(() => {
            hideSpinner();
        });
}