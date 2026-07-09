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
// ... (mantenha as funções gerarNumeros, gerarCartelaUnica e preencherTabelaDOM iguais) ...

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

    for (let i = 0; i < qtdFolhas; i++) {
        const numeroSerieAtual = serieInicial + i;
        const stringSerie = String(numeroSerieAtual).padStart(6, '0');

        // Clona a div do preview (true significa que clona tudo que tem dentro)
        const novaFolha = molde.cloneNode(true);
        novaFolha.removeAttribute('id'); // Removemos o ID para não dar conflito

        if (i < qtdFolhas - 1) {
            novaFolha.style.pageBreakAfter = 'always';
        }

        novaFolha.querySelectorAll('.num-serie').forEach(el => el.textContent = stringSerie);

        const tabelas = novaFolha.querySelectorAll('.tabela-bingo');
        preencherTabelaDOM(tabelas[0], gerarCartelaUnica());
        preencherTabelaDOM(tabelas[1], gerarCartelaUnica());
        preencherTabelaDOM(tabelas[2], gerarCartelaUnica());

        areaImpressao.appendChild(novaFolha);
    }

    statusDiv.textContent = 'Montando o arquivo PDF...';

    const serieFinal = serieInicial + qtdFolhas - 1;
    const nomeArquivo = `Bingo_Santa_Dulce_${String(serieInicial).padStart(6,'0')}_a_${String(serieFinal).padStart(6,'0')}.pdf`;

    const opcoesPDF = {
        margin:       0,
        filename:     nomeArquivo,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait' }
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

// 3. Preenche a cartela de preview assim que o site abrir
document.addEventListener('DOMContentLoaded', () => {
    const moldeInicial = document.getElementById('molde-folha');
    const tabelasPreview = moldeInicial.querySelectorAll('.tabela-bingo');
    
    // Injeta números aleatórios no preview inicial
    preencherTabelaDOM(tabelasPreview[0], gerarCartelaUnica());
    preencherTabelaDOM(tabelasPreview[1], gerarCartelaUnica());
    preencherTabelaDOM(tabelasPreview[2], gerarCartelaUnica());
});

    statusDiv.textContent = 'Montando o arquivo PDF...';

    // 5. Configura e chama a biblioteca para gerar o PDF
    const serieFinal = serieInicial + qtdFolhas - 1;
    const nomeArquivo = `Bingo_Santa_Dulce_${String(serieInicial).padStart(6,'0')}_a_${String(serieFinal).padStart(6,'0')}.pdf`;

    const opcoesPDF = {
        margin:       0,
        filename:     nomeArquivo,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 }, // Melhora a resolução para impressão gráfica
        jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait' }
    };

    // Gera o PDF e faz o download automático
    await html2pdf().set(opcoesPDF).from(areaImpressao).save();

    // Restaura o botão e o aviso
    btnGerar.disabled = false;
    statusDiv.textContent = 'Download concluído!';
    
    // Atualiza automaticamente o número inicial no menu para o próximo lote
    document.getElementById('serie-inicial').value = serieFinal + 1;
