// API SheetDB
const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';

// Configurações globais
let currentReport = {
    tipo: 'clientes',
    periodo: 'mes',
    dataInicio: null,
    dataFim: null,
    opcoes: {},
    dados: null
};

let chartsInstances = {};
let loadedData = {
    clientes: [],
    servicos: [],
    ordens: [],
    financeiro: [],
    tecnicos: []
};

// Inicialização após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando módulo de relatórios...");
    
    // Configurar períodos de data padrão
    configurarPeriodos();
    
    // Configurar navegação do menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Configurar tipo de relatório
    document.getElementById('relatorio-tipo').addEventListener('change', mudarTipoRelatorio);
    
    // Configurar combobox de período
    document.getElementById('periodo').addEventListener('change', function() {
        const dataPersonalizada = document.querySelectorAll('.data-personalizada');
        
        if (this.value === 'personalizado') {
            dataPersonalizada.forEach(elem => elem.style.display = 'block');
        } else {
            dataPersonalizada.forEach(elem => elem.style.display = 'none');
        }
    });
    
    // Configurar botão de gerar relatório
    document.getElementById('btn-gerar-relatorio').addEventListener('click', gerarRelatorio);
    
    // Configurar botões de exportação
    document.getElementById('btn-imprimir').addEventListener('click', imprimirRelatorio);
    document.getElementById('btn-exportar-pdf').addEventListener('click', exportarPDF);
    document.getElementById('btn-exportar-excel').addEventListener('click', exportarExcel);
    document.getElementById('btn-exportar-grafico').addEventListener('click', exportarGrafico);
    
    // Configurar modal de gráfico
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Fechar modal ao clicar fora
    document.getElementById('grafico-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('grafico-modal')) {
            document.getElementById('grafico-modal').style.display = 'none';
        }
    });
    
    // Toggle do sidebar em dispositivos móveis
    document.querySelector('.mobile-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Inicializar primeira visualização
    mudarTipoRelatorio();
    
    // Carregar clientes para o filtro de ordens
    carregarClientesDropdown();
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
    currentReport.dataInicio = primeiroDiaMes;
    currentReport.dataFim = hoje;
}

// Carregar clientes para dropdown
async function carregarClientesDropdown() {
    try {
        showSpinner();
        
        const response = await fetch(`${SHEET_API}?sheet=Clientes`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Clientes):", response.status, response.statusText);
            throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        
        const clientes = await response.json();
        hideSpinner();
        
        // Preencher dropdown de clientes no filtro de ordens
        const selectCliente = document.getElementById('ordem-cliente');
        if (!selectCliente) return;
        
        // Manter a opção "Todos"
        selectCliente.innerHTML = '<option value="">Todos</option>';
        
        // Adicionar clientes ordenados por nome
        clientes
            .sort((a, b) => a.Nome.localeCompare(b.Nome))
            .forEach(cliente => {
                selectCliente.innerHTML += `<option value="${cliente.ID}">${cliente.Nome}</option>`;
            });
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        hideSpinner();
        showAlert('Erro ao carregar lista de clientes', 'danger');
    }
}

// Função para mudar tipo de relatório
function mudarTipoRelatorio() {
    const tipoRelatorio = document.getElementById('relatorio-tipo').value;
    currentReport.tipo = tipoRelatorio;
    
    // Esconder todas as opções
    document.querySelectorAll('.relatorio-opcoes').forEach(opcoes => {
        opcoes.style.display = 'none';
    });
    
    // Mostrar opções correspondentes ao tipo selecionado
    const opcoesElement = document.getElementById(`opcoes-${tipoRelatorio}`);
    if (opcoesElement) {
        opcoesElement.style.display = 'block';
    }
    
    // Atualizar título do relatório
    const tituloMap = {
        'clientes': 'Relatório de Clientes',
        'servicos': 'Relatório de Serviços',
        'ordens': 'Relatório de Ordens de Serviço',
        'financeiro': 'Relatório Financeiro',
        'tecnico': 'Relatório de Desempenho Técnico'
    };
    
    document.getElementById('relatorio-titulo').textContent = tituloMap[tipoRelatorio] || 'Relatório';
    
    // Limpar área de relatório
    document.getElementById('relatorio-conteudo').innerHTML = `
        <div class="report-placeholder">
            <div class="report-icon">
                <i class="fas fa-chart-bar"></i>
            </div>
            <div class="report-message">
                Selecione as opções e clique em "Gerar Relatório" para visualizar os dados.
            </div>
        </div>
    `;
}

// Função para gerar relatório
async function gerarRelatorio() {
    console.log("Gerando relatório...");
    
    // Obter tipo e período
    const tipoRelatorio = document.getElementById('relatorio-tipo').value;
    const periodo = document.getElementById('periodo').value;
    
    // Definir datas baseadas no período
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
    
    // Atualizar configuração atual
    currentReport.tipo = tipoRelatorio;
    currentReport.periodo = periodo;
    currentReport.dataInicio = dataInicio;
    currentReport.dataFim = dataFim;
    
    // Obter opções específicas do relatório
    currentReport.opcoes = obterOpcoesRelatorio(tipoRelatorio);
    
    showSpinner();
    
    try {
        // Carregar dados com base no tipo de relatório
        switch (tipoRelatorio) {
            case 'clientes':
                await carregarDadosClientes();
                break;
            case 'servicos':
                await carregarDadosServicos();
                break;
            case 'ordens':
                await carregarDadosOrdens();
                break;
            case 'financeiro':
                await carregarDadosFinanceiros();
                break;
            case 'tecnico':
                await carregarDadosTecnicos();
                break;
        }
        
        // Renderizar relatório
        renderizarRelatorio();
        
        // Atualizar histórico de relatórios
        atualizarHistoricoRelatorios();
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        document.getElementById('relatorio-conteudo').innerHTML = `
            <div class="report-error">
                <div class="report-icon error">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="report-message">
                    Erro ao gerar relatório. Por favor, tente novamente.
                </div>
                <div class="error-details">
                    ${error.message}
                </div>
            </div>
        `;
    } finally {
        hideSpinner();
    }
}

// Obter opções específicas para cada tipo de relatório
function obterOpcoesRelatorio(tipo) {
    const opcoes = {};
    
    switch (tipo) {
        case 'clientes':
            opcoes.todos = document.getElementById('cliente-todos').checked;
            opcoes.ativos = document.getElementById('cliente-ativos').checked;
            opcoes.inativos = document.getElementById('cliente-inativos').checked;
            opcoes.novos = document.getElementById('cliente-novos').checked;
            break;
            
        case 'servicos':
            opcoes.todos = document.getElementById('servico-todos').checked;
            opcoes.populares = document.getElementById('servico-populares').checked;
            opcoes.rentaveis = document.getElementById('servico-rentaveis').checked;
            opcoes.categoria = document.getElementById('servico-categoria').value;
            break;
            
        case 'ordens':
            opcoes.todas = document.getElementById('ordem-todas').checked;
            opcoes.abertas = document.getElementById('ordem-abertas').checked;
            opcoes.andamento = document.getElementById('ordem-andamento').checked;
            opcoes.concluidas = document.getElementById('ordem-concluidas').checked;
            opcoes.canceladas = document.getElementById('ordem-canceladas').checked;
            opcoes.garantia = document.getElementById('ordem-garantia').checked;
            opcoes.cliente = document.getElementById('ordem-cliente').value;
            break;
            
        case 'financeiro':
            opcoes.resumo = document.getElementById('financeiro-resumo').checked;
            opcoes.receitas = document.getElementById('financeiro-receitas').checked;
            opcoes.despesas = document.getElementById('financeiro-despesas').checked;
            opcoes.fluxo = document.getElementById('financeiro-fluxo').checked;
            opcoes.pendentes = document.getElementById('financeiro-pendentes').checked;
            opcoes.agrupamento = document.getElementById('financeiro-agrupamento').value;
            break;
            
        case 'tecnico':
            opcoes.todos = document.getElementById('tecnico-todos').checked;
            opcoes.produtividade = document.getElementById('tecnico-produtividade').checked;
            opcoes.tempoMedio = document.getElementById('tecnico-tempo-medio').checked;
            opcoes.faturamento = document.getElementById('tecnico-faturamento').checked;
            opcoes.tecnico = document.getElementById('tecnico-individual').value;
            break;
    }
    
    return opcoes;
}

