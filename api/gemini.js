// api/gemini.js - Proxy para API do Gemini
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Verificar método HTTP
  if (request.method !== 'POST') {
    return new NextResponse(JSON.stringify({ 
      error: 'Método não permitido. Use POST.' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse do corpo da requisição
    const { message } = await request.json();
    
    // Validação da mensagem
    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      return new NextResponse(JSON.stringify({ 
        error: 'Mensagem inválida. Forneça uma pergunta com pelo menos 3 caracteres.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obter chave da API das variáveis de ambiente
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('Chave da API do Gemini não configurada nas variáveis de ambiente');
      return new NextResponse(JSON.stringify({ 
        error: 'Erro interno do servidor: chave de API não configurada' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construir prompt especializado em redes
    const prompt = `Você é um especialista sênior em redes de computadores com mais de 15 anos de experiência. Responda à pergunta a seguir com precisão técnica, profundidade e clareza para um profissional de TI. Se a pergunta não for sobre redes, explique educadamente que você é especialista em redes e peça uma pergunta relacionada ao tema.

Pergunta: ${message}

Instruções específicas:
1. Use termos técnicos corretos e siglas quando apropriado
2. Se relevante, inclua exemplos práticos ou analogias
3. Para configurações, mostre exemplos de comandos (Cisco, Linux, etc.)
4. Para protocolos, explique o funcionamento e os campos relevantes
5. Se aplicável, mencione RFCs ou padrões relacionados
6. Para respostas longas, organize em seções com tópicos
7. Se a pergunta estiver incompleta, faça suposições razoáveis e as declare
8. Sempre que possível, inclua dicas de troubleshooting ou boas práticas
9. Responda em português do Brasil com termos técnicos em inglês quando necessário`;

    // Fazer requisição para a API do Gemini
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    // Tratar erros da API do Gemini
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => null);
      console.error('Erro da API Gemini:', geminiResponse.status, errorData || await geminiResponse.text());
      
      // Tratar limite de requisições
      if (geminiResponse.status === 429) {
        return new NextResponse(JSON.stringify({ 
          error: 'Limite de requisições atingido. Tente novamente em alguns minutos.' 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Tratar chave inválida
      if (geminiResponse.status === 400 && errorData?.error?.message?.includes('API_KEY_INVALID')) {
        console.error('Chave da API do Gemini inválida ou expirada');
        return new NextResponse(JSON.stringify({ 
          error: 'Erro de autenticação. A chave de API não é válida.' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Erro genérico
      return new NextResponse(JSON.stringify({ 
        error: `Erro na API do Gemini: ${geminiResponse.status} ${errorData?.error?.message || geminiResponse.statusText}`
      }), {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Processar resposta bem-sucedida
    const geminiData = await geminiResponse.json();
    
    // Verificar se há resposta válida
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('Resposta inválida da API Gemini:', geminiData);
      return new NextResponse(JSON.stringify({ 
        error: 'Resposta inválida da API do Gemini. Tente reformular sua pergunta.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extrair texto da resposta
    const responseText = geminiData.candidates[0].content.parts[0].text;
    
    // Formatar a resposta para melhor legibilidade no chat
    let formattedResponse = responseText.trim();
    
    // Adicionar formatação adicional se necessário
    if (formattedResponse.length < 50) {
      formattedResponse = `**Resposta breve:** ${formattedResponse}\n\nPara mais detalhes sobre este assunto, você pode perguntar especificamente sobre: protocolos relacionados, implementação prática, troubleshooting ou padrões RFC.`;
    }

    // Retornar resposta bem-sucedida
    return new NextResponse(JSON.stringify({ 
      response: formattedResponse,
      model: 'gemini-1.5-flash-latest',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no processamento do proxy Gemini:', error);
    
    // Tratar erros de rede ou parsing
    if (error.name === 'FetchError' || error.message.includes('fetch')) {
      return new NextResponse(JSON.stringify({ 
        error: 'Erro de conexão com a API do Gemini. Tente novamente mais tarde.' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Erro genérico
    return new NextResponse(JSON.stringify({ 
      error: `Erro interno: ${error.message || 'Erro desconhecido'}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}