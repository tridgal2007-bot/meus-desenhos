document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded and DOM ready');
  
  // Inicializar Mermaid corretamente
  mermaid.initialize({ 
    startOnLoad: false, 
    theme: 'dark',
    securityLevel: 'loose'
  });
  
  const apiKey = 'AIzaSyDbcoWsOzdPyR7pWyjCY2rCS7SGmnQJVI8';
  // URL CORRIGIDA: sem espaços antes dos dois-pontos
  const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;

  let simulationCy;
  let isVoiceActive = false;
  let recognition;

  // Função para alternar entre seções
  function switchSection(target) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${target}-section`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.nav-btn[data-target="${target}"]`).classList.add('active');
  }

  // Configurar navegação
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.target));
  });
  
  // Limpar chat
  document.getElementById('clear-chat').addEventListener('click', () => {
    document.getElementById('chat-container').innerHTML = '';
  });
  
  // Exportar chat
  document.getElementById('export-chat').addEventListener('click', () => {
    const chatContent = Array.from(document.querySelectorAll('.message-content'))
      .map(msg => msg.textContent)
      .join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_export.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Reconhecimento de voz
  document.getElementById('voice-toggle').addEventListener('click', () => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert('Reconhecimento de voz não suportado neste navegador.');
      return;
    }
    
    isVoiceActive = !isVoiceActive;
    const btn = document.getElementById('voice-toggle');
    btn.style.background = isVoiceActive ? '#ef4444' : '#6366f1';
    
    if (isVoiceActive) {
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
        sendMessage();
      };
      
      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        alert('Erro no reconhecimento de voz: ' + event.error);
      };
      
      recognition.start();
    } else if (recognition) {
      recognition.stop();
    }
  });

  // ENVIO DE MENSAGEM - CORRIGIDO E FUNCIONAL
  document.getElementById('send-btn').addEventListener('click', () => {
    console.log('Send button clicked');
    sendMessage();
  });

  document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('Enter key pressed');
      e.preventDefault();
      sendMessage();
    }
  });

  // Função principal de envio de mensagem
  async function sendMessage() {
    console.log('sendMessage called');
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message) {
      console.log('Mensagem vazia, não enviando');
      return;
    }

    // Adicionar mensagem do usuário
    addMessage('user', message);
    input.value = '';
    input.style.height = 'auto'; // Resetar altura do textarea

    // Mostrar mensagem de "pensando..."
    const thinkingId = Date.now();
    addMessage('bot', '💬 Processando sua pergunta...', thinkingId);

    try {
      console.log('Enviando requisição para a API Gemini');
      const response = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é um especialista em redes de computadores. Responda à seguinte pergunta sobre redes de forma clara e técnica: ${message}`
            }]
          }]
        })
      });

      console.log('Resposta recebida, status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API retornou erro ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      // Verificar se a resposta tem o formato esperado
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        const botResponse = data.candidates[0].content.parts[0].text;
        
        // Remover mensagem de "pensando..." e adicionar resposta real
        const thinkingElement = document.getElementById(`message-${thinkingId}`);
        if (thinkingElement) thinkingElement.remove();
        
        addMessage('bot', botResponse);
      } else {
        throw new Error('Resposta da API em formato inesperado');
      }
    } catch (error) {
      console.error('Erro completo:', error);
      
      // Atualizar mensagem de erro na interface
      const thinkingElement = document.getElementById(`message-${thinkingId}`);
      if (thinkingElement) {
        thinkingElement.querySelector('.message-content').innerHTML = `
          ❌ Erro ao gerar resposta: ${error.message}
          <p style="margin-top: 8px; font-size: 0.9em; color: #94a3b8;">
            Verifique: 1) Sua chave de API está válida, 2) Você tem cota disponível, 3) A URL da API está correta
          </p>
        `;
      } else {
        addMessage('bot', `❌ Erro: ${error.message}`);
      }
    }
  }

  // Função para adicionar mensagens ao chat
  function addMessage(type, content, id = null) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.classList.add('message', type);
    
    // Adicionar ID único se fornecido (para poder atualizar/remover depois)
    if (id) {
      div.id = `message-${id}`;
    }
    
    const header = document.createElement('div');
    header.classList.add('message-header');
    header.innerHTML = `
      <i class="fas fa-${type === 'bot' ? 'robot' : 'user'}"></i> 
      ${type === 'bot' ? 'RedesIA Pro' : 'Você'} 
      <span class="timestamp">${new Date().toLocaleTimeString('pt-BR')}</span>
    `;
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    
    // Renderizar Markdown para mensagens do bot
    if (type === 'bot') {
      messageContent.innerHTML = marked.parse(content);
    } else {
      // Para mensagens do usuário, apenas escapar HTML básico
      messageContent.innerHTML = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }
    
    div.appendChild(header);
    div.appendChild(messageContent);
    container.appendChild(div);
    
    // Scroll automático para o final
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
    
    return div; // Retornar o elemento para possível manipulação posterior
  }

  // Sugestões pré-definidas
  document.querySelectorAll('.suggestion-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.getElementById('user-input').value = tag.dataset.command;
      sendMessage();
    });
  });

  // Inicializar simulação de rede - CORRIGIDO
  function initSimulation() {
    try {
      const container = document.getElementById('network-simulation');
      if (!container) {
        console.error('Container de simulação não encontrado');
        return;
      }
      
      // Destruir instância anterior se existir
      if (simulationCy) {
        simulationCy.destroy();
      }
      
      simulationCy = cytoscape({
        container: container,
        elements: [],
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#3b82f6',
              'label': 'data(id)',
              'color': '#ffffff',
              'text-valign': 'center',
              'text-halign': 'center',
              'width': '40px',
              'height': '40px'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#94a3b8',
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'target-arrow-color': '#94a3b8'
            }
          }
        ],
        layout: {
          name: 'grid',
          rows: 1
        },
        userZoomingEnabled: true,
        userPanningEnabled: true
      });
      
      console.log('Simulação inicializada com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar simulação:', error);
    }
  }

  // Inicializar simulação quando o DOM estiver pronto
  setTimeout(initSimulation, 100);

  // Simulação de rede - CORRIGIDO
  document.getElementById('run-simulation').addEventListener('click', () => {
    if (!simulationCy) {
      console.error('Simulação não inicializada');
      return;
    }
    
    const type = document.getElementById('topology-type').value;
    simulationCy.elements().remove();
    
    try {
      if (type === 'star') {
        simulationCy.add({ data: { id: 'center', label: 'Core' } });
        for (let i = 1; i <= 5; i++) {
          simulationCy.add({ data: { id: `node${i}`, label: `Dispositivo ${i}` } });
          simulationCy.add({ data: { source: 'center', target: `node${i}` } });
        }
      } 
      else if (type === 'mesh') {
        for (let i = 1; i <= 4; i++) {
          simulationCy.add({ data: { id: `node${i}`, label: `Nó ${i}` } });
        }
        simulationCy.add({ data: { source: 'node1', target: 'node2' } });
        simulationCy.add({ data: { source: 'node1', target: 'node3' } });
        simulationCy.add({ data: { source: 'node1', target: 'node4' } });
        simulationCy.add({ data: { source: 'node2', target: 'node3' } });
        simulationCy.add({ data: { source: 'node2', target: 'node4' } });
        simulationCy.add({ data: { source: 'node3', target: 'node4' } });
      } 
      else if (type === 'ring') {
        for (let i = 1; i <= 5; i++) {
          simulationCy.add({ data: { id: `node${i}`, label: `Nó ${i}` } });
        }
        for (let i = 1; i < 5; i++) {
          simulationCy.add({ data: { source: `node${i}`, target: `node${i+1}` } });
        }
        simulationCy.add({ data: { source: 'node5', target: 'node1' } });
      } 
      else if (type === 'bus') {
        simulationCy.add({ data: { id: 'bus', label: 'Backbone' } });
        for (let i = 1; i <= 5; i++) {
          simulationCy.add({ data: { id: `node${i}`, label: `Estação ${i}` } });
          simulationCy.add({ data: { source: 'bus', target: `node${i}` } });
        }
      }
      
      simulationCy.layout({ name: 'cose' }).run();
      
      // Atualizar estatísticas simuladas
      document.getElementById('packet-count').textContent = Math.floor(Math.random() * 1000);
      document.getElementById('latency').textContent = Math.floor(Math.random() * 100) + ' ms';
      document.getElementById('error-count').textContent = Math.floor(Math.random() * 10);
      document.getElementById('throughput').textContent = Math.floor(Math.random() * 100) + ' Mbps';
      
      console.log(`Simulação de topologia ${type} executada`);
    } catch (error) {
      console.error('Erro ao executar simulação:', error);
      alert('Erro ao executar simulação: ' + error.message);
    }
  });

  // Adicionar dispositivo
  document.getElementById('add-device').addEventListener('click', () => {
    if (!simulationCy) {
      alert('Simulação não inicializada');
      return;
    }
    
    const nextId = simulationCy.nodes().length + 1;
    const id = `node${nextId}`;
    
    simulationCy.add({ 
      data: { 
        id: id, 
        label: `Novo ${nextId}` 
      } 
    });
    
    // Se houver um nó central, conectar a ele
    const centerNode = simulationCy.getElementById('center');
    if (centerNode.exists()) {
      simulationCy.add({ 
        data: { 
          source: 'center', 
          target: id 
        } 
      });
    }
    
    simulationCy.layout({ name: 'cose' }).run();
  });

  // Resetar simulação
  document.getElementById('reset-simulation').addEventListener('click', () => {
    if (simulationCy) {
      simulationCy.elements().remove();
    }
    document.getElementById('packet-count').textContent = '0';
    document.getElementById('latency').textContent = '0 ms';
    document.getElementById('error-count').textContent = '0';
    document.getElementById('throughput').textContent = '0 Mbps';
  });

  // Gerar diagrama
  document.getElementById('generate-diagram').addEventListener('click', async () => {
    const type = document.getElementById('diagram-type').value;
    const preview = document.getElementById('diagram-preview');
    
    let mermaidCode = '';
    
    switch(type) {
      case 'topology':
        mermaidCode = `