// Carregar dados de clientes
async function carregarDadosClientes() {
    console.log("Carregando dados de clientes...");
    
    try {
        // Se já tivermos os dados em cache, não precisamos buscar novamente
        if (loadedData.clientes.length > 0) {
            currentReport.dados = loadedData.clientes;
            return;
        }
        
        const response = await fetch(`${SHEET_API}?sheet=Clientes`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Clientes):", response.status, response.statusText);
            throw new Error(`Erro ao buscar dados de clientes: ${response.status}`);
        }
        
        const clientes = await response.json();
        
        // Adicionar dados adicionais para o relatório
        const clientesProcessados = clientes.map(cliente => {
            // Converter data de cadastro para objeto Date
            let dataCadastro = null;
            if (cliente.Data_Cadastro) {
                const [dia, mes, ano] = cliente.Data_Cadastro.split('/');
                dataCadastro = new Date(ano, mes - 1, dia);
            }
            
            return {
                ...cliente,
                dataCadastroObj: dataCadastro
            };
        });
        
        // Armazenar no cache
        loadedData.clientes = clientesProcessados;
        currentReport.dados = clientesProcessados;
        
    } catch (error) {
        console.error('Erro ao carregar dados de clientes:', error);
        throw new Error('Não foi possível carregar os dados de clientes. Por favor, tente novamente.');
    }
}

// Carregar dados de serviços
async function carregarDadosServicos() {
    console.log("Carregando dados de serviços...");
    
    try {
        // Buscar dados de serviços
        if (loadedData.servicos.length > 0) {
            currentReport.dados = loadedData.servicos;
            return;
        }
        
        const [servicosResponse, ordensResponse] = await Promise.all([
            fetch(`${SHEET_API}?sheet=Servicos`),
            fetch(`${SHEET_API}?sheet=Ordens_Servico`)
        ]);
        
        if (!servicosResponse.ok || !ordensResponse.ok) {
            console.error("Erro na resposta da API (Serviços/Ordens):", 
                servicosResponse.status, ordensResponse.status);
            throw new Error(`Erro ao buscar dados de serviços: ${servicosResponse.status}`);
        }
        
        const servicos = await servicosResponse.json();
        const ordens = await ordensResponse.json();
        
        // Processar dados de serviços com estatísticas
        const servicosProcessados = servicos.map(servico => {
            // Filtrar ordens que contêm este serviço
            const ordensDoServico = ordens.filter(ordem => 
                ordem.Servicos && ordem.Servicos.includes(servico.ID)
            );
            
            // Calcular estatísticas
            const quantidade = ordensDoServico.length;
            const faturamentoTotal = ordensDoServico.reduce((total, ordem) => {
                return total + (parseFloat(ordem.Valor_Total) || 0);
            }, 0);
            
            // Contar serviços concluídos
            const concluidosCount = ordensDoServico.filter(ordem => 
                ordem.Status === 'Concluído'
            ).length;
            
            return {
                ...servico,
                quantidadeUsos: quantidade,
                faturamentoTotal,
                mediaValor: quantidade > 0 ? faturamentoTotal / quantidade : 0,
                taxaConclusao: quantidade > 0 ? (concluidosCount / quantidade) * 100 : 0
            };
        });
        
        // Armazenar no cache
        loadedData.servicos = servicosProcessados;
        currentReport.dados = servicosProcessados;
        
    } catch (error) {
        console.error('Erro ao carregar dados de serviços:', error);
        throw new Error('Não foi possível carregar os dados de serviços. Por favor, tente novamente.');
    }
}

// Carregar dados de ordens de serviço
async function carregarDadosOrdens() {
    console.log("Carregando dados de ordens de serviço...");
    
    try {
        // Verificar cache
        if (loadedData.ordens.length > 0) {
            currentReport.dados = filtrarOrdensPorPeriodo(loadedData.ordens);
            return;
        }
        
        // Buscar ordens, clientes e serviços em paralelo
        const [ordensResponse, clientesResponse, servicosResponse] = await Promise.all([
            fetch(`${SHEET_API}?sheet=Ordens_Servico`),
            fetch(`${SHEET_API}?sheet=Clientes`),
            fetch(`${SHEET_API}?sheet=Servicos`)
        ]);
        
        if (!ordensResponse.ok || !clientesResponse.ok || !servicosResponse.ok) {
            console.error("Erro na resposta da API (Ordens/Clientes/Serviços):", 
                ordensResponse.status, clientesResponse.status, servicosResponse.status);
            throw new Error(`Erro ao buscar dados de ordens: ${ordensResponse.status}`);
        }
        
        const ordens = await ordensResponse.json();
        const clientes = await clientesResponse.json();
        const servicos = await servicosResponse.json();
        
        // Criar mapas para lookup rápido
        const clientesMap = clientes.reduce((map, cliente) => {
            map[cliente.ID] = cliente;
            return map;
        }, {});
        
        const servicosMap = servicos.reduce((map, servico) => {
            map[servico.ID] = servico;
            return map;
        }, {});
        
        // Processar ordens com dados extras
        const ordensProcessadas = ordens.map(ordem => {
            // Converter datas para objetos Date
            let dataAbertura = null;
            let dataConclusao = null;
            
            if (ordem.Data_Abertura) {
                const [dia, mes, ano] = ordem.Data_Abertura.split('/');
                dataAbertura = new Date(ano, mes - 1, dia);
            }
            
            if (ordem.Data_Conclusao) {
                const [dia, mes, ano] = ordem.Data_Conclusao.split('/');
                dataConclusao = new Date(ano, mes - 1, dia);
            }
            
            // Calcular duração em dias
            const duracao = dataAbertura && dataConclusao 
                ? Math.round((dataConclusao - dataAbertura) / (1000 * 60 * 60 * 24)) 
                : null;
            
            // Obter dados do cliente
            const cliente = clientesMap[ordem.ID_Cliente] || {};
            
            // Expandir serviços
            const servicosIds = ordem.Servicos ? ordem.Servicos.split(',').map(id => id.trim()) : [];
            const servicosDetalhes = servicosIds.map(id => servicosMap[id] || { Nome: 'Serviço não encontrado' });
            
            // Verificar se está em garantia
            const emGarantia = verificarGarantia(ordem, servicosDetalhes);
            
            return {
                ...ordem,
                dataAberturaObj: dataAbertura,
                dataConclusaoObj: dataConclusao,
                duracaoDias: duracao,
                clienteNome: cliente.Nome || 'Cliente não encontrado',
                clienteTelefone: cliente.Telefone || '',
                servicosDetalhes,
                emGarantia
            };
        });
        
        // Armazenar no cache
        loadedData.ordens = ordensProcessadas;
        
        // Filtrar por período selecionado
        currentReport.dados = filtrarOrdensPorPeriodo(ordensProcessadas);
        
    } catch (error) {
        console.error('Erro ao carregar dados de ordens:', error);
        throw new Error('Não foi possível carregar os dados de ordens de serviço. Por favor, tente novamente.');
    }
}

// Filtrar ordens por período
function filtrarOrdensPorPeriodo(ordens) {
    return ordens.filter(ordem => {
        // Usar data de abertura como referência
        if (!ordem.dataAberturaObj) return false;
        
        return ordem.dataAberturaObj >= currentReport.dataInicio && 
               ordem.dataAberturaObj <= currentReport.dataFim;
    });
}

// Verificar se ordem está em garantia
function verificarGarantia(ordem, servicosDetalhes) {
    // Se não estiver concluída, não se aplica garantia
    if (ordem.Status !== 'Concluído' || !ordem.Data_Conclusao) return false;
    
    // Converter data de conclusão
    const [dia, mes, ano] = ordem.Data_Conclusao.split('/');
    const dataConclusao = new Date(ano, mes - 1, dia);
    
    // Obter maior período de garantia dos serviços
    const maiorGarantia = servicosDetalhes.reduce((max, servico) => {
        const garantiaDias = parseInt(servico.Garantia) || 0;
        return garantiaDias > max ? garantiaDias : max;
    }, 0);
    
    if (maiorGarantia <= 0) return false;
    
    // Calcular data final da garantia
    const dataFimGarantia = new Date(dataConclusao);
    dataFimGarantia.setDate(dataFimGarantia.getDate() + maiorGarantia);
    
    // Verificar se ainda está na garantia
    return dataFimGarantia >= new Date();
}

