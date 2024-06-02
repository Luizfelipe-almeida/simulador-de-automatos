const fs = require('fs');
const csv = require('csv-parser');
const { performance } = require('perf_hooks');

// Função para simular um DFA
function simulateDFA(dfa, inputString) {
    let currentStates = [dfa.initial];

    for (let symbol of inputString) {
        let nextStates = [];
        for (let currentState of currentStates) {
            const transitions = dfa.transitions.filter(t => t.from === currentState && t.read === symbol);
            nextStates.push(...transitions.map(t => t.to));
        }
        currentStates = nextStates;
    }

    // Verifica se todos os estados atuais são estados finais
    return currentStates.every(state => dfa.final.includes(state));
}



// Função principal para ler os arquivos e simular o autômato
function main() {
    if (process.argv.length < 5) {
        console.error("Uso: node simulador.js <arquivo_do_automato> <arquivo_de_testes> <arquivo_de_saida>");
        process.exit(1);
    }

    const automatonFile = process.argv[2];
    const testFile = process.argv[3];
    const outputFile = process.argv[4];

    // Leitura do arquivo de especificação do autômato
    fs.readFile(automatonFile, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de autômato:", err);
            process.exit(1);
        }

        const automaton = JSON.parse(data);

        // Processamento das entradas de teste
        let results = [];

        fs.createReadStream(testFile)
            .pipe(csv({ separator: ';', headers: ['input', 'expected'] }))
            .on('data', (row) => {
                let inputString = row.input;
                let expectedResult = row.expected === '1';

                const start = performance.now();

                let obtainedResult = simulateDFA(automaton, inputString);

                const end = performance.now();
                const timeTaken = (end - start).toFixed(4);

                results.push(`${inputString};${expectedResult};${obtainedResult};${timeTaken}`);
            })
            .on('end', () => {
                // Escrita dos resultados no arquivo de saída
                fs.writeFile(outputFile, results.join('\n'), 'utf8', (err) => {
                    if (err) {
                        console.error("Erro ao escrever o arquivo de saída:", err);
                        process.exit(1);
                    }
                    console.log("Resultados escritos com sucesso no arquivo de saída.");
                });
            });
    });
}

main();
