// Memória global para evitar cartelas repetidas em toda a vida útil da página
const historicoCartelas = new Set();

// 1. Sorteia os números
function gerarNumeros(min, max, quantidade) {
    const numeros = new Set();
    while (numeros.size < quantidade) {
        numeros.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return Array.from(numeros).sort((a, b) => a - b);
}

// 2. Cria uma matriz de cartela 100% inédita
function gerarCartelaUnica() {
    let assinatura;
    let novaCartela;

    do {
        novaCartela = [
            gerarNumeros(1, 15, 5),
            gerarNumeros(16, 30, 5),
            gerarNumeros(31, 45, 5),
            gerarNumeros(46, 60, 5),
            gerarNumeros(61, 75, 5)
        ];
        assinatura = novaCartela.map(col => col.join(',')).join('-');
    } while (historicoCartelas.has(assinatura));

    historicoCartelas.add(assinatura);
    return novaCartela;
}

// 3. Preenche fisicamente os TDs de uma tabela específica
function preencherTabelaDOM(tabela, matrizCartela) {
    const linhas = tabela.querySelectorAll('tbody tr');
    for (let i = 0; i < 5; i++) {
        const celulas = linhas[i].querySelectorAll('td');
        celulas[0].textContent = matrizCartela[0][i]; // D
        celulas[1].textContent = matrizCartela[1][i]; // U
        celulas[2].textContent = matrizCartela[2][i]; // L
        celulas[3].textContent = matrizCartela[3][i]; // C
        celulas[4].textContent = matrizCartela[4][i]; // E
    }
}

// 4. Função Principal executada pelo botão
async function gerarLoteDeCartelas() {
    const qtdFolhas = parseInt(document.getElementById('qtd-folhas').value);
    const serieInicial = parseInt(document.getElementById('serie-inicial').value);
    
    const areaImpressao = document.getElementById('area-impressao');
    const previewContainer = document.getElementById('preview-container');
    const molde = document.getElementById('molde-folha');
    const btnGerar = document.getElementById('btn-gerar');
    const statusDiv = document.getElementById('status-mensagem');

    btnGerar.disabled = true;
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Gerando cartelas, aguarde...';
    
    areaImpressao.innerHTML = ''; // Limpa lotes anteriores

    // 1. Prepara a tela para o html2pdf conseguir "enxergar" os elementos
    previewContainer.style.display = 'none'; // Esconde o preview
    areaImpressao.style.display = 'block';   // Mostra a área de impressão

    // Loop que cria a quantidade de folhas solicitada
    for (let i = 0; i < qtdFolhas; i++) {
        const numeroSerieAtual = serieInicial + i;
        const stringSerie = String(numeroSerieAtual).padStart(6, '0');

        // Clona a div do preview
        const novaFolha = molde.cloneNode(true);
        novaFolha.removeAttribute('id'); 

        novaFolha.querySelectorAll('.num-serie').forEach(el => el.textContent = stringSerie);

        const tabelas = novaFolha.querySelectorAll('.tabela-bingo');
        preencherTabelaDOM(tabelas[0], gerarCartelaUnica());
        preencherTabelaDOM(tabelas[1], gerarCartelaUnica());
        preencherTabelaDOM(tabelas[2], gerarCartelaUnica());

        // Joga a folha preenchida na área de impressão invisível
        areaImpressao.appendChild(novaFolha);

        // NOVO: Usa a quebra de página oficial da biblioteca entre as folhas
        if (i < qtdFolhas - 1) {
            const quebra = document.createElement('div');
            quebra.classList.add('html2pdf__page-break');
            areaImpressao.appendChild(quebra);
        }
    }

    statusDiv.textContent = 'Montando o arquivo PDF...';

    const serieFinal = serieInicial + qtdFolhas - 1;
    const nomeArquivo = `Bingo_Santa_Dulce_${String(serieInicial).padStart(6,'0')}_a_${String(serieFinal).padStart(6,'0')}.pdf`;

    const opcoesPDF = {
        margin:       0,
        filename:     nomeArquivo,
        pagebreak:    { mode: 'legacy' }, // Ativa a quebra de página oficial que colocamos no JS
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true }, // Scale 2 é o equilíbrio perfeito entre qualidade e precisão de corte
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } // Formato A4 oficial milimétrico
    };

    // Gera o PDF
    await html2pdf().set(opcoesPDF).from(areaImpressao).save();

    // 2. Restaura a tela para o estado normal após o download
    areaImpressao.style.display = 'none';
    areaImpressao.innerHTML = ''; 
    previewContainer.style.display = 'flex';

    btnGerar.disabled = false;
    statusDiv.textContent = 'Download concluído!';
    document.getElementById('serie-inicial').value = serieFinal + 1;
}

// 5. Preenche a cartela de preview assim que o site abrir
document.addEventListener('DOMContentLoaded', () => {
    const moldeInicial = document.getElementById('molde-folha');
    if(moldeInicial) {
        const tabelasPreview = moldeInicial.querySelectorAll('.tabela-bingo');
        
        // Injeta números aleatórios no preview inicial
        preencherTabelaDOM(tabelasPreview[0], gerarCartelaUnica());
        preencherTabelaDOM(tabelasPreview[1], gerarCartelaUnica());
        preencherTabelaDOM(tabelasPreview[2], gerarCartelaUnica());
    }
});

// Função para tirar um Print (PNG) do preview atual para aprovação
function baixarPrintModelo() {
    const preview = document.querySelector('#preview-container .folha-a4');
    const statusDiv = document.getElementById('status-mensagem');
    const btnPrint = document.getElementById('btn-print');

    // Avisa o usuário que está gerando a imagem
    btnPrint.disabled = true;
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Gerando imagem para aprovação...';

    // Configuração do html2canvas para tirar a "foto" da div
    html2canvas(preview, { 
        scale: 2, // Escala 2 garante uma imagem com boa resolução para Whatsapp/Email
        useCORS: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        // Transforma o canvas em um link de download
        const link = document.createElement('a');
        link.download = 'modelo_aprovacao_bingo.png';
        link.href = canvas.toDataURL('image/png');
        
        // Simula o clique para baixar
        link.click();

        // Restaura o botão e avisa que concluiu
        statusDiv.textContent = 'Print baixado com sucesso!';
        btnPrint.disabled = false;
        
        // Esconde a mensagem após 3 segundos
        setTimeout(() => {
            if (!document.getElementById('btn-gerar').disabled) {
                statusDiv.style.display = 'none';
            }
        }, 3000);
    });
}