// Carregar dados financeiros
async function carregarDadosFinanceiros() {
    console.log("Carregando dados financeiros...");
    
    try {
        // Verificar cache
        if (loadedData.financeiro.length > 0) {
            currentReport.dados = filtrarTransacoesPorPeriodo(loadedData.financeiro);
            return;
        }
        
        const response = await fetch(`${SHEET_API}?sheet=Financeiro`);
        
        if (!response.ok) {
            console.error("Erro na resposta da API (Financeiro):", response.status, response.statusText);
            throw new Error(`Erro ao buscar dados financeiros: ${response.status}`);
        }
        
        const transacoes = await response.json();
        
        // Processar transações
        const transacoesProcessadas = transacoes.map(transacao => {
            // Converter data para objeto Date
            let dataTransacao = null;
            
            if (transacao.Data) {
                const [dia, mes, ano] = transacao.Data.split('/');
                dataTransacao = new Date(ano, mes - 1, dia);
            }
            
            // Converter valor para número
            const valor = parseFloat(transacao.Valor) || 0;
            
            return {
                ...transacao,
                dataObj: dataTransacao,
                valorNum: valor
            };
        });
        
        // Armazenar no cache
        loadedData.financeiro = transacoesProcessadas;
        
        // Filtrar por período
        currentReport.dados = filtrarTransacoesPorPeriodo(transacoesProcessadas);
        
    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        throw new Error('Não foi possível carregar os dados financeiros. Por favor, tente novamente.');
    }
}

// Filtrar transações por período
function filtrarTransacoesPorPeriodo(transacoes) {
    return transacoes.filter(transacao => {
        if (!transacao.dataObj) return false;
        
        return transacao.dataObj >= currentReport.dataInicio && 
               transacao.dataObj <= currentReport.dataFim;
    });
}

// Carregar dados de desempenho técnico
async function carregarDadosTecnicos() {
    console.log("Carregando dados de desempenho técnico...");
    
    try {
        // Verificar se já temos dados de ordens
        if (loadedData.ordens.length === 0) {
            await carregarDadosOrdens();
        }
        
        // Filtramos apenas as ordens do período selecionado
        const ordens = filtrarOrdensPorPeriodo(loadedData.ordens);
        
        // Agrupar ordens por técnico
        const tecnicoMap = {};
        
        ordens.forEach(ordem => {
            const tecnico = ordem.Tecnico || 'Não atribuído';
            
            if (!tecnicoMap[tecnico]) {
                tecnicoMap[tecnico] = {
                    nome: tecnico,
                    totalOrdens: 0,
                    ordensAbertas: 0,
                    ordensAndamento: 0,
                    ordensConcluidas: 0,
                    ordensCanceladas: 0,
                    faturamentoTotal: 0,
                    tempoMedioConclusao: 0,
                    totalDiasConclusao: 0,
                    ordens: []
                };
            }
            
            // Adicionar ordem à lista do técnico
            tecnicoMap[tecnico].ordens.push(ordem);
            tecnicoMap[tecnico].totalOrdens++;
            
            // Contar por status
            switch (ordem.Status) {
                case 'Aberto':
                    tecnicoMap[tecnico].ordensAbertas++;
                    break;
                case 'Em Andamento':
                    tecnicoMap[tecnico].ordensAndamento++;
                    break;
                case 'Concluído':
                    tecnicoMap[tecnico].ordensConcluidas++;
                    
                    // Calcular tempo de conclusão
                    if (ordem.duracaoDias !== null) {
                        tecnicoMap[tecnico].totalDiasConclusao += ordem.duracaoDias;
                    }
                    
                    // Adicionar ao faturamento
                    tecnicoMap[tecnico].faturamentoTotal += parseFloat(ordem.Valor_Total) || 0;
                    break;
                case 'Cancelado':
                    tecnicoMap[tecnico].ordensCanceladas++;
                    break;
            }
        });
        
        // Calcular tempo médio de conclusão
        Object.values(tecnicoMap).forEach(tecnico => {
            if (tecnico.ordensConcluidas > 0) {
                tecnico.tempoMedioConclusao = tecnico.totalDiasConclusao / tecnico.ordensConcluidas;
            }
        });
        
        // Converter para array
        const tecnicosArray = Object.values(tecnicoMap);
        
        currentReport.dados = tecnicosArray;
        
    } catch (error) {
        console.error('Erro ao carregar dados de desempenho técnico:', error);
        throw new Error('Não foi possível carregar os dados de desempenho técnico. Por favor, tente novamente.');
    }
}

