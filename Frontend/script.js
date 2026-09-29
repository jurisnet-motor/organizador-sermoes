const API_URL = "http://127.0.0.1:8000";

const quantidadeTopicos = document.getElementById("quantidadeTopicos");
const premissasContainer = document.getElementById("premissasContainer");
const btnSugerir = document.getElementById("btnSugerir");
const btnGerar = document.getElementById("btnGerar");
const resultado = document.getElementById("resultado");
const conteudoResultado = document.getElementById("conteudoResultado");
const criador = document.getElementById("criador");
const btnExportarWord = document.getElementById("btnExportarWord");

let esbocoAtual = "";


// ======================================================
// CRIAR CAMPOS DE PREMISSAS
// ======================================================

function criarCamposPremissas() {
    const quantidade = Number(quantidadeTopicos.value);

    const valoresAtuais = [];

    document.querySelectorAll(".campo-premissa").forEach((campo) => {
        valoresAtuais.push(campo.value);
    });

    premissasContainer.innerHTML = "";

    for (let i = 1; i <= quantidade; i++) {
        const bloco = document.createElement("div");
        bloco.className = "premissa";

        const label = document.createElement("label");
        label.setAttribute("for", `premissa${i}`);
        label.textContent = `Premissa ${i}`;

        const textarea = document.createElement("textarea");
        textarea.id = `premissa${i}`;
        textarea.className = "campo-premissa";
        textarea.placeholder = `Digite a premissa ${i}`;

        if (valoresAtuais[i - 1]) {
            textarea.value = valoresAtuais[i - 1];
        }

        bloco.appendChild(label);
        bloco.appendChild(textarea);

        premissasContainer.appendChild(bloco);
    }
}


quantidadeTopicos.addEventListener("change", criarCamposPremissas);

criarCamposPremissas();


// ======================================================
// MOSTRAR CARREGAMENTO
// ======================================================

function mostrarCarregamento(mensagem) {
    resultado.style.display = "block";

    conteudoResultado.innerHTML = `
        <div class="carregando">
            <p><strong>${mensagem}</strong></p>
            <p>Aguarde alguns instantes...</p>
        </div>
    `;

    resultado.scrollIntoView({
        behavior: "smooth"
    });
}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHtml(texto) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// ======================================================
// MOSTRAR TEXTO GERADO
// ======================================================

function mostrarResultado(texto) {
    esbocoAtual = texto;

    btnExportarWord.style.display = "block";
    resultado.style.display = "block";


    // --------------------------------------------------
    // 1. REMOVE SOMENTE ÍCONES/EMOJIS INDESEJADOS
    // --------------------------------------------------

    let html = texto
        .replace(/📖/g, "")
        .replace(/🔥/g, "");


    // --------------------------------------------------
    // 2. PROTEÇÃO CONTRA HTML VINDO DA IA
    // --------------------------------------------------

    html = escaparHtml(html);


    // --------------------------------------------------
    // 3. TÍTULOS MARKDOWN
    // --------------------------------------------------

    html = html.replace(
        /^###\s+(.+)$/gm,
        "<h4>$1</h4>"
    );

    html = html.replace(
        /^##\s+(.+)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^#\s+(.+)$/gm,
        "<h2>$1</h2>"
    );


    // --------------------------------------------------
    // 4. NEGRITO MARKDOWN
    // --------------------------------------------------

    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // --------------------------------------------------
    // 5. NEGRITO AUTOMÁTICO DOS ELEMENTOS DO ESBOÇO
    // --------------------------------------------------

    html = html.replace(
        /(Texto-base:)/gi,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /(Subpremissa\s+\d+:)/gi,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /(Referência bíblica:)/gi,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /(Aplicação avivada:)/gi,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /(Fechamento avivado:)/gi,
        "<strong>$1</strong>"
    );


    // --------------------------------------------------
    // 6. CONCLUSÃO EM NEGRITO
    // --------------------------------------------------

    html = html.replace(
        /^(CONCLUSÃO|Conclusão:?)(\s*)$/gm,
        '<strong class="titulo-conclusao">$1</strong>'
    );


    // --------------------------------------------------
    // 7. TÓPICOS PRINCIPAIS NUMERADOS EM NEGRITO
    // --------------------------------------------------

    html = html.replace(
        /^(\d+\.\s+.+)$/gm,
        '<strong class="topico-principal">$1</strong>'
    );


    // --------------------------------------------------
    // 8. QUEBRAS DE LINHA
    // --------------------------------------------------

    html = html.replace(/\n/g, "<br>");


    // --------------------------------------------------
    // 9. CRIADOR E DATA
    // --------------------------------------------------

    const nomeCriador = criador.value.trim();
    const dataAtual = new Date().toLocaleDateString("pt-BR");

    let identificacaoFinal = "";

    if (nomeCriador) {
        identificacaoFinal += `
            <br><br>
            <strong>Criador:</strong> ${escaparHtml(nomeCriador)}
        `;
    }

    identificacaoFinal += `
        <br>
        <strong>Data de criação:</strong> ${dataAtual}
    `;


    // --------------------------------------------------
    // 10. EXIBIR RESULTADO
    // --------------------------------------------------

    conteudoResultado.innerHTML = `
        <div class="texto-esboco">
            ${html}

            <div class="identificacao-final">
                ${identificacaoFinal}
            </div>
        </div>
    `;

    resultado.scrollIntoView({
        behavior: "smooth"
    });
}


// ======================================================
// SUGERIR PREMISSAS
// ======================================================

