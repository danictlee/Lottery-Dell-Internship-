let sorteados = [];
let rodadas = 0;
let vencedores = [];


const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

let openRequest = indexedDB.open("apostasLeeteria"); // open the database

openRequest.onerror = function () {
    console.error("Erro com o IndexedDB", openRequest.error);
};

openRequest.onsuccess = function () {
    db = openRequest.result; // Save the database in the db variable
};

let db; // Declare the db variable


window.onload = function() {
    // Hide the table headers
    document.getElementById('tabelaFrequentes').getElementsByTagName('thead')[0].style.display = 'none';
    let sorteadosStorage = localStorage.getItem('sorteados');

    if (sorteadosStorage) {
        // If there is a draw saved in localStorage, load it
        sorteados = JSON.parse(sorteadosStorage);
    } else {
        // If there is no draw saved, start a new draw
        sorteados = [];
    }

    let rodadasStorage = localStorage.getItem('rodadas'); // Load rounds from localStorage
    if (rodadasStorage) { // If there are rounds saved in localStorage, load them
        rodadas = JSON.parse(rodadasStorage); 
    } else {
        rodadas = 0; // If there are no rounds saved, start from 0
    }
};

function sortearNum() { // Draw a number
    if (sorteados.length >= 30) { // If there are already 30 numbers drawn, stop drawing
        let sorteadosStorage = localStorage.getItem('sorteados');  // Load the draw from localStorage
        if (sorteadosStorage) { // If there is a draw saved in localStorage, load it
            sorteados = JSON.parse(sorteadosStorage);  
        } else { 
            sorteados = [];
        }
    } else {
        let num = Math.floor(Math.random() * 50) + 1; // Draw a number between 1 and 50
        if (sorteados.indexOf(num) == -1) { // If the number has not been drawn yet, add it to the draw
            sorteados.push(num); // Add the number to the draw
            localStorage.setItem('sorteados', JSON.stringify(sorteados)); // Save the draw to localStorage
            rodadas++; // Increment the number of rounds
            localStorage.setItem('rodadas', JSON.stringify(rodadas)); // Save rounds to localStorage
        } else {
            sortearNum(); // If the number has already been drawn, draw another number
        }
    }
};

function alguemVenceu() { // Check if someone won   
    let db = openRequest.result; // Open the database
    let transaction = db.transaction(["apostas"], "readonly"); // Start a transaction in read mode
    let store = transaction.objectStore("apostas");
    let request = store.getAll();

    request.onsuccess = function() { 
        let apostas = request.result; // Save the bets in the apostas variable

        for (let i = 0; i < apostas.length; i++) { // Loop through the bets
            let aposta = apostas[i];
            let count = 0;

            for (let j = 0; j < sorteados.length; j++) { // Loop through the drawn numbers
                if (aposta.numeros.indexOf(sorteados[j]) != -1) {
                    count++;
                }
            }

            if (count >= 5) { // If the bettor has guessed 5 or more numbers, they win
                vencedores.push(aposta); // Add the winner to the winners list
            }
        }

        // Sort the winners by name
        vencedores.sort((a, b) => a.nome.localeCompare(b.nome)); 

        if (vencedores.length > 0) { // If there are winners, award them
            apuracao(apostas);
        } else if (sorteados.length < 30) { // If there are no winners and there are still numbers to be drawn, draw more numbers
            sortearNum();
            alguemVenceu();
            premiarVencedores(vencedores);
        } else { // If there are no winners and there are no more numbers to be drawn, show the results
            apuracao(apostas);
        }
    };
}

document.getElementById("comecarSorteio").addEventListener("click", function() { // Start the draw
    for (let i = 0; i < 5; i++) {
        sortearNum(); // Draw 5 or more numbers
    }
    alguemVenceu(); // Check if someone won

    // Hide the button after it is clicked and show the results
    this.style.display = 'none';
});

function preencherTabelaFrequentes(numerosOrdenados) { // Fill the table with the most frequent numbers
    let tabelaFrequentes = document.getElementById('tabelaFrequentes');
    let tbody = tabelaFrequentes.getElementsByTagName('tbody')[0];

    for (let i = 0; i < numerosOrdenados.length; i++) {
        let numero = numerosOrdenados[i][0];
        let frequencia = numerosOrdenados[i][1];

        let linha = tbody.insertRow();
        let celulaNumero = linha.insertCell(0);
        let celulaFrequencia = linha.insertCell(1);

        celulaNumero.textContent = numero;
        celulaFrequencia.textContent = frequencia;
    }
// Show winner's table and header
tabelaFrequentes.getElementsByTagName('thead')[0].style.display = 'table-header-group';
tbody.parentElement.style.display = 'table';
}