// Renderizar relatório com base no tipo
function renderizarRelatorio() {
    const tipo = currentReport.tipo;
    const dados = currentReport.dados;
    const opcoes = currentReport.opcoes;
    
    if (!dados || dados.length === 0) {
        document.getElementById('relatorio-conteudo').innerHTML = `
            <div class="report-empty">
                <div class="report-icon">
                    <i class="fas fa-search"></i>
                </div>
                <div class="report-message">
                    Nenhum dado encontrado para o período selecionado.
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar com base no tipo
    switch (tipo) {
        case 'clientes':
            renderizarRelatorioClientes(dados, opcoes);
            break;
        case 'servicos':
            renderizarRelatorioServicos(dados, opcoes);
            break;
        case 'ordens':
            renderizarRelatorioOrdens(dados, opcoes);
            break;
        case 'financeiro':
            renderizarRelatorioFinanceiro(dados, opcoes);
            break;
        case 'tecnico':
            renderizarRelatorioTecnico(dados, opcoes);
            break;
    }
}

// Renderizar relatório de clientes
function renderizarRelatorioClientes(dados, opcoes) {
    console.log("Renderizando relatório de clientes", opcoes);
    
    // Filtrar dados de acordo com as opções
    let clientesFiltrados = [...dados];
    
    // Filtrar por status se não for "todos"
    if (!opcoes.todos) {
        if (opcoes.ativos && !opcoes.inativos) {
            clientesFiltrados = clientesFiltrados.filter(cliente => cliente.Situacao === 'Ativo');
        } else if (opcoes.inativos && !opcoes.ativos) {
            clientesFiltrados = clientesFiltrados.filter(cliente => cliente.Situacao === 'Inativo');
        }
    }
    
    // Filtrar novos clientes no período
    if (opcoes.novos) {
        clientesFiltrados = clientesFiltrados.filter(cliente => 
            cliente.dataCadastroObj && 
            cliente.dataCadastroObj >= currentReport.dataInicio &&
            cliente.dataCadastroObj <= currentReport.dataFim
        );
    }
    
    // Calcular estatísticas
    const totalClientes = clientesFiltrados.length;
    const clientesAtivos = clientesFiltrados.filter(c => c.Situacao === 'Ativo').length;
    const clientesInativos = clientesFiltrados.filter(c => c.Situacao === 'Inativo').length;
    const clientesNovos = clientesFiltrados.filter(c => 
        c.dataCadastroObj && 
        c.dataCadastroObj >= currentReport.dataInicio &&
        c.dataCadastroObj <= currentReport.dataFim
    ).length;
    
    // Formatar período para exibição
    const periodoTexto = formatarPeriodoTexto();
    
    // Renderizar relatório
    const relatorioHTML = `
        <div class="report-header-info">
            <div class="report-period">Período: ${periodoTexto}</div>
            <div class="report-summary">
                <div class="summary-item">
                    <span class="label">Total de Clientes:</span>
                    <span class="value">${totalClientes}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Ativos:</span>
                    <span class="value">${clientesAtivos} (${calcularPorcentagem(clientesAtivos, totalClientes)}%)</span>
                </div>
                <div class="summary-item">
                    <span class="label">Inativos:</span>
                    <span class="value">${clientesInativos} (${calcularPorcentagem(clientesInativos, totalClientes)}%)</span>
                </div>
                <div class="summary-item">
                    <span class="label">Novos no Período:</span>
                    <span class="value">${clientesNovos}</span>
                </div>
            </div>
        </div>
        
        <div class="report-chart-area">
            <div class="chart-container" id="chart-clientes-status"></div>
            <div class="chart-container" id="chart-clientes-novos"></div>
        </div>
        
        <div class="report-table-area">
            <div class="table-header">Lista de Clientes</div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>CPF/CNPJ</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Cidade/UF</th>
                        <th>Cadastro</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientesFiltrados.map(cliente => `
                        <tr>
                            <td>${cliente.ID || '-'}</td>
                            <td>${cliente.Nome || '-'}</td>
                            <td>${cliente.CPF_CNPJ || '-'}</td>
                            <td>${cliente.Telefone || '-'}</td>
                            <td>${cliente.Email || '-'}</td>
                            <td>${(cliente.Cidade && cliente.UF) ? `${cliente.Cidade}/${cliente.UF}` : '-'}</td>
                            <td>${cliente.Data_Cadastro || '-'}</td>
                            <td><span class="status ${cliente.Situacao === 'Ativo' ? 'active' : 'inactive'}">${cliente.Situacao || '-'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
    
    // Renderizar gráficos
    setTimeout(() => {
        renderizarGraficoStatusClientes(clientesFiltrados);
        renderizarGraficoNovosClientes(dados);
    }, 100);
}

// Renderizar gráfico de status de clientes
function renderizarGraficoStatusClientes(clientes) {
    const canvas = document.getElementById('chart-clientes-status');
    if (!canvas) return;
    
    const ativos = clientes.filter(c => c.Situacao === 'Ativo').length;
    const inativos = clientes.filter(c => c.Situacao === 'Inativo').length;
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.clientesStatus) {
        chartsInstances.clientesStatus.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.clientesStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ativos', 'Inativos'],
            datasets: [{
                data: [ativos, inativos],
                backgroundColor: ['#27ae60', '#e74c3c'],
                borderColor: ['#2ecc71', '#c0392b'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Clientes por Situação'
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Clientes por Situação', chartsInstances.clientesStatus);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar gráfico de novos clientes por mês
function renderizarGraficoNovosClientes(clientes) {
    const canvas = document.getElementById('chart-clientes-novos');
    if (!canvas) return;
    
    // Filtrar clientes com data de cadastro
    const clientesComData = clientes.filter(c => c.dataCadastroObj);
    
    // Agrupar por mês/ano
    const clientesPorMes = {};
    
    clientesComData.forEach(cliente => {
        const data = cliente.dataCadastroObj;
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (!clientesPorMes[mesAno]) {
            clientesPorMes[mesAno] = 0;
        }
        
        clientesPorMes[mesAno]++;
    });
    
    // Ordenar por data
    const labels = Object.keys(clientesPorMes).sort((a, b) => {
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        
        if (anoA !== anoB) return anoA - anoB;
        return mesA - mesB;
    });
    
    // Limitar aos últimos 12 meses
    const labelsLimitados = labels.slice(-12);
    const dadosLimitados = labelsLimitados.map(label => clientesPorMes[label]);
    
    // Formatar labels para exibição
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labelsFormatados = labelsLimitados.map(label => {
        const [mes, ano] = label.split('/').map(Number);
        return `${mesesNomes[mes - 1]}/${ano}`;
    });
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.clientesNovos) {
        chartsInstances.clientesNovos.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.clientesNovos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelsFormatados,
            datasets: [{
                label: 'Novos Clientes',
                data: dadosLimitados,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Novos Clientes por Mês'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Novos Clientes por Mês', chartsInstances.clientesNovos);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar relatório de serviços
function renderizarRelatorioServicos(dados, opcoes) {
    console.log("Renderizando relatório de serviços", opcoes);
    
    // Filtrar dados de acordo com as opções
    let servicosFiltrados = [...dados];
    
    // Filtrar por categoria
    if (opcoes.categoria) {
        servicosFiltrados = servicosFiltrados.filter(servico => servico.Categoria === opcoes.categoria);
    }
    
    // Ordenar serviços se necessário
    if (opcoes.populares) {
        servicosFiltrados.sort((a, b) => b.quantidadeUsos - a.quantidadeUsos);
    } else if (opcoes.rentaveis) {
        servicosFiltrados.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal);
    }
    
    // Calcular estatísticas
    const totalServicos = servicosFiltrados.length;
    const servicosAtivos = servicosFiltrados.filter(s => s.Situacao === 'Ativo').length;
    const servicosInativos = servicosFiltrados.filter(s => s.Situacao !== 'Ativo').length;
    const totalUsos = servicosFiltrados.reduce((sum, s) => sum + s.quantidadeUsos, 0);
    const faturamentoTotal = servicosFiltrados.reduce((sum, s) => sum + s.faturamentoTotal, 0);
    
    // Formatar período para exibição
    const periodoTexto = formatarPeriodoTexto();
    
    // Renderizar relatório
    const relatorioHTML = `
        <div class="report-header-info">
            <div class="report-period">Período: ${periodoTexto}</div>
            <div class="report-summary">
                <div class="summary-item">
                    <span class="label">Total de Serviços:</span>
                    <span class="value">${totalServicos}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Ativos:</span>
                    <span class="value">${servicosAtivos} (${calcularPorcentagem(servicosAtivos, totalServicos)}%)</span>
                </div>
                <div class="summary-item">
                    <span class="label">Total de Execuções:</span>
                    <span class="value">${totalUsos}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Faturamento Total:</span>
                    <span class="value">R$ ${faturamentoTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="report-chart-area">
            <div class="chart-container" id="chart-servicos-usos"></div>
            <div class="chart-container" id="chart-servicos-faturamento"></div>
        </div>
        
        <div class="report-table-area">
            <div class="table-header">Lista de Serviços</div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Preço (R$)</th>
                        <th>Garantia (dias)</th>
                        <th>Execuções</th>
                        <th>Faturamento (R$)</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicosFiltrados.map(servico => `
                        <tr>
                            <td>${servico.ID || '-'}</td>
                            <td>${servico.Nome || '-'}</td>
                            <td>${servico.Categoria || '-'}</td>
                            <td>${servico.Preco ? parseFloat(servico.Preco).toFixed(2) : '-'}</td>
                            <td>${servico.Garantia || '-'}</td>
                            <td>${servico.quantidadeUsos}</td>
                            <td>${servico.faturamentoTotal.toFixed(2)}</td>
                            <td><span class="status ${servico.Situacao === 'Ativo' ? 'active' : 'inactive'}">${servico.Situacao || '-'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
    
    // Renderizar gráficos
    setTimeout(() => {
        renderizarGraficoUsosServicos(servicosFiltrados);
        renderizarGraficoFaturamentoServicos(servicosFiltrados);
    }, 100);
}

// Renderizar gráfico de usos de serviços
function renderizarGraficoUsosServicos(servicos) {
    const canvas = document.getElementById('chart-servicos-usos');
    if (!canvas) return;
    
    // Ordenar por quantidade de usos e pegar os top 10
    const servicosOrdenados = [...servicos]
        .sort((a, b) => b.quantidadeUsos - a.quantidadeUsos)
        .slice(0, 10);
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.servicosUsos) {
        chartsInstances.servicosUsos.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.servicosUsos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: servicosOrdenados.map(s => s.Nome),
            datasets: [{
                label: 'Quantidade de Execuções',
                data: servicosOrdenados.map(s => s.quantidadeUsos),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Serviços Mais Executados (Top 10)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Serviços Mais Executados', chartsInstances.servicosUsos);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar gráfico de faturamento por serviço
function renderizarGraficoFaturamentoServicos(servicos) {
    const canvas = document.getElementById('chart-servicos-faturamento');
    if (!canvas) return;
    
    // Ordenar por faturamento e pegar os top 10
    const servicosOrdenados = [...servicos]
        .sort((a, b) => b.faturamentoTotal - a.faturamentoTotal)
        .slice(0, 10);
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.servicosFaturamento) {
        chartsInstances.servicosFaturamento.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.servicosFaturamento = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: servicosOrdenados.map(s => s.Nome),
            datasets: [{
                label: 'Faturamento (R$)',
                data: servicosOrdenados.map(s => s.faturamentoTotal),
                backgroundColor: '#27ae60',
                borderColor: '#2ecc71',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Serviços Mais Rentáveis (Top 10)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Serviços Mais Rentáveis', chartsInstances.servicosFaturamento);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar relatório de ordens de serviço
function renderizarRelatorioOrdens(dados, opcoes) {
    console.log("Renderizando relatório de ordens", opcoes);
    
    // Filtrar dados de acordo com as opções
    let ordensFiltradas = [...dados];
    
    // Filtrar por status
    if (!opcoes.todas) {
        const statusFiltros = [];
        
        if (opcoes.abertas) statusFiltros.push('Aberto');
        if (opcoes.andamento) statusFiltros.push('Em Andamento');
        if (opcoes.concluidas) statusFiltros.push('Concluído');
        if (opcoes.canceladas) statusFiltros.push('Cancelado');
        
        if (statusFiltros.length > 0) {
            ordensFiltradas = ordensFiltradas.filter(ordem => statusFiltros.includes(ordem.Status));
        }
    }
    
    // Filtrar por garantia
    if (opcoes.garantia) {
        ordensFiltradas = ordensFiltradas.filter(ordem => ordem.emGarantia);
    }
    
    // Filtrar por cliente
    if (opcoes.cliente) {
        ordensFiltradas = ordensFiltradas.filter(ordem => ordem.ID_Cliente === opcoes.cliente);
    }
    
    // Calcular estatísticas
    const totalOrdens = ordensFiltradas.length;
    const ordensAbertas = ordensFiltradas.filter(o => o.Status === 'Aberto').length;
    const ordensAndamento = ordensFiltradas.filter(o => o.Status === 'Em Andamento').length;
    const ordensConcluidas = ordensFiltradas.filter(o => o.Status === 'Concluído').length;
    const ordensCanceladas = ordensFiltradas.filter(o => o.Status === 'Cancelado').length;
    const ordensGarantia = ordensFiltradas.filter(o => o.emGarantia).length;
    
    // Calcular faturamento
    const faturamentoTotal = ordensFiltradas
        .filter(o => o.Status === 'Concluído')
        .reduce((sum, o) => sum + (parseFloat(o.Valor_Total) || 0), 0);
    
    // Calcular tempo médio de atendimento
    const ordensConcluidas2 = ordensFiltradas.filter(o => o.Status === 'Concluído' && o.duracaoDias !== null);
    const tempoMedioAtendimento = ordensConcluidas2.length > 0 
        ? ordensConcluidas2.reduce((sum, o) => sum + o.duracaoDias, 0) / ordensConcluidas2.length 
        : 0;
    
    // Formatar período para exibição
    const periodoTexto = formatarPeriodoTexto();
    
    // Renderizar relatório
    const relatorioHTML = `
        <div class="report-header-info">
            <div class="report-period">Período: ${periodoTexto}</div>
            <div class="report-summary">
                <div class="summary-item">
                    <span class="label">Total de Ordens:</span>
                    <span class="value">${totalOrdens}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Concluídas:</span>
                    <span class="value">${ordensConcluidas} (${calcularPorcentagem(ordensConcluidas, totalOrdens)}%)</span>
                </div>
                <div class="summary-item">
                    <span class="label">Em Andamento:</span>
                    <span class="value">${ordensAndamento} (${calcularPorcentagem(ordensAndamento, totalOrdens)}%)</span>
                </div>
                <div class="summary-item">
                    <span class="label">Tempo Médio:</span>
                    <span class="value">${tempoMedioAtendimento.toFixed(1)} dias</span>
                </div>
                <div class="summary-item">
                    <span class="label">Faturamento:</span>
                    <span class="value">R$ ${faturamentoTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="report-chart-area">
            <div class="chart-container" id="chart-ordens-status"></div>
            <div class="chart-container" id="chart-ordens-faturamento"></div>
        </div>
        
        <div class="report-table-area">
            <div class="table-header">Lista de Ordens de Serviço</div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Serviços</th>
                        <th>Abertura</th>
                        <th>Conclusão</th>
                        <th>Valor (R$)</th>
                        <th>Status</th>
                        <th>Garantia</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordensFiltradas.map(ordem => `
                        <tr>
                            <td>${ordem.ID || '-'}</td>
                            <td>${ordem.clienteNome || '-'}</td>
                            <td>${ordem.servicosDetalhes.map(s => s.Nome).join(', ') || '-'}</td>
                            <td>${ordem.Data_Abertura || '-'}</td>
                            <td>${ordem.Data_Conclusao || '-'}</td>
                            <td>${ordem.Valor_Total ? parseFloat(ordem.Valor_Total).toFixed(2) : '-'}</td>
                            <td><span class="status ${getStatusClass(ordem.Status)}">${ordem.Status || '-'}</span></td>
                            <td>${ordem.emGarantia ? '<span class="garantia-tag">Em Garantia</span>' : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
    
    // Renderizar gráficos
    setTimeout(() => {
        renderizarGraficoStatusOrdens(ordensFiltradas);
        renderizarGraficoFaturamentoMensal(ordensFiltradas);
    }, 100);
}

// Obter classe CSS para status
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

// Renderizar gráfico de status de ordens
function renderizarGraficoStatusOrdens(ordens) {
    const canvas = document.getElementById('chart-ordens-status');
    if (!canvas) return;
    
    // Contar ordens por status
    const abertas = ordens.filter(o => o.Status === 'Aberto').length;
    const andamento = ordens.filter(o => o.Status === 'Em Andamento').length;
    const concluidas = ordens.filter(o => o.Status === 'Concluído').length;
    const canceladas = ordens.filter(o => o.Status === 'Cancelado').length;
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.ordensStatus) {
        chartsInstances.ordensStatus.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.ordensStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Abertas', 'Em Andamento', 'Concluídas', 'Canceladas'],
            datasets: [{
                data: [abertas, andamento, concluidas, canceladas],
                backgroundColor: ['#3498db', '#f39c12', '#27ae60', '#e74c3c'],
                borderColor: ['#2980b9', '#d35400', '#2ecc71', '#c0392b'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Ordens por Status'
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Ordens por Status', chartsInstances.ordensStatus);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar gráfico de faturamento mensal
function renderizarGraficoFaturamentoMensal(ordens) {
    const canvas = document.getElementById('chart-ordens-faturamento');
    if (!canvas) return;
    
    // Filtrar ordens concluídas
    const ordensConcluidas = ordens.filter(o => o.Status === 'Concluído');
    
    // Agrupar por mês
    const faturamentoPorMes = {};
    const quantidadePorMes = {};
    
    ordensConcluidas.forEach(ordem => {
        if (!ordem.dataConclusaoObj) return;
        
        const mesAno = `${ordem.dataConclusaoObj.getMonth() + 1}/${ordem.dataConclusaoObj.getFullYear()}`;
        const valor = parseFloat(ordem.Valor_Total) || 0;
        
        if (!faturamentoPorMes[mesAno]) {
            faturamentoPorMes[mesAno] = 0;
            quantidadePorMes[mesAno] = 0;
        }
        
        faturamentoPorMes[mesAno] += valor;
        quantidadePorMes[mesAno]++;
    });
    
    // Ordenar por data
    const labels = Object.keys(faturamentoPorMes).sort((a, b) => {
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        
        if (anoA !== anoB) return anoA - anoB;
        return mesA - mesB;
    });
    
    // Limitar aos últimos 12 meses
    const labelsLimitados = labels.slice(-12);
    const faturamentoData = labelsLimitados.map(label => faturamentoPorMes[label]);
    const quantidadeData = labelsLimitados.map(label => quantidadePorMes[label]);
    
    // Formatar labels para exibição
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labelsFormatados = labelsLimitados.map(label => {
        const [mes, ano] = label.split('/').map(Number);
        return `${mesesNomes[mes - 1]}/${ano}`;
    });
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.ordensFaturamento) {
        chartsInstances.ordensFaturamento.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.ordensFaturamento = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelsFormatados,
            datasets: [{
                type: 'bar',
                label: 'Faturamento (R$)',
                data: faturamentoData,
                backgroundColor: '#27ae60',
                borderColor: '#2ecc71',
                borderWidth: 1,
                yAxisID: 'y'
            }, {
                type: 'line',
                label: 'Quantidade de Ordens',
                data: quantidadeData,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 2,
                pointBackgroundColor: '#3498db',
                pointRadius: 4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Faturamento Mensal'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Faturamento (R$)'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Quantidade'
                    },
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Faturamento Mensal', chartsInstances.ordensFaturamento);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar relatório financeiro
function renderizarRelatorioFinanceiro(dados, opcoes) {
    console.log("Renderizando relatório financeiro", opcoes);
    
    // Separar receitas e despesas
    const receitas = dados.filter(t => t.Tipo === 'Receita');
    const despesas = dados.filter(t => t.Tipo === 'Despesa');
    
    // Calcular totais
    const totalReceitas = receitas.reduce((sum, t) => sum + t.valorNum, 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valorNum, 0);
    const saldo = totalReceitas - totalDespesas;
    
    // Calcular pendentes
    const receitasPendentes = receitas
        .filter(t => t.Status === 'Pendente')
        .reduce((sum, t) => sum + t.valorNum, 0);
    
    const despesasPendentes = despesas
        .filter(t => t.Status === 'Pendente')
        .reduce((sum, t) => sum + t.valorNum, 0);
    
    // Formatar período para exibição
    const periodoTexto = formatarPeriodoTexto();
    
    // Construir HTML base do relatório
    let relatorioHTML = `
        <div class="report-header-info">
            <div class="report-period">Período: ${periodoTexto}</div>
            <div class="report-summary">
                <div class="summary-item">
                    <span class="label">Total de Receitas:</span>
                    <span class="value">R$ ${totalReceitas.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Total de Despesas:</span>
                    <span class="value">R$ ${totalDespesas.toFixed(2)}</span>
                </div>
                <div class="summary-item ${saldo >= 0 ? 'positive' : 'negative'}">
                    <span class="label">Saldo:</span>
                    <span class="value">R$ ${saldo.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Pendentes (Receitas):</span>
                    <span class="value">R$ ${receitasPendentes.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Pendentes (Despesas):</span>
                    <span class="value">R$ ${despesasPendentes.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="report-chart-area">
            <div class="chart-container" id="chart-financeiro-resumo"></div>
            <div class="chart-container" id="chart-financeiro-categorias"></div>
        </div>
    `;
    
    // Adicionar seções específicas com base nas opções
    if (opcoes.fluxo) {
        relatorioHTML += `
            <div class="report-section">
                <div class="section-header">Fluxo de Caixa</div>
                <div class="chart-container wide" id="chart-financeiro-fluxo"></div>
            </div>
        `;
    }
    
    // Adicionar tabelas específicas com base nas opções
    if (opcoes.receitas) {
        relatorioHTML += `
            <div class="report-table-area">
                <div class="table-header">Receitas</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Ordem Serviço</th>
                            <th>Valor (R$)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${receitas.map(receita => `
                            <tr>
                                <td>${receita.ID_Transacao || '-'}</td>
                                <td>${receita.Data || '-'}</td>
                                <td>${receita.Descricao || '-'}</td>
                                <td>${receita.Categoria || '-'}</td>
                                <td>${receita.ID_OS || '-'}</td>
                                <td>${receita.valorNum.toFixed(2)}</td>
                                <td><span class="status ${getTransacaoStatusClass(receita.Status)}">${receita.Status || '-'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (opcoes.despesas) {
        relatorioHTML += `
            <div class="report-table-area">
                <div class="table-header">Despesas</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor (R$)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${despesas.map(despesa => `
                            <tr>
                                <td>${despesa.ID_Transacao || '-'}</td>
                                <td>${despesa.Data || '-'}</td>
                                <td>${despesa.Descricao || '-'}</td>
                                <td>${despesa.Categoria || '-'}</td>
                                <td>${despesa.valorNum.toFixed(2)}</td>
                                <td><span class="status ${getTransacaoStatusClass(despesa.Status)}">${despesa.Status || '-'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (opcoes.pendentes) {
        const transacoesPendentes = dados.filter(t => t.Status === 'Pendente');
        
        relatorioHTML += `
            <div class="report-table-area">
                <div class="table-header">Pagamentos Pendentes</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transacoesPendentes.map(transacao => `
                            <tr>
                                <td>${transacao.ID_Transacao || '-'}</td>
                                <td>${transacao.Data || '-'}</td>
                                <td>${transacao.Tipo || '-'}</td>
                                <td>${transacao.Descricao || '-'}</td>
                                <td>${transacao.Categoria || '-'}</td>
                                <td>${transacao.valorNum.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
    
    // Renderizar gráficos
    setTimeout(() => {
        renderizarGraficoResumoFinanceiro(receitas, despesas);
        renderizarGraficoCategorias(receitas, despesas);
        
        if (opcoes.fluxo) {
            renderizarGraficoFluxoCaixa(dados, opcoes.agrupamento);
        }
    }, 100);
}

// Obter classe CSS para status de transação
function getTransacaoStatusClass(status) {
    switch (status) {
        case 'Pago':
            return 'active';
        case 'Pendente':
            return 'pending';
        case 'Cancelado':
            return 'inactive';
        default:
            return 'pending';
    }
}

// Renderizar gráfico de resumo financeiro
function renderizarGraficoResumoFinanceiro(receitas, despesas) {
    const canvas = document.getElementById('chart-financeiro-resumo');
    if (!canvas) return;
    
    // Calcular totais
    const totalReceitas = receitas.reduce((sum, t) => sum + t.valorNum, 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valorNum, 0);
    const saldo = totalReceitas - totalDespesas;
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.financeiroResumo) {
        chartsInstances.financeiroResumo.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.financeiroResumo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Receitas', 'Despesas', 'Saldo'],
            datasets: [{
                data: [totalReceitas, totalDespesas, saldo],
                backgroundColor: [
                    '#27ae60', // verde para receitas
                    '#e74c3c', // vermelho para despesas
                    saldo >= 0 ? '#3498db' : '#c0392b' // azul/vermelho escuro para saldo
                ],
                borderColor: [
                    '#2ecc71',
                    '#c0392b',
                    saldo >= 0 ? '#2980b9' : '#922b21'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Resumo Financeiro'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Resumo Financeiro', chartsInstances.financeiroResumo);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar gráfico de categorias
function renderizarGraficoCategorias(receitas, despesas) {
    const canvas = document.getElementById('chart-financeiro-categorias');
    if (!canvas) return;
    
    // Agrupar receitas por categoria
    const receitasPorCategoria = {};
    receitas.forEach(receita => {
        const categoria = receita.Categoria || 'Sem Categoria';
        if (!receitasPorCategoria[categoria]) {
            receitasPorCategoria[categoria] = 0;
        }
        receitasPorCategoria[categoria] += receita.valorNum;
    });
    
    // Agrupar despesas por categoria
    const despesasPorCategoria = {};
    despesas.forEach(despesa => {
        const categoria = despesa.Categoria || 'Sem Categoria';
        if (!despesasPorCategoria[categoria]) {
            despesasPorCategoria[categoria] = 0;
        }
        despesasPorCategoria[categoria] += despesa.valorNum;
    });
    
    // Ordenar categorias por valor
    const receitasCategorias = Object.entries(receitasPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const despesasCategorias = Object.entries(despesasPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.financeiroCategorias) {
        chartsInstances.financeiroCategorias.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.financeiroCategorias = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [...receitasCategorias.map(r => `${r[0]} (R)`), ...despesasCategorias.map(d => `${d[0]} (D)`)],
            datasets: [{
                data: [...receitasCategorias.map(r => r[1]), ...despesasCategorias.map(d => d[1])],
                backgroundColor: [
                    // Cores para receitas (tons de verde)
                    '#27ae60', '#2ecc71', '#45B39D', '#52BE80', '#58D68D',
                    // Cores para despesas (tons de vermelho)
                    '#e74c3c', '#c0392b', '#CD6155', '#EC7063', '#F1948A'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Principais Categorias'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            return `${label}: R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Principais Categorias', chartsInstances.financeiroCategorias);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar gráfico de fluxo de caixa
function renderizarGraficoFluxoCaixa(transacoes, agrupamento) {
    const canvas = document.getElementById('chart-financeiro-fluxo');
    if (!canvas) return;
    
    // Agrupar transações por período
    const receitasPorPeriodo = {};
    const despesasPorPeriodo = {};
    
    transacoes.forEach(transacao => {
        if (!transacao.dataObj) return;
        
        let periodo;
        
        // Definir o período de acordo com o agrupamento
        switch (agrupamento) {
            case 'dia':
                periodo = `${transacao.dataObj.getDate().toString().padStart(2, '0')}/${(transacao.dataObj.getMonth() + 1).toString().padStart(2, '0')}/${transacao.dataObj.getFullYear()}`;
                break;
            case 'semana':
                // Calcular o número da semana no ano
                const primeiroDiaAno = new Date(transacao.dataObj.getFullYear(), 0, 1);
                const diasDesdeInicio = Math.floor((transacao.dataObj - primeiroDiaAno) / (24 * 60 * 60 * 1000));
                const semana = Math.ceil((diasDesdeInicio + primeiroDiaAno.getDay() + 1) / 7);
                periodo = `Sem ${semana} - ${transacao.dataObj.getFullYear()}`;
                break;
            case 'mes':
                periodo = `${(transacao.dataObj.getMonth() + 1).toString().padStart(2, '0')}/${transacao.dataObj.getFullYear()}`;
                break;
            case 'categoria':
                periodo = transacao.Categoria || 'Sem Categoria';
                break;
        }
        
        // Inicializar período se não existir
        if (!receitasPorPeriodo[periodo]) receitasPorPeriodo[periodo] = 0;
        if (!despesasPorPeriodo[periodo]) despesasPorPeriodo[periodo] = 0;
        
        // Adicionar valor ao período correspondente
        if (transacao.Tipo === 'Receita') {
            receitasPorPeriodo[periodo] += transacao.valorNum;
        } else {
            despesasPorPeriodo[periodo] += transacao.valorNum;
        }
    });
    
    // Ordenar períodos
    let periodos = Object.keys(receitasPorPeriodo);
    
    if (agrupamento !== 'categoria') {
        periodos.sort((a, b) => {
            if (agrupamento === 'dia') {
                const [diaA, mesA, anoA] = a.split('/').map(Number);
                const [diaB, mesB, anoB] = b.split('/').map(Number);
                
                if (anoA !== anoB) return anoA - anoB;
                if (mesA !== mesB) return mesA - mesB;
                return diaA - diaB;
            } else if (agrupamento === 'semana') {
                const [, semanaA, anoA] = a.match(/Sem (\d+) - (\d+)/).map(Number);
                const [, semanaB, anoB] = b.match(/Sem (\d+) - (\d+)/).map(Number);
                
                if (anoA !== anoB) return anoA - anoB;
                return semanaA - semanaB;
            } else {
                const [mesA, anoA] = a.split('/').map(Number);
                const [mesB, anoB] = b.split('/').map(Number);
                
                if (anoA !== anoB) return anoA - anoB;
                return mesA - mesB;
            }
        });
    } else {
        // Para categorias, ordenar por valor total (receitas + despesas)
        periodos.sort((a, b) => {
            const totalA = (receitasPorPeriodo[a] || 0) + (despesasPorPeriodo[a] || 0);
            const totalB = (receitasPorPeriodo[b] || 0) + (despesasPorPeriodo[b] || 0);
            return totalB - totalA;
        });
    }
    
    // Limitar a quantidade de períodos exibidos
    const maxPeriodos = 12;
    if (periodos.length > maxPeriodos) {
        periodos = periodos.slice(0, maxPeriodos);
    }
    
    // Preparar dados para o gráfico
    const receitasData = periodos.map(p => receitasPorPeriodo[p] || 0);
    const despesasData = periodos.map(p => despesasPorPeriodo[p] || 0);
    const saldoData = periodos.map((p, i) => receitasData[i] - despesasData[i]);
    
    // Formatar labels para exibição
    let labelsFormatados = periodos;
    
    if (agrupamento === 'mes') {
        const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        labelsFormatados = periodos.map(p => {
            const [mes, ano] = p.split('/').map(Number);
            return `${mesesNomes[mes - 1]}/${ano}`;
        });
    }
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.financeiroFluxo) {
        chartsInstances.financeiroFluxo.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.financeiroFluxo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelsFormatados,
            datasets: [{
                type: 'bar',
                label: 'Receitas',
                data: receitasData,
                backgroundColor: '#27ae60',
                borderColor: '#2ecc71',
                borderWidth: 1,
                order: 2
            }, {
                type: 'bar',
                label: 'Despesas',
                data: despesasData,
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1,
                order: 3
            }, {
                type: 'line',
                label: 'Saldo',
                data: saldoData,
                borderColor: '#3498db',
                borderWidth: 2,
                pointBackgroundColor: '#3498db',
                fill: false,
                tension: 0.1,
                order: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Fluxo de Caixa (Agrupado por ${
                        agrupamento === 'dia' ? 'Dia' : 
                        agrupamento === 'semana' ? 'Semana' : 
                        agrupamento === 'mes' ? 'Mês' : 'Categoria'
                    })`
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Fluxo de Caixa', chartsInstances.financeiroFluxo);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar relatório de desempenho técnico
function renderizarRelatorioTecnico(dados, opcoes) {
    console.log("Renderizando relatório de desempenho técnico", opcoes);
    
    // Filtrar dados de acordo com as opções
    let tecnicosFiltrados = [...dados];
    
    // Filtrar por técnico específico
    if (opcoes.tecnico) {
        tecnicosFiltrados = tecnicosFiltrados.filter(t => t.nome === opcoes.tecnico);
    }
    
    // Ordenar técnicos por produtividade (ordens concluídas)
    if (opcoes.produtividade) {
        tecnicosFiltrados.sort((a, b) => b.ordensConcluidas - a.ordensConcluidas);
    }
    
    // Formatar período para exibição
    const periodoTexto = formatarPeriodoTexto();
    
    // Calcular estatísticas gerais
    const totalTecnicos = tecnicosFiltrados.length;
    const totalOrdens = tecnicosFiltrados.reduce((sum, t) => sum + t.totalOrdens, 0);
    const totalConcluidas = tecnicosFiltrados.reduce((sum, t) => sum + t.ordensConcluidas, 0);
    const faturamentoTotal = tecnicosFiltrados.reduce((sum, t) => sum + t.faturamentoTotal, 0);
    
    // Calcular tempo médio geral
    const tempoMedioGeral = tecnicosFiltrados.reduce((sum, t) => {
        return t.ordensConcluidas > 0 ? sum + (t.tempoMedioConclusao * t.ordensConcluidas) : sum;
    }, 0) / (totalConcluidas || 1);
    
    // Renderizar relatório
    const relatorioHTML = `
        <div class="report-header-info">
            <div class="report-period">Período: ${periodoTexto}</div>
            <div class="report-summary">
                <div class="summary-item">
                    <span class="label">Total de Técnicos:</span>
                    <span class="value">${totalTecnicos}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Total de Ordens:</span>
                    <span class="value">${totalOrdens}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Ordens Concluídas:</span>
                    <span class="value">${totalConcluidas} (${calcularPorcentagem(totalConcluidas, totalOrdens)}%)</span>
                </div>
                <div class="summary-item">
                    <span class="label">Faturamento Total:</span>
                    <span class="value">R$ ${faturamentoTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="report-chart-area">
            <div class="chart-container" id="chart-tecnicos-ordens"></div>
            <div class="chart-container" id="chart-tecnicos-tempo"></div>
        </div>
        
        <div class="report-table-area">
            <div class="table-header">Desempenho por Técnico</div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Técnico</th>
                        <th>Ordens Totais</th>
                        <th>Em Andamento</th>
                        <th>Concluídas</th>
                        <th>Tempo Médio (dias)</th>
                        <th>Faturamento (R$)</th>
                        <th>Taxa de Conclusão</th>
                    </tr>
                </thead>
                <tbody>
                    ${tecnicosFiltrados.map(tecnico => `
                        <tr>
                            <td>${tecnico.nome}</td>
                            <td>${tecnico.totalOrdens}</td>
                            <td>${tecnico.ordensAndamento}</td>
                            <td>${tecnico.ordensConcluidas}</td>
                            <td>${tecnico.tempoMedioConclusao.toFixed(1)}</td>
                            <td>${tecnico.faturamentoTotal.toFixed(2)}</td>
                            <td>${tecnico.totalOrdens > 0 ? calcularPorcentagem(tecnico.ordensConcluidas, tecnico.totalOrdens) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
    
    // Renderizar gráficos
    setTimeout(() => {
        renderizarGraficoOrdensPorTecnico(tecnicosFiltrados);
        renderizarGraficoTempoMedioPorTecnico(tecnicosFiltrados);
    }, 100);
}

// Renderizar gráfico de ordens por técnico
function renderizarGraficoOrdensPorTecnico(tecnicos) {
    const canvas = document.getElementById('chart-tecnicos-ordens');
    if (!canvas) return;
    
    // Ordenar técnicos por ordens concluídas
    const tecnicosOrdenados = [...tecnicos]
        .sort((a, b) => b.ordensConcluidas - a.ordensConcluidas);
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.tecnicosOrdens) {
        chartsInstances.tecnicosOrdens.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.tecnicosOrdens = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tecnicosOrdenados.map(t => t.nome),
            datasets: [{
                label: 'Em Andamento',
                data: tecnicosOrdenados.map(t => t.ordensAndamento),
                backgroundColor: '#f39c12',
                borderColor: '#d35400',
                borderWidth: 1
            }, {
                label: 'Concluídas',
                data: tecnicosOrdenados.map(t => t.ordensConcluidas),
                backgroundColor: '#27ae60',
                borderColor: '#2ecc71',
                borderWidth: 1
            }, {
                label: 'Canceladas',
                data: tecnicosOrdenados.map(t => t.ordensCanceladas),
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Ordens por Técnico'
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Ordens por Técnico', chartsInstances.tecnicosOrdens);
    });
    
    canvas.appendChild(detailBtn);
}

// Renderizar gráfico de tempo médio por técnico
function renderizarGraficoTempoMedioPorTecnico(tecnicos) {
    const canvas = document.getElementById('chart-tecnicos-tempo');
    if (!canvas) return;
    
    // Filtrar técnicos com ordens concluídas
    const tecnicosComConclusao = tecnicos.filter(t => t.ordensConcluidas > 0);
    
    // Ordenar por tempo médio (menor para maior)
    const tecnicosOrdenados = [...tecnicosComConclusao]
        .sort((a, b) => a.tempoMedioConclusao - b.tempoMedioConclusao);
    
    const ctx = document.createElement('canvas');
    canvas.appendChild(ctx);
    
    // Destruir gráfico anterior se existir
    if (chartsInstances.tecnicosTempo) {
        chartsInstances.tecnicosTempo.destroy();
    }
    
    // Criar novo gráfico
    chartsInstances.tecnicosTempo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tecnicosOrdenados.map(t => t.nome),
            datasets: [{
                label: 'Tempo Médio (dias)',
                data: tecnicosOrdenados.map(t => t.tempoMedioConclusao),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Tempo Médio de Conclusão'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Dias'
                    }
                }
            }
        }
    });
    
    // Adicionar botão para visualizar em detalhes
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.innerHTML = '<i class="fas fa-search-plus"></i> Ampliar';
    detailBtn.addEventListener('click', () => {
        abrirModalGrafico('Tempo Médio de Conclusão', chartsInstances.tecnicosTempo);
    });
    
    canvas.appendChild(detailBtn);
}

// Abrir modal para visualização ampliada de gráfico
function abrirModalGrafico(titulo, chart) {
    // Definir título
    document.getElementById('grafico-modal-title').textContent = titulo;
    
    // Exibir modal
    document.getElementById('grafico-modal').style.display = 'flex';
    
    // Obter canvas do modal
    const canvas = document.getElementById('grafico-canvas');
    
    // Recriar gráfico no modal
    if (chartsInstances.modalChart) {
        chartsInstances.modalChart.destroy();
    }
    
    // Clonar configuração do gráfico original
    const config = {
        type: chart.config.type,
        data: JSON.parse(JSON.stringify(chart.config.data)),
        options: JSON.parse(JSON.stringify(chart.config.options))
    };
    
    // Ajustar opções para o modal
    config.options.responsive = true;
    config.options.maintainAspectRatio = false;
    
    // Criar novo gráfico no modal
    chartsInstances.modalChart = new Chart(canvas, config);
}

// Função para imprimir relatório
function imprimirRelatorio() {
    window.print();
}

// Função para exportar para PDF
function exportarPDF() {
    console.log("Exportando para PDF...");
    
    try {
        // Verificar se a biblioteca jsPDF está disponível
        if (typeof jspdf === 'undefined') {
            showAlert('Biblioteca PDF não encontrada. Por favor, verifique a conexão com a internet.', 'danger');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        
        // Criar novo documento PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Adicionar título
        const titulo = document.getElementById('relatorio-titulo').textContent;
        doc.setFontSize(18);
        doc.text(titulo, pageWidth / 2, 20, { align: 'center' });
        
        // Adicionar período
        const periodoTexto = document.querySelector('.report-period').textContent;
        doc.setFontSize(12);
        doc.text(periodoTexto, pageWidth / 2, 30, { align: 'center' });
        
        // Capturar gráficos
        const chartContainers = document.querySelectorAll('.chart-container');
        let yPos = 40;
        
        // Função para adicionar nova página
        const addPage = () => {
            doc.addPage();
            yPos = 20;
        };
        
        // Adicionar gráficos
        chartContainers.forEach((container, index) => {
            const canvas = container.querySelector('canvas');
            if (!canvas) return;
            
            // Verificar se precisa de nova página
            if (yPos > pageHeight - 60) {
                addPage();
            }
            
            // Capturar imagem do gráfico
            const imgData = canvas.toDataURL('image/png');
            
            // Calcular dimensões
            const imgWidth = pageWidth - 40;
            const imgHeight = 70;
            
            // Adicionar imagem ao PDF
            doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
        });
        
        // Adicionar tabelas
        const tableAreas = document.querySelectorAll('.report-table-area');
        
        tableAreas.forEach((tableArea) => {
            // Verificar se precisa de nova página
            if (yPos > pageHeight - 60) {
                addPage();
            }
            
            // Adicionar título da tabela
            const tableTitle = tableArea.querySelector('.table-header').textContent;
            doc.setFontSize(14);
            doc.text(tableTitle, 20, yPos);
            yPos += 10;
            
            // Processar tabela
            const table = tableArea.querySelector('.report-table');
            const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent);
            
            // Obter dados das linhas
            const data = [...table.querySelectorAll('tbody tr')].map(tr => 
                [...tr.querySelectorAll('td')].map(td => td.textContent.replace(/\s+/g, ' ').trim())
            );
            
            // Adicionar tabela ao PDF
            doc.autoTable({
                head: [headers],
                body: data,
                startY: yPos,
                margin: { left: 20, right: 20 },
                columnStyles: {
                    // Ajustar largura das colunas conforme necessário
                },
                didDrawPage: (data) => {
                    yPos = data.cursor.y + 10;
                }
            });
        });
        
        // Salvar PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${titulo.replace(/\s+/g, '_')}_${timestamp}.pdf`;
        doc.save(fileName);
        
        showAlert('Relatório exportado para PDF com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar para PDF:', error);
        showAlert('Erro ao exportar para PDF. Por favor, tente novamente.', 'danger');
    }
}

// Função para exportar para Excel
function exportarExcel() {
    console.log("Exportando para Excel...");
    
    try {
        // Verificar se a biblioteca XLSX está disponível
        if (typeof XLSX === 'undefined') {
            showAlert('Biblioteca Excel não encontrada. Por favor, verifique a conexão com a internet.', 'danger');
            return;
        }
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        const titulo = document.getElementById('relatorio-titulo').textContent;
        
        // Processar tabelas
        const tableAreas = document.querySelectorAll('.report-table-area');
        
        tableAreas.forEach((tableArea, index) => {
            const tableTitle = tableArea.querySelector('.table-header').textContent;
            const table = tableArea.querySelector('.report-table');
            
            // Obter cabeçalhos
            const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent);
            
            // Obter dados das linhas
            const data = [...table.querySelectorAll('tbody tr')].map(tr => 
                [...tr.querySelectorAll('td')].map(td => td.textContent.replace(/\s+/g, ' ').trim())
            );
            
            // Adicionar cabeçalhos aos dados
            const sheetData = [headers, ...data];
            
            // Criar worksheet
            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            
            // Adicionar worksheet ao workbook
            const sheetName = tableTitle.replace(/[^\w\s]/gi, '').substring(0, 30) || `Sheet${index + 1}`;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        // Adicionar folha com resumo
        const summaryItems = document.querySelectorAll('.report-summary .summary-item');
        const summaryData = [['Métrica', 'Valor']];
        summaryItems.forEach(item => {
            const label = item.querySelector('.label').textContent.replace(':', '');
            const value = item.querySelector('.value').textContent;
            summaryData.push([label, value]);
        });
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
        
        // Salvar arquivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${titulo.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showAlert('Relatório exportado para Excel com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        showAlert('Erro ao exportar para Excel. Por favor, tente novamente.', 'danger');
    }
}

// Função para exportar gráfico
function exportarGrafico() {
    console.log("Exportando gráfico...");
    
    try {
        // Verificar se há gráfico no modal
        const canvas = document.getElementById('grafico-canvas');
        if (!canvas || !chartsInstances.modalChart) {
            showAlert('Nenhum gráfico para exportar.', 'warning');
            return;
        }
        
        // Obter título do gráfico
        const titulo = document.getElementById('grafico-modal-title').textContent;
        
        // Converter para imagem
        const imgData = canvas.toDataURL('image/png');
        
        // Criar link para download
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${titulo.replace(/\s+/g, '_')}_${timestamp}.png`;
        
        link.href = imgData;
        link.download = fileName;
        link.click();
        
        showAlert('Gráfico exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar gráfico:', error);
        showAlert('Erro ao exportar gráfico. Por favor, tente novamente.', 'danger');
    }
}

// Função para atualizar histórico de relatórios
function atualizarHistoricoRelatorios() {
    // Obter histórico atual ou inicializar
    let historico = JSON.parse(localStorage.getItem('relatoriosHistorico') || '[]');
    
    // Limitar tamanho do histórico
    const maxHistorico = 10;
    if (historico.length >= maxHistorico) {
        historico = historico.slice(0, maxHistorico - 1);
    }
    
    // Criar novo item no histórico
    const novoItem = {
        tipo: currentReport.tipo,
        titulo: document.getElementById('relatorio-titulo').textContent,
        data: new Date().toISOString(),
        periodo: currentReport.periodo,
        dataInicio: currentReport.dataInicio.toISOString(),
        dataFim: currentReport.dataFim.toISOString(),
        opcoes: currentReport.opcoes
    };
    
    // Adicionar ao início do histórico
    historico.unshift(novoItem);
    
    // Salvar no localStorage
    localStorage.setItem('relatoriosHistorico', JSON.stringify(historico));
}

// Formatar período para exibição
function formatarPeriodoTexto() {
    const dataInicio = currentReport.dataInicio;
    const dataFim = currentReport.dataFim;
    
    const formatarData = (data) => {
        return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
    };
    
    const inicioStr = formatarData(dataInicio);
    const fimStr = formatarData(dataFim);
    
    return `${inicioStr} a ${fimStr}`;
}

// Calcular porcentagem
function calcularPorcentagem(valor, total) {
    if (!total) return 0;
    return Math.round((valor / total) * 100);
}