btnSugerir.addEventListener("click", async () => {
    const textoBase = document.getElementById("textoBase").value.trim();
    const titulo = document.getElementById("titulo").value.trim();
    const quantidade = Number(quantidadeTopicos.value);

    if (!textoBase) {
        alert("Informe primeiro o texto-base.");
        return;
    }

    btnSugerir.disabled = true;
    btnSugerir.textContent = "Sugerindo...";

    try {
        const resposta = await fetch(`${API_URL}/sugerir-premissas`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                texto_base: textoBase,
                titulo: titulo,
                quantidade_topicos: quantidade
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Não foi possível sugerir as premissas."
            );
        }

        const linhas = dados.premissas
            .split("\n")
            .map((linha) => linha.trim())
            .filter((linha) => linha.length > 0);

        const campos =
            document.querySelectorAll(".campo-premissa");

        let indiceCampo = 0;

        for (const linha of linhas) {
            if (indiceCampo >= campos.length) {
                break;
            }

            const limpa = linha
                .replace(/^\d+[\.\)\-]\s*/, "")
                .replace(/^\*\*\d+[\.\)]?\s*/, "")
                .replace(/\*\*/g, "")
                .trim();

            if (limpa) {
                campos[indiceCampo].value = limpa;
                indiceCampo++;
            }
        }

        if (indiceCampo === 0) {
            alert(
                "A IA respondeu, mas não foi possível " +
                "organizar as premissas."
            );
        }

    } catch (erro) {
        console.error(erro);

        alert(
            "Erro ao sugerir premissas.\n\n" +
            erro.message +
            "\n\nVerifique se o backend está ligado."
        );

    } finally {
        btnSugerir.disabled = false;
        btnSugerir.textContent = "Sugerir premissas";
    }
});


// ======================================================
// GERAR ESBOÇO
// ======================================================

btnGerar.addEventListener("click", async () => {
    const textoBase =
        document.getElementById("textoBase").value.trim();

    const titulo =
        document.getElementById("titulo").value.trim();

    const quantidade =
        Number(quantidadeTopicos.value);

    const camposPremissas =
        document.querySelectorAll(".campo-premissa");

    if (!textoBase) {
        alert("Informe o texto-base.");
        return;
    }

    if (!titulo) {
        alert("Informe o título do sermão.");
        return;
    }

    const premissas = [];

    for (const campo of camposPremissas) {
        const texto = campo.value.trim();

        if (!texto) {
            alert(
                'Preencha todas as premissas ou use o botão ' +
                '"Sugerir premissas".'
            );

            campo.focus();
            return;
        }

        premissas.push(texto);
    }

    if (premissas.length !== quantidade) {
        alert(
            "A quantidade de premissas está incorreta."
        );
        return;
    }

    btnGerar.disabled = true;
    btnGerar.textContent = "GERANDO ESBOÇO...";

    mostrarCarregamento(
        "Organizando as premissas e preparando o esboço..."
    );

    try {
        const resposta = await fetch(
            `${API_URL}/gerar-esboco`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    texto_base: textoBase,
                    titulo: titulo,
                    quantidade_topicos: quantidade,
                    premissas: premissas
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Não foi possível gerar o esboço."
            );
        }

        mostrarResultado(dados.esboco);

    } catch (erro) {
        console.error(erro);

        conteudoResultado.innerHTML = `
            <div class="erro">
                <strong>
                    Não foi possível gerar o esboço.
                </strong>

                <br><br>

                ${escaparHtml(erro.message)}

                <br><br>

                Verifique se o backend está ligado.
            </div>
        `;

    } finally {
        btnGerar.disabled = false;
        btnGerar.textContent = "GERAR ESBOÇO";
    }
});


// ======================================================
// EXPORTAR PARA WORD
// ======================================================

btnExportarWord.addEventListener("click", async () => {

    if (!esbocoAtual) {
        alert("Gere primeiro um esboço.");
        return;
    }

    const titulo =
        document.getElementById("titulo").value.trim() ||
        "Esboço de Sermão";

    btnExportarWord.disabled = true;
    btnExportarWord.textContent = "GERANDO WORD...";

    try {
        const resposta = await fetch(`${API_URL}/exportar-word`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                esboco: esbocoAtual,
                titulo: titulo,
                criador: criador.value.trim(),
                data_criacao: new Date().toLocaleDateString("pt-BR")
            })
        });

        if (!resposta.ok) {
            let mensagem = "Não foi possível gerar o arquivo Word.";

            try {
                const dados = await resposta.json();

                if (dados.detail) {
                    mensagem = dados.detail;
                }

            } catch (e) {
                // Mantém a mensagem padrão
            }

            throw new Error(mensagem);
        }

        const arquivo = await resposta.blob();

        const url = window.URL.createObjectURL(arquivo);

        const link = document.createElement("a");

        link.href = url;

        let nomeArquivo = titulo
            .replace(/[\\/:*?"<>|]/g, "")
            .trim()
            .replace(/\s+/g, "_");

        if (!nomeArquivo) {
            nomeArquivo = "Esboco_de_Sermao";
        }

        link.download = `${nomeArquivo}.docx`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);

    } catch (erro) {
        console.error(erro);

        alert(
            "Erro ao exportar para Word.\n\n" +
            erro.message +
            "\n\nVerifique se o backend está ligado."
        );

    } finally {
        btnExportarWord.disabled = false;
        btnExportarWord.textContent = "EXPORTAR PARA WORD";
    }
});