function apuracao(apostas) { // Show the results
    let resultsDiv = document.getElementById('results');  

    // a. the list of drawn numbers
    let drawnNumbersP = document.createElement('p');
    drawnNumbersP.textContent = "Números sorteados: " + sorteados.join(', ');
    resultsDiv.appendChild(drawnNumbersP);

    // b. how many rounds of draw were held
    let roundsP = document.createElement('p');
    roundsP.textContent = "Rodadas de sorteio: " + (rodadas - 4); // Subtract 4 from the number of rounds to get the number of rounds of draw because the first 5 numbers are technically all drawn in a single round
    resultsDiv.appendChild(roundsP);

    // c. the number of winning bets
    let winnersP = document.createElement('p');
    winnersP.textContent ="Quantidade de apostas vencedoras: " + vencedores.length; 
    resultsDiv.appendChild(winnersP);

    // d. the list of winning bets (sorted alphabetically by the name of the bettors) or a message that there were no winners
    if (vencedores.length > 0) {
        premiarVencedores(vencedores); // call premiarVencedores(vencedores) here - because i can show the winnings w/ the info of the winners
    } else {
        let noWinnersP = document.createElement('p');
        noWinnersP.textContent = "Não houveram vencedores. Mais sorte na próxima vez!"; 
        resultsDiv.appendChild(noWinnersP); 
    }

    // e. a list of all the numbers bet, considering all the bets, ordered from the most chosen number to the least chosen.
    let numerosApostados = {};
    apostas.forEach(aposta => { // Loop through the bets
        aposta.numeros.forEach(numero => { // Loop through the numbers of each bet
            if (numerosApostados[numero]) { // If the number is already in the object, increment its frequency
                numerosApostados[numero]++; // Increment the frequency of the number
            } else {
                numerosApostados[numero] = 1; // If the number is not in the object, add it with a frequency of 1
            }
        });
    });

     // Transform numerosApostados into an array of [number, frequency] pairs
    let numerosOrdenados = Object.entries(numerosApostados);

    // Sort the array by frequency in descending order
    numerosOrdenados.sort((a, b) => b[1] - a[1]);

    preencherTabelaFrequentes(numerosOrdenados);
}

function resetDatabase() { // Delete the database and create it again, erasing saved bets
    // Close the database before deleting it
    db.close();

    // Delete the database
    let deleteRequest = indexedDB.deleteDatabase("apostasLeeteria");

    deleteRequest.onerror = function() {
        console.error("Erro ao deletar o banco de dados.");
    };

    deleteRequest.onsuccess = function() {
        console.log("Banco de dados deletado com sucesso.");

        // Now that the database is deleted, you can create it again
        openRequest = indexedDB.open("apostasLeeteria");

        openRequest.onerror = function() {
            console.error("Erro ao criar o banco de dados."); 
        };

        openRequest.onsuccess = function() {
            db = openRequest.result;
            console.log("Banco de dados criado com sucesso."); // when i was testing, i used this to check if the database was being created properlly
        };

      
    };
}
function premiarVencedores(vencedores) { // Award the winners
    let premiacao = parseInt(localStorage.getItem('premiacao')); 
    let premiacaoPorVencedor = premiacao / vencedores.length; // pretty simple soluction actually, just the prize divided by the number of winners
    let tabelaVencedores = document.getElementById('tabelaVencedores').getElementsByTagName('tbody')[0];

    if (vencedores.length > 0) {
        for (let i = 0; i < vencedores.length; i++) {
            let vencedor = vencedores[i];
            let premiacaoFormatada = premiacaoPorVencedor.toLocaleString('pt-BR'); // Format the prize amount with a dot every three digits

            let linha = tabelaVencedores.insertRow(); // here's the table
            let celulaNumAposta = linha.insertCell(0); 
            let celulaCpf = linha.insertCell(1);
            let celulaNome = linha.insertCell(2);
            let celulaNumeros = linha.insertCell(3);
            let celulaPremiacao = linha.insertCell(4);

            celulaNumAposta.textContent = vencedor.numAposta; 
            celulaCpf.textContent = vencedor.cpf;
            celulaNome.textContent = vencedor.nome;
            celulaNumeros.textContent = vencedor.numeros.join(', ');
            celulaPremiacao.textContent = 'R$ ' + premiacaoFormatada;
        }

        tabelaVencedores.parentElement.style.display = 'table'; // if there are winners, there is a table
    } else {
        tabelaVencedores.parentElement.style.display = 'none'; // if there are no winners, there ins't a table
    }
}


finalizarEdicaoBtn.addEventListener('click', function(event) { // Finishing the edition
    var confirma = confirm("Deseja finalizar essa edição?"); // check if the user wants to finish the edition
    if (confirma == false) {  // if the user doesn't want to finish the edition, do nothing
        event.preventDefault();
        return; // Exit the function
    }
    else if (confirma == true) {
        alert("Essa edição foi finalizada!"); // ok, it's over
    }

    resetDatabase();

    // Reset all variables to their initial states
    sorteados = [];
    localStorage.removeItem('sorteados');
    localStorage.removeItem('modoSorteio');
    localStorage.removeItem('rodadas');
    localStorage.removeItem('premiacao');
    rodadas = 0;
    vencedores = [];


    // Redirect to the home page
    window.location.href = 'inicio.html'; // back to the home page
});