graph TD
  A[Internet] --> B[Firewall]
  B --> C[Router Core]
  C --> D[Switch de Acesso]
  D --> E[PC 1]
  D --> F[PC 2]
  D --> G[Servidor]
  
  style A fill:#ef4444,stroke:#b91c1c
  style B fill:#f59e0b,stroke:#b45309
  style G fill:#10b981,stroke:#059669
        `;
        break;
      case 'osi':
        mermaidCode = `
graph LR
  A[7 - Application] --> B[6 - Presentation]
  B --> C[5 - Session]
  C --> D[4 - Transport]
  D --> E[3 - Network]
  E --> F[2 - Data Link]
  F --> G[1 - Physical]
  
  style A fill:#3b82f6,stroke:#2563eb
  style D fill:#10b981,stroke:#059669
  style G fill:#8b5cf6,stroke:#7c3aed
        `;
        break;
      case 'tcp':
        mermaidCode = `
sequenceDiagram
  participant C as Cliente
  participant S as Servidor
  
  C->>S: SYN (seq=x)
  S->>C: SYN-ACK (seq=y, ack=x+1)
  C->>S: ACK (seq=x+1, ack=y+1)
  
  Note over C,S: Conexão estabelecida
        `;
        break;
      case 'vlan':
        mermaidCode = `
graph TD
  A[Switch Core] --> B[VLAN 10 - Admin]
  A --> C[VLAN 20 - Vendas]
  A --> D[VLAN 30 - TI]
  
  B --> E[PC Admin 1]
  B --> F[PC Admin 2]
  C --> G[PC Vendas 1]
  D --> H[Servidor TI]
  
  style A fill:#3b82f6,stroke:#2563eb
  style B fill:#10b981,stroke:#059669
  style C fill:#f59e0b,stroke:#b45309
  style D fill:#8b5cf6,stroke:#7c3aed
        `;
        break;
    }
    
    preview.innerHTML = `<pre class="mermaid">${mermaidCode}</pre>`;
    
    // Renderizar o diagrama
    try {
      await mermaid.run({
        nodes: [preview.querySelector('.mermaid')]
      });
    } catch (error) {
      console.error('Erro ao renderizar diagrama:', error);
      preview.innerHTML = `<pre>${mermaidCode}</pre>`;
      alert('Erro ao renderizar diagrama. Verifique o console para detalhes.');
    }
  });

  // Baixar diagrama (simplificado para este exemplo)
  document.getElementById('download-diagram').addEventListener('click', () => {
    alert('Funcionalidade de download disponível após gerar o diagrama.');
  });

  // Copiar código do diagrama
  document.getElementById('copy-diagram').addEventListener('click', () => {
    const preview = document.getElementById('diagram-preview');
    const codeElement = preview.querySelector('pre') || preview;
    const code = codeElement.textContent || codeElement.innerText;
    
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        alert('Código do diagrama copiado para a área de transferência!');
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar código: ' + err.message);
      });
    } else {
      alert('Nenhum código para copiar. Primeiro gere um diagrama.');
    }
  });

  // Alternar ferramentas
  document.getElementById('tool-selector').addEventListener('change', (e) => {
    document.querySelectorAll('.tool').forEach(tool => {
      tool.style.display = 'none';
    });
    document.getElementById(`${e.target.value}-tool`).style.display = 'block';
  });

  // Calculadora de sub-rede (exemplo simplificado)
  document.getElementById('calculate-subnet').addEventListener('click', () => {
    const ip = document.getElementById('ip-address').value.trim();
    const mask = document.getElementById('subnet-mask').value.trim();
    const resultElement = document.getElementById('subnet-result');
    
    if (!ip || !mask) {
      resultElement.innerHTML = '<span style="color: #ef4444">Por favor, preencha ambos os campos.</span>';
      return;
    }
    
    // Simulação de cálculo (em um projeto real, você implementaria o cálculo real)
    resultElement.innerHTML = `
      <h4>Resultados da Sub-rede:</h4>
      <p><strong>Endereço IP:</strong> ${ip}</p>
      <p><strong>Máscara de Rede:</strong> ${mask}</p>
      <p><strong>Endereço de Rede:</strong> ${ip.substring(0, ip.lastIndexOf('.'))}.0</p>
      <p><strong>Broadcast:</strong> ${ip.substring(0, ip.lastIndexOf('.'))}.255</p>
      <p><strong>Máscara em CIDR:</strong> /24 (exemplo)</p>
      <p><strong>Hosts utilizáveis:</strong> 254</p>
    `;
  });

  // Scanner de portas - mensagem informativa
  document.getElementById('scan-ports').addEventListener('click', () => {
    document.getElementById('port-result').innerHTML = `
      <p>⚠️ <strong>Scanner de portas não é possível diretamente no navegador</strong></p>
      <p>Devido a restrições de segurança do navegador, não podemos escanear portas diretamente.</p>
      <p><strong>Alternativas:</strong></p>
      <ul>
        <li>Use ferramentas como <code>nmap</code> no terminal</li>
        <li>Utilize serviços online especializados em segurança</li>
        <li>Implemente um backend que faça o scan e retorne os resultados</li>
      </ul>
    `;
  });

  // Traceroute - mensagem informativa
  document.getElementById('run-trace').addEventListener('click', () => {
    document.getElementById('trace-result').innerHTML = `
      <p>⚠️ <strong>Traceroute não é possível diretamente no navegador</strong></p>
      <p>Devido a restrições de segurança do navegador, não podemos executar traceroute diretamente.</p>
      <p><strong>Alternativas:</strong></p>
      <ul>
        <li>Use o comando <code>traceroute</code> (Linux/Mac) ou <code>tracert</code> (Windows) no terminal</li>
        <li>Utilize serviços online de traceroute visual</li>
        <li>Implemente um backend que execute o comando e retorne os resultados</li>
      </ul>
    `;
  });

  // Buscar RFC - CORRIGIDO
  document.getElementById('search-rfc').addEventListener('click', async () => {
    const numberElement = document.getElementById('rfc-number');
    const number = numberElement.value.trim();
    
    if (!number) {
      alert('Por favor, insira um número de RFC válido.');
      return;
    }
    
    const rfcContentElement = document.getElementById('rfc-content');
    rfcContentElement.innerHTML = '<p>🔍 Buscando RFC...</p>';
    
    try {
      // Usar um proxy CORS para evitar problemas de segurança
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = `https://www.rfc-editor.org/rfc/rfc${number}.txt`;
      
      console.log('Buscando RFC:', targetUrl);
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`RFC ${number} não encontrado ou erro ao buscar`);
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      // Extrair informações básicas do RFC
      const titleLine = lines.find(line => line.startsWith('RFC')) || '';
      const titleMatch = titleLine.match(/RFC\s+(\d+)\s+(.*)/);
      
      let title = `RFC ${number}`;
      if (titleMatch && titleMatch[2]) {
        title = `RFC ${number} - ${titleMatch[2].trim()}`;
      }
      
      // Pegar apenas as primeiras 15 linhas significativas como resumo
      const contentLines = lines.filter(line => line.trim() !== '').slice(0, 15);
      const summary = contentLines.join('\n');
      
      // Atualizar interface
      document.getElementById('rfc-title').textContent = title;
      document.getElementById('rfc-link').href = `https://www.rfc-editor.org/rfc/rfc${number}.html`;
      
      rfcContentElement.innerHTML = `
        <p><strong>Resumo do conteúdo:</strong></p>
        <pre style="white-space: pre-wrap; background: #0f172a; padding: 10px; border-radius: 5px; overflow: auto; max-height: 300px; margin: 10px 0;">${summary}...</pre>
        <p style="margin-top: 10px; font-style: italic;">
          Este é um resumo do início do documento. Clique no link acima para acessar o RFC completo.
        </p>
      `;
      
      console.log(`RFC ${number} carregado com sucesso`);
    } catch (error) {
      console.error('Erro ao buscar RFC:', error);
      rfcContentElement.innerHTML = `
        <div style="color: #ef4444; padding: 15px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid #b91c1c;">
          <strong>❌ Erro ao buscar RFC ${number}:</strong><br>
          ${error.message}
        </div>
        <p style="margin-top: 10px; color: #94a3b8;">
          Dicas:<br>
          • Verifique se o número do RFC está correto<br>
          • Tente RFCs conhecidos como 791 (IP), 793 (TCP), ou 2616 (HTTP)<br>
          • O serviço pode estar temporariamente indisponível
        </p>
      `;
    }
  });

  // Links de RFCs relacionados
  document.querySelectorAll('.rfc-related a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('rfc-number').value = link.dataset.rfc;
      document.getElementById('search-rfc').click();
    });
  });

  // Ajustar altura do textarea conforme o conteúdo
  const userInput = document.getElementById('user-input');
  userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  // Iniciar na seção de chat
  setTimeout(() => {
    switchSection('chat');
    // Focar no campo de input após um pequeno delay
    setTimeout(() => {
      userInput.focus();
    }, 300);
  }, 100);
  
  console.log('Inicialização completa!');
});