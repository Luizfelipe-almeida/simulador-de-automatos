const fs = require('fs');
const csv = require('csv-parser');
const { performance } = require('perf_hooks');

// Função para simular um DFA
function simulateDFA(dfa, inputString) {
    let currentStates = new Set([dfa.initial]);

    // Função auxiliar para processar transições epsilon
    function processEpsilonTransitions(states) {
        let stack = [...states];
        let visited = new Set(stack);

        while (stack.length > 0) {
            let state = stack.pop();
            let epsilonTransitions = dfa.transitions.filter(t => t.from === state && t.read === null);
            for (let transition of epsilonTransitions) {
                if (!visited.has(transition.to)) {
                    visited.add(transition.to);
                    stack.push(transition.to);
                }
            }
        }

        return visited;
    }

    // Processar transições epsilon a partir do estado inicial
    currentStates = processEpsilonTransitions(currentStates);

    for (let symbol of inputString) {
        let nextStates = new Set();
        for (let currentState of currentStates) {
            const transitions = dfa.transitions.filter(t => t.from === currentState && t.read === symbol);
            for (let transition of transitions) {
                nextStates.add(transition.to);
            }
        }
        currentStates = processEpsilonTransitions(nextStates);
    }

    // Verifica se algum dos estados atuais é um estado final
    for (let state of currentStates) {
        if (dfa.final.includes(state)) {
            return true;
        }
    }
    return false;
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
        let results = ["input;expected;obtained;time"]; // Adiciona cabeçalho

        fs.createReadStream(testFile)
            .pipe(csv({ separator: ';', headers: ['input', 'expected'], skipLines: 1 })) // Pula cabeçalho
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
