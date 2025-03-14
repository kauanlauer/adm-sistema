  // API SheetDB
  const SHEET_API = 'https://sheetdb.io/api/v1/1pmr4zebtewm5';
        
  // Configurações
  const itemsPerPage = 10;
  let currentPage = 1;
  let totalPages = 1;
  let clientesData = [];
  let filteredClientes = [];
  
  // Elementos DOM
  const clientesTableBody = document.getElementById('clientes-table-body');
  const pagination = document.getElementById('pagination');
  const spinner = document.getElementById('spinner');
  const alertContainer = document.getElementById('alert-container');
  const clienteModal = document.getElementById('cliente-modal');
  const modalTitle = document.getElementById('modal-title');
  const clienteForm = document.getElementById('cliente-form');
  
  // Funções de utilidade
  function showSpinner() {
      spinner.classList.add('active');
  }
  
  function hideSpinner() {
      spinner.classList.remove('active');
  }
  
  function showAlert(message, type = 'info') {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.textContent = message;
      
      alertContainer.innerHTML = '';
      alertContainer.appendChild(alert);
      
      // Remover o alerta após 5 segundos
      setTimeout(() => {
          alert.remove();
      }, 5000);
  }
  
  function openModal(title = 'Novo Cliente') {
      modalTitle.textContent = title;
      clienteModal.classList.add('active');
  }
  
  function closeModal() {
      clienteModal.classList.remove('active');
  }
  
  // Formatação de CPF/CNPJ
  function formatCpfCnpj(value) {
      if (!value) return '';
      
      // Remover caracteres não numéricos
      const digits = value.replace(/\D/g, '');
      
      // Verificar se é CPF ou CNPJ
      if (digits.length <= 11) {
          // CPF: 000.000.000-00
          return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else {
          // CNPJ: 00.000.000/0000-00
          return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
  }
  
  // Formatação de telefone
  function formatTelefone(value) {
      if (!value) return '';
      
      // Remover caracteres não numéricos
      const digits = value.replace(/\D/g, '');
      
      if (digits.length === 11) {
          // Celular: (00) 00000-0000
          return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (digits.length === 10) {
          // Fixo: (00) 0000-0000
          return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
          return value;
      }
  }
  
  // Formatação de CEP
  function formatCep(value) {
      if (!value) return '';
      
      // Remover caracteres não numéricos
      const digits = value.replace(/\D/g, '');
      
      // CEP: 00000-000
      return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  // API
  class ClientesAPI {
      constructor(apiUrl) {
          this.apiUrl = apiUrl;
      }
      
      // Buscar todos os clientes
      async getClientes() {
          try {
              showSpinner();
              const response = await fetch(`${this.apiUrl}?sheet=Clientes`);
              
              if (!response.ok) {
                  throw new Error(`Erro ao buscar clientes: ${response.status}`);
              }
              
              return await response.json();
          } catch (error) {
              console.error('Erro na API:', error);
              showAlert('Erro ao carregar clientes. Por favor, tente novamente.', 'danger');
              throw error;
          } finally {
              hideSpinner();
          }
      }
      
      // Buscar cliente por ID
      async getClienteById(id) {
          try {
              showSpinner();
              const response = await fetch(`${this.apiUrl}/search?sheet=Clientes&ID=${id}`);
              
              if (!response.ok) {
                  throw new Error(`Erro ao buscar cliente: ${response.status}`);
              }
              
              const data = await response.json();
              return data.length > 0 ? data[0] : null;
          } catch (error) {
              console.error('Erro na API:', error);
              showAlert('Erro ao carregar dados do cliente. Por favor, tente novamente.', 'danger');
              throw error;
          } finally {
              hideSpinner();
          }
      }
      
      // Adicionar novo cliente
      async addCliente(cliente) {
          try {
              showSpinner();
              
              // Gerar ID
              const clientes = await this.getClientes();
              const lastId = clientes.length > 0 
                  ? Math.max(...clientes.map(c => parseInt(c.ID.replace('CL', ''))))
                  : 0;
              
              cliente.ID = `CL${String(lastId + 1).padStart(4, '0')}`;
              
              // Definir data de cadastro
              const now = new Date();
              cliente.Data_Cadastro = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
              
              const response = await fetch(`${this.apiUrl}?sheet=Clientes`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ data: [cliente] })
              });
              
              if (!response.ok) {
                  throw new Error(`Erro ao adicionar cliente: ${response.status}`);
              }
              
              return await response.json();
          } catch (error) {
              console.error('Erro na API:', error);
              showAlert('Erro ao adicionar cliente. Por favor, tente novamente.', 'danger');
              throw error;
          } finally {
              hideSpinner();
          }
      }
      
      // Atualizar cliente existente
      async updateCliente(id, cliente) {
          try {
              showSpinner();
              
              const response = await fetch(`${this.apiUrl}/ID/${id}?sheet=Clientes`, {
                  method: 'PATCH',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ data: cliente })
              });
              
              if (!response.ok) {
                  throw new Error(`Erro ao atualizar cliente: ${response.status}`);
              }
              
              return await response.json();
          } catch (error) {
              console.error('Erro na API:', error);
              showAlert('Erro ao atualizar cliente. Por favor, tente novamente.', 'danger');
              throw error;
          } finally {
              hideSpinner();
          }
      }
      
      // Excluir cliente
      async deleteCliente(id) {
          try {
              showSpinner();
              
              const response = await fetch(`${this.apiUrl}/ID/${id}?sheet=Clientes`, {
                  method: 'DELETE'
              });
              
              if (!response.ok) {
                  throw new Error(`Erro ao excluir cliente: ${response.status}`);
              }
              
              return await response.json();
          } catch (error) {
              console.error('Erro na API:', error);
              showAlert('Erro ao excluir cliente. Por favor, tente novamente.', 'danger');
              throw error;
          } finally {
              hideSpinner();
          }
      }
      
      // Buscar clientes por termo
      async searchClientes(term) {
          try {
              const clientes = await this.getClientes();
              
              if (!term) return clientes;
              
              term = term.toLowerCase();
              
              return clientes.filter(cliente => 
                  (cliente.Nome && cliente.Nome.toLowerCase().includes(term)) ||
                  (cliente.CPF_CNPJ && cliente.CPF_CNPJ.toLowerCase().includes(term)) ||
                  (cliente.Email && cliente.Email.toLowerCase().includes(term)) ||
                  (cliente.Telefone && cliente.Telefone.toLowerCase().includes(term))
              );
          } catch (error) {
              console.error('Erro ao buscar clientes:', error);
              showAlert('Erro ao buscar clientes. Por favor, tente novamente.', 'danger');
              throw error;
          }
      }
  }
  
  // Instância da API
  const clientesAPI = new ClientesAPI(SHEET_API);
  
  // Funções de renderização e interação
  
  // Renderizar tabela de clientes
  function renderClientes(clientes, page = 1) {
      clientesTableBody.innerHTML = '';
      
      if (!clientes || clientes.length === 0) {
          clientesTableBody.innerHTML = `
              <tr>
                  <td colspan="8" class="text-center">Nenhum cliente encontrado</td>
              </tr>
          `;
          pagination.innerHTML = '';
          return;
      }
      
      // Calcular paginação
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedClientes = clientes.slice(startIndex, endIndex);
      
      totalPages = Math.ceil(clientes.length / itemsPerPage);
      
      // Renderizar clientes
      paginatedClientes.forEach(cliente => {
          const situacaoClass = cliente.Situacao === 'Ativo' ? 'active' : 'inactive';
          
          clientesTableBody.innerHTML += `
              <tr>
                  <td>${cliente.ID}</td>
                  <td>${cliente.Nome || ''}</td>
                  <td>${cliente.CPF_CNPJ || ''}</td>
                  <td>${cliente.Telefone || ''}</td>
                  <td>${cliente.Email || ''}</td>
                  <td>${cliente.Cidade ? `${cliente.Cidade}/${cliente.Estado || ''}` : ''}</td>
                  <td><span class="status-badge ${situacaoClass}">${cliente.Situacao || 'Ativo'}</span></td>
                  <td class="action-buttons">
                      <button class="btn-icon edit" data-id="${cliente.ID}" title="Editar">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon delete" data-id="${cliente.ID}" title="Excluir">
                          <i class="fas fa-trash"></i>
                      </button>
                  </td>
              </tr>
          `;
      });
      
      // Adicionar event listeners
      document.querySelectorAll('.btn-icon.edit').forEach(btn => {
          btn.addEventListener('click', () => editarCliente(btn.dataset.id));
      });
      
      document.querySelectorAll('.btn-icon.delete').forEach(btn => {
          btn.addEventListener('click', () => confirmarExclusao(btn.dataset.id));
      });
      
      // Renderizar paginação
      renderPagination(currentPage, totalPages);
  }
  
  // Renderizar paginação
  function renderPagination(currentPage, totalPages) {
      pagination.innerHTML = '';
      
      if (totalPages <= 1) return;
      
      // Botão anterior
      const prevButton = document.createElement('div');
      prevButton.className = 'pagination-item';
      prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
      prevButton.addEventListener('click', () => {
          if (currentPage > 1) {
              goToPage(currentPage - 1);
          }
      });
      
      // Adicionar botão anterior se não estiver na primeira página
      if (currentPage > 1) {
          pagination.appendChild(prevButton);
      }
      
      // Determinar o intervalo de páginas a serem exibidas
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      
      // Ajustar o intervalo se necessário
      if (endPage - startPage < 4) {
          startPage = Math.max(1, endPage - 4);
      }
      
      // Botões de página
      for (let i = startPage; i <= endPage; i++) {
          const pageButton = document.createElement('div');
          pageButton.className = `pagination-item ${i === currentPage ? 'active' : ''}`;
          pageButton.textContent = i;
          pageButton.addEventListener('click', () => goToPage(i));
          pagination.appendChild(pageButton);
      }
      
      // Botão próximo
      const nextButton = document.createElement('div');
      nextButton.className = 'pagination-item';
      nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
      nextButton.addEventListener('click', () => {
          if (currentPage < totalPages) {
              goToPage(currentPage + 1);
          }
      });
      
      // Adicionar botão próximo se não estiver na última página
      if (currentPage < totalPages) {
          pagination.appendChild(nextButton);
      }
  }
  
  // Ir para uma página específica
  function goToPage(page) {
      currentPage = page;
      renderClientes(filteredClientes.length > 0 ? filteredClientes : clientesData, currentPage);
  }
  
  // Editar cliente
  async function editarCliente(id) {
      try {
          const cliente = await clientesAPI.getClienteById(id);
          
          if (!cliente) {
              showAlert('Cliente não encontrado', 'danger');
              return;
          }
          
          // Preencher o formulário
          document.getElementById('cliente-id').value = cliente.ID;
          document.getElementById('cliente-nome').value = cliente.Nome || '';
          document.getElementById('cliente-cpf-cnpj').value = cliente.CPF_CNPJ || '';
          document.getElementById('cliente-tipo').value = cliente.Tipo || 'Pessoa Física';
          document.getElementById('cliente-telefone').value = cliente.Telefone || '';
          document.getElementById('cliente-email').value = cliente.Email || '';
          document.getElementById('cliente-endereco').value = cliente.Endereco || '';
          document.getElementById('cliente-cidade').value = cliente.Cidade || '';
          document.getElementById('cliente-estado').value = cliente.Estado || '';
          document.getElementById('cliente-cep').value = cliente.CEP || '';
          document.getElementById('cliente-observacoes').value = cliente.Observacoes || '';
          document.getElementById('cliente-situacao').value = cliente.Situacao || 'Ativo';
          
          // Abrir o modal
          openModal('Editar Cliente');
          
      } catch (error) {
          console.error('Erro ao editar cliente:', error);
      }
  }
  
  // Confirmar exclusão de cliente
  function confirmarExclusao(id) {
      if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
          excluirCliente(id);
      }
  }
  
  // Excluir cliente
  async function excluirCliente(id) {
      try {
          await clientesAPI.deleteCliente(id);
          
          showAlert('Cliente excluído com sucesso!', 'success');
          
          // Recarregar a lista de clientes
          await carregarClientes();
          
      } catch (error) {
          console.error('Erro ao excluir cliente:', error);
      }
  }
  
  // Salvar cliente (novo ou edição)
  async function salvarCliente() {
      try {
          // Capturar dados do formulário
          const id = document.getElementById('cliente-id').value;
          
          const cliente = {
              Nome: document.getElementById('cliente-nome').value,
              CPF_CNPJ: document.getElementById('cliente-cpf-cnpj').value,
              Tipo: document.getElementById('cliente-tipo').value,
              Telefone: document.getElementById('cliente-telefone').value,
              Email: document.getElementById('cliente-email').value,
              Endereco: document.getElementById('cliente-endereco').value,
              Cidade: document.getElementById('cliente-cidade').value,
              Estado: document.getElementById('cliente-estado').value,
              CEP: document.getElementById('cliente-cep').value,
              Observacoes: document.getElementById('cliente-observacoes').value,
              Situacao: document.getElementById('cliente-situacao').value
          };
          
          // Validar campos obrigatórios
          if (!cliente.Nome || !cliente.CPF_CNPJ || !cliente.Telefone) {
              showAlert('Preencha todos os campos obrigatórios', 'danger');
              return;
          }
          
          // Editar ou adicionar cliente
          if (id) {
              // Editar cliente existente
              await clientesAPI.updateCliente(id, cliente);
              showAlert('Cliente atualizado com sucesso!', 'success');
          } else {
              // Adicionar novo cliente
              await clientesAPI.addCliente(cliente);
              showAlert('Cliente adicionado com sucesso!', 'success');
          }
          
          // Fechar o modal
          closeModal();
          
          // Recarregar a lista de clientes
          await carregarClientes();
          
      } catch (error) {
          console.error('Erro ao salvar cliente:', error);
      }
  }
  
  // Buscar clientes
  async function buscarClientes() {
      try {
          const searchTerm = document.getElementById('search-cliente').value;
          
          if (searchTerm.trim() === '') {
              filteredClientes = [];
              renderClientes(clientesData, 1);
              return;
          }
          
          filteredClientes = await clientesAPI.searchClientes(searchTerm);
          currentPage = 1;
          renderClientes(filteredClientes, currentPage);
          
      } catch (error) {
          console.error('Erro ao buscar clientes:', error);
      }
  }
  
  // Carregar todos os clientes
  async function carregarClientes() {
      try {
          clientesData = await clientesAPI.getClientes();
          filteredClientes = [];
          currentPage = 1;
          renderClientes(clientesData, currentPage);
          
      } catch (error) {
          console.error('Erro ao carregar clientes:', error);
      }
  }
  
  // Configurar máscaras e formatação de campos
  function configurarMascaras() {
      // CPF/CNPJ
      const cpfCnpjInput = document.getElementById('cliente-cpf-cnpj');
      cpfCnpjInput.addEventListener('input', function() {
          this.value = formatCpfCnpj(this.value);
      });
      
      // Telefone
      const telefoneInput = document.getElementById('cliente-telefone');
      telefoneInput.addEventListener('input', function() {
          this.value = formatTelefone(this.value);
      });
      
      // CEP
      const cepInput = document.getElementById('cliente-cep');
      cepInput.addEventListener('input', function() {
          this.value = formatCep(this.value);
      });
  }
  
  // Inicialização
  document.addEventListener('DOMContentLoaded', async () => {
      // Carregar lista de clientes
      await carregarClientes();
      
      // Configurar máscaras de entrada
      configurarMascaras();
      
      // Event listeners
      
      // Botão de novo cliente
      document.getElementById('btn-new-cliente').addEventListener('click', () => {
          document.getElementById('cliente-form').reset();
          document.getElementById('cliente-id').value = '';
          openModal('Novo Cliente');
      });
      
      // Botão de busca
      document.getElementById('btn-search').addEventListener('click', buscarClientes);
      
      // Campo de busca - pesquisar ao pressionar Enter
      document.getElementById('search-cliente').addEventListener('keyup', e => {
          if (e.key === 'Enter') {
              buscarClientes();
          }
      });
      
      // Botão de cancelar no modal
      document.getElementById('btn-cancel').addEventListener('click', closeModal);
      
      // Botão X para fechar o modal
      document.querySelector('.modal-close').addEventListener('click', closeModal);
      
      // Botão de salvar cliente
      document.getElementById('btn-save').addEventListener('click', salvarCliente);
      
      // Fechar modal ao clicar fora
      clienteModal.addEventListener('click', e => {
          if (e.target === clienteModal) {
              closeModal();
          }
      });
      
      // Toggle do sidebar em dispositivos móveis
      document.querySelector('.mobile-toggle').addEventListener('click', () => {
          document.querySelector('.sidebar').classList.toggle('active');
      });
      
      // Navegação entre páginas
      document.querySelectorAll('.menu-item').forEach(item => {
          item.addEventListener('click', () => {
              const page = item.dataset.page;
              if (page === 'dashboard') {
                  window.location.href = 'index.html';
              } else if (page !== 'clientes') {
                  // Aqui você pode implementar a navegação para outras páginas
                  alert(`Navegando para a página: ${page}`);
              }
          });
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