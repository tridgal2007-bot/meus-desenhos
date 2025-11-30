document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded and DOM ready');
  mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  
  let simulationCy;
  let isVoiceActive = false;
  let recognition;
  
  function switchSection(target) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById(`${target}-section`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-target="${target}"]`).classList.add('active');
  }
  
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.target)));
  
  document.getElementById('clear-chat').addEventListener('click', () => {
    document.getElementById('chat-container').innerHTML = '';
    // Adiciona mensagem inicial novamente
    addInitialMessage();
  });
  
  function addInitialMessage() {
    const container = document.getElementById('chat-container');
    const initialMessage = `
      <div class="message bot">
        <div class="message-header">
          <i class="fas fa-robot"></i> RedesIA Pro
          <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="message-content">
          <p>Olá! Sou seu especialista em redes de computadores. Posso ajudar com:</p>
          <ul>
            <li>Explicação de protocolos (TCP/IP, BGP, OSPF, MPLS)</li>
            <li>Diagnóstico de problemas de rede</li>
            <li>Criação de diagramas de topologia</li>
            <li>Simulações de tráfego de rede</li>
            <li>Consultas a RFCs e padrões técnicos</li>
            <li>Configuração de dispositivos (Cisco, Juniper, etc.)</li>
          </ul>
          <p><strong>Exemplo de comando:</strong> "Explique o handshake TCP com diagrama"</p>
          <p><span style="background: rgba(245,158,11,0.2); padding: 8px 15px; border-radius: 20px; display: inline-block; margin-top: 10px; border: 1px solid var(--warning);">
            <i class="fas fa-info-circle"></i> Servidor rodando na porta 5500 - acesse em http://localhost:5500
          </span></p>
        </div>
      </div>
    `;
    container.innerHTML = initialMessage;
  }
  
  document.getElementById('export-chat').addEventListener('click', () => {
    const chatContent = Array.from(document.querySelectorAll('.message-content')).map(msg => msg.textContent).join('\n\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_export.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
  
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
      try {
        recognition.start();
      } catch (error) {
        console.error('Erro ao iniciar o reconhecimento:', error);
        alert('Erro ao iniciar o reconhecimento de voz');
        isVoiceActive = false;
        btn.style.background = '#6366f1';
      }
    } else if (recognition) {
      recognition.stop();
    }
  });
  
  document.getElementById('send-btn').addEventListener('click', () => {
    sendMessage();
  });
  
  document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;
    
    addMessage('user', message);
    input.value = '';
    
    // Desabilitar botão enquanto processa
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      addMessage('bot', data.response || 'Sem resposta do servidor.');
    } catch (error) {
      console.error('Erro na comunicação:', error);
      addMessage('bot', `Erro ao se comunicar com o servidor: ${error.message || error}`);
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
  }
  
  function addMessage(type, content) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.classList.add('message', type);
    
    const header = document.createElement('div');
    header.classList.add('message-header');
    header.innerHTML = `<i class="fas fa-${type === 'bot' ? 'robot' : 'user'}"></i> ${type === 'bot' ? 'RedesIA Pro' : 'Você'} <span class="timestamp">${new Date().toLocaleTimeString()}</span>`;
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    
    // Processar conteúdo com marked para markdown
    try {
      messageContent.innerHTML = marked.parse(content);
    } catch (error) {
      console.error('Erro ao processar markdown:', error);
      messageContent.textContent = content;
    }
    
    div.appendChild(header);
    div.appendChild(messageContent);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }
  
  document.querySelectorAll('.suggestion-tag').forEach(tag => tag.addEventListener('click', () => {
    document.getElementById('user-input').value = tag.dataset.command;
    sendMessage();
  }));
  
  function initSimulation() {
    simulationCy = cytoscape({
      container: document.getElementById('network-simulation'),
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
            'line-color': '#ccc',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#ccc'
          }
        }
      ],
      layout: { 
        name: 'cose',
        animate: true,
        animationDuration: 1000
      }
    });
  }
  
  // Inicializar simulação quando a seção estiver visível
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !simulationCy) {
        initSimulation();
      }
    });
  }, { threshold: 0.1 });
  
  observer.observe(document.getElementById('simulation-section'));
  
  document.getElementById('run-simulation').addEventListener('click', () => {
    if (!simulationCy) initSimulation();
    
    simulationCy.elements().remove();
    
    const type = document.getElementById('topology-type').value;
    
    if (type === 'star') {
      simulationCy.add({ data: { id: 'center', label: 'Core' } });
      for (let i = 1; i <= 5; i++) {
        simulationCy.add({ data: { id: `node${i}`, label: `Dispositivo ${i}` } });
        simulationCy.add({ data: { source: 'center', target: `node${i}` } });
      }
    } else if (type === 'mesh') {
      for (let i = 1; i <= 4; i++) {
        simulationCy.add({ data: { id: `node${i}`, label: `Roteador ${i}` } });
      }
      simulationCy.add({ data: { source: 'node1', target: 'node2' } });
      simulationCy.add({ data: { source: 'node1', target: 'node3' } });
      simulationCy.add({ data: { source: 'node1', target: 'node4' } });
      simulationCy.add({ data: { source: 'node2', target: 'node3' } });
      simulationCy.add({ data: { source: 'node2', target: 'node4' } });
      simulationCy.add({ data: { source: 'node3', target: 'node4' } });
    } else if (type === 'ring') {
      for (let i = 1; i <= 5; i++) {
        simulationCy.add({ data: { id: `node${i}`, label: `Switch ${i}` } });
      }
      for (let i = 1; i < 5; i++) {
        simulationCy.add({ data: { source: `node${i}`, target: `node${i+1}` } });
      }
      simulationCy.add({ data: { source: 'node5', target: 'node1' } });
    } else if (type === 'bus') {
      simulationCy.add({ data: { id: 'bus', label: 'Backbone' } });
      for (let i = 1; i <= 5; i++) {
        simulationCy.add({ data: { id: `node${i}`, label: `Host ${i}` } });
        simulationCy.add({ data: { source: 'bus', target: `node${i}` } });
      }
    }
    
    simulationCy.layout({ name: 'cose', animate: true, animationDuration: 1000 }).run();
    
    // Atualizar estatísticas com valores randômicos para demonstração
    document.getElementById('packet-count').textContent = Math.floor(Math.random() * 1000);
    document.getElementById('latency').textContent = Math.floor(Math.random() * 100) + ' ms';
    document.getElementById('error-count').textContent = Math.floor(Math.random() * 10);
    document.getElementById('throughput').textContent = (Math.random() * 100).toFixed(1) + ' Mbps';
  });
  
  document.getElementById('add-device').addEventListener('click', () => {
    if (!simulationCy) initSimulation();
    
    const id = `node${simulationCy.nodes().length + 1}`;
    const label = `Novo ${document.getElementById('topology-type').value === 'star' ? 'Dispositivo' : 'Nó'}`;
    simulationCy.add({ data: { id, label } });
    
    // Conectar ao nó central se for topologia em estrela
    if (document.getElementById('topology-type').value === 'star' && simulationCy.$id('center').length > 0) {
      simulationCy.add({ data: { source: 'center', target: id } });
    }
    
    simulationCy.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
  });
  
  document.getElementById('reset-simulation').addEventListener('click', () => {
    if (simulationCy) {
      simulationCy.elements().remove();
    }
    document.getElementById('packet-count').textContent = '0';
    document.getElementById('latency').textContent = '0 ms';
    document.getElementById('error-count').textContent = '0';
    document.getElementById('throughput').textContent = '0.0 Mbps';
  });
  
  document.getElementById('generate-diagram').addEventListener('click', async () => {
    const type = document.getElementById('diagram-type').value;
    const preview = document.getElementById('diagram-preview');
    
    let mermaidCode = '';
    
    switch(type) {
      case 'topology':
        mermaidCode = `graph TD
          A[Internet] --> B[Firewall]
          B --> C[Router Core]
          C --> D[Switch de Acesso]
          D --> E[PC 1]
          D --> F[PC 2]
          D --> G[Servidor]
          
          style A fill:#ef4444,stroke:#b91c1c
          style B fill:#f59e0b,stroke:#b45309
          style G fill:#10b981,stroke:#059669`;
        break;
      case 'osi':
        mermaidCode = `graph LR
          A[7. Application] --> B[6. Presentation]
          B --> C[5. Session]
          C --> D[4. Transport]
          D --> E[3. Network]
          E --> F[2. Data Link]
          F --> G[1. Physical]
          
          style A fill:#8b5cf6
          style D fill:#3b82f6
          style E fill:#10b981`;
        break;
      case 'tcp':
        mermaidCode = `sequenceDiagram
          participant C as Cliente
          participant S as Servidor
          
          C->>S: SYN (Seq=x)
          S->>C: SYN-ACK (Seq=y, Ack=x+1)
          C->>S: ACK (Seq=x+1, Ack=y+1)
          
          Note over C,S: Conexão Estabelecida`;
        break;
      case 'vlan':
        mermaidCode = `graph TD
          R[Router] --> SW[Switch Multilayer]
          SW --> V10[VLAN 10: Admin]
          SW --> V20[VLAN 20: Vendas]
          SW --> V30[VLAN 30: TI]
          
          V10 --> PC1[PC Admin 1]
          V10 --> PC2[PC Admin 2]
          V20 --> PC3[PC Vendas 1]
          V30 --> SV1[Servidor TI]
          
          style V10 fill:#3b82f6,stroke:#2563eb
          style V20 fill:#10b981,stroke:#059669
          style V30 fill:#8b5cf6,stroke:#7c3aed`;
        break;
      default:
        mermaidCode = `graph TD
          A[Dispositivo A] --> B[Dispositivo B]
          B --> C[Dispositivo C]`;
    }
    
    preview.textContent = mermaidCode;
    
    try {
      const { svg } = await mermaid.render('mermaid-diagram', mermaidCode);
      preview.innerHTML = svg;
    } catch (error) {
      console.error('Erro ao renderizar diagrama:', error);
      preview.innerHTML = '<p style="color: #ef4444">Erro ao gerar diagrama. Verifique a sintaxe do Mermaid.</p>';
      preview.textContent = mermaidCode;
    }
  });
  
  document.getElementById('download-diagram').addEventListener('click', async () => {
    const code = document.getElementById('diagram-preview').textContent;
    
    try {
      const { svg } = await mermaid.render('download-diagram', code);
      
      // Criar um blob com o SVG
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Criar link de download
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagrama-rede-${new Date().toISOString().replace(/[:.]/g, '-')}.svg`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
    } catch (error) {
      console.error('Erro ao baixar diagrama:', error);
      alert('Erro ao gerar o arquivo SVG. Verifique a sintaxe do diagrama.');
    }
  });
  
  document.getElementById('copy-diagram').addEventListener('click', () => {
    const code = document.getElementById('diagram-preview').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('copy-diagram');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      alert('Não foi possível copiar o código. Tente manualmente.');
    });
  });
  
  document.getElementById('tool-selector').addEventListener('change', (e) => {
    document.querySelectorAll('.tool').forEach(tool => tool.style.display = 'none');
    document.getElementById(`${e.target.value}-tool`).style.display = 'block';
  });
  
  document.getElementById('calculate-subnet').addEventListener('click', () => {
    const ip = document.getElementById('ip-address').value.trim();
    const mask = document.getElementById('subnet-mask').value.trim();
    const resultEl = document.getElementById('subnet-result');
    
    if (!ip || !mask) {
      resultEl.innerHTML = '<p style="color: #ef4444">Por favor, preencha ambos os campos.</p>';
      return;
    }
    
    // Validação simples
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip) || !ipRegex.test(mask)) {
      resultEl.innerHTML = '<p style="color: #ef4444">Formato de IP ou máscara inválido.</p>';
      return;
    }
    
    // Simular cálculo (em produção, use uma biblioteca adequada)
    resultEl.innerHTML = `
      <div class="subnet-details">
        <p><strong>Endereço IP:</strong> ${ip}</p>
        <p><strong>Máscara de rede:</strong> ${mask}</p>
        <p><strong>Endereço de rede:</strong> 192.168.1.0</p>
        <p><strong>Primeiro host:</strong> 192.168.1.1</p>
        <p><strong>Último host:</strong> 192.168.1.254</p>
        <p><strong>Broadcast:</strong> 192.168.1.255</p>
        <p><strong>Total de hosts:</strong> 254</p>
      </div>
    `;
  });
  
  document.getElementById('scan-ports').addEventListener('click', () => {
    const resultEl = document.getElementById('port-result');
    resultEl.innerHTML = `
      <div class="warning-message">
        <p><i class="fas fa-exclamation-triangle"></i> <strong>Aviso de Segurança:</strong></p>
        <p>O scanner de portas não pode ser executado diretamente do navegador por restrições de segurança.</p>
        <p>Para escanear portas, utilize ferramentas especializadas como:</p>
        <ul>
          <li><code>nmap -p 1-1024 192.168.1.1</code> no terminal</li>
          <li>Ferramentas online especializadas (com cuidado)</li>
          <li>Aplicativos dedicados como Angry IP Scanner</li>
        </ul>
        <p class="security-note">⚠️ Verifique sempre se você tem permissão para escanear o host alvo.</p>
      </div>
    `;
  });
  
  document.getElementById('run-trace').addEventListener('click', () => {
    const host = document.getElementById('trace-host').value.trim();
    const resultEl = document.getElementById('trace-result');
    
    if (!host) {
      resultEl.innerHTML = '<p style="color: #ef4444">Por favor, informe um host válido.</p>';
      return;
    }
    
    // Simular traceroute
    resultEl.innerHTML = `
      <div class="trace-result">
        <p><strong>Traceroute para:</strong> ${host}</p>
        <pre>
1  192.168.1.1 (gateway local)        2.3 ms
2  10.10.0.1 (provedor)               8.7 ms
3  200.222.x.x (núcleo da rede)       15.2 ms
4  200.222.x.x (roteador regional)    22.8 ms
5  172.217.x.x (servidor destino)     45.6 ms
        </pre>
        <p class="note">* Este é um traceroute simulado. Para resultados reais, utilize <code>tracert ${host}</code> no Windows ou <code>traceroute ${host}</code> no Linux/Mac.</p>
      </div>
    `;
  });
  
  document.getElementById('search-rfc').addEventListener('click', async () => {
    const number = document.getElementById('rfc-number').value.trim();
    const contentEl = document.getElementById('rfc-content');
    const titleEl = document.getElementById('rfc-title');
    const linkEl = document.getElementById('rfc-link');
    
    if (!number) {
      contentEl.innerHTML = '<p style="color: #ef4444">Por favor, informe um número de RFC válido.</p>';
      return;
    }
    
    contentEl.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Buscando RFC...</p>';
    
    try {
      // Buscar metadados do RFC
      const metadataResponse = await fetch(`https://www.rfc-editor.org/rfc/rfc${number}.json`);
      
      if (!metadataResponse.ok) {
        throw new Error('RFC não encontrado ou inválido');
      }
      
      const metadata = await metadataResponse.json();
      
      // Obter conteúdo do RFC (resumo para demonstração)
      const rfcContent = await fetch(`https://www.rfc-editor.org/rfc/rfc${number}.txt`);
      let textContent = await rfcContent.text();
      
      // Limitar ao primeiro parágrafo significativo para demonstração
      const paragraphs = textContent.split('\n\n');
      let summary = '';
      for (let para of paragraphs) {
        if (para.trim().length > 100 && !para.includes('RFC') && !para.includes('Request for Comments')) {
          summary = para.substring(0, 500) + '...';
          break;
        }
      }
      
      titleEl.textContent = `RFC ${number} - ${metadata.title || 'Documento Técnico'}`;
      linkEl.href = `https://www.rfc-editor.org/rfc/rfc${number}.html`;
      
      contentEl.innerHTML = `
        <p><strong>Autor(es):</strong> ${metadata.authors?.join(', ') || 'Não especificado'}</p>
        <p><strong>Data de Publicação:</strong> ${metadata.date || 'Não especificada'}</p>
        <p><strong>Estado:</strong> ${metadata.status || 'Não especificado'}</p>
        <h4>Resumo:</h4>
        <p>${summary || 'Conteúdo não disponível para visualização. Acesse o documento completo pelo link acima.'}</p>
        <div class="rfc-note">
          <i class="fas fa-info-circle"></i> Este é um resumo do conteúdo. Para o documento completo e oficial, 
          acesse o link acima.
        </div>
      `;
      
    } catch (error) {
      console.error('Erro ao buscar RFC:', error);
      contentEl.innerHTML = `
        <div class="error-message">
          <p><i class="fas fa-exclamation-triangle"></i> <strong>Erro:</strong> ${error.message}</p>
          <p>Não foi possível carregar o RFC ${number}. Verifique o número e tente novamente.</p>
          <p>Alternativamente, acesse diretamente: 
            <a href="https://www.rfc-editor.org/rfc/rfc${number}.html" target="_blank">
              https://www.rfc-editor.org/rfc/rfc${number}.html
            </a>
          </p>
        </div>
      `;
    }
  });
  
  document.querySelectorAll('.rfc-related a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const rfcNumber = link.dataset.rfc || link.textContent.match(/\d+/)[0];
      document.getElementById('rfc-number').value = rfcNumber;
      document.getElementById('search-rfc').click();
    });
  });
  
  // Iniciar com a seção de chat
  switchSection('chat');
  // Adicionar mensagem inicial
  if (document.getElementById('chat-container').children.length === 0) {
    addInitialMessage();
  }
});