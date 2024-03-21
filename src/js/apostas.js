
const numApostados = [];
let modoSorteio = false;

// IndexedDB, the database that will be used to store the bets
const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

let openRequest = indexedDB.open("apostasLeeteria", 2); // open the database

openRequest.onerror = function () {
    console.error("Erro com o IndexedDB", openRequest.error);
};

openRequest.onupgradeneeded = function(e) { // create the object store and indexes(atributes)
    let db = e.target.result;
    if (!db.objectStoreNames.contains('apostas')) {
        let apostas = db.createObjectStore('apostas', { keyPath: "id", autoIncrement: true });
        apostas.createIndex("numAposta", ["numAposta"], { unique: true });
        apostas.createIndex("nome", ["nome"], { unique: false });
        apostas.createIndex("cpf", ["cpf"], { unique: false });
        apostas.createIndex("numeros", ["numeros"], { unique: false });
    }
};

let db;

openRequest.onsuccess = function () {
    db = openRequest.result;
};


function selecionarNum(numero) { // when a number is selected...
 if (numApostados.length < 5) {
        // There is room for more numbers, so select it
        numApostados.push(numero);
        travaNumSelecionado(numero);
    }
}

//function destravaNumSelecionado(numero) {   - it should work but it just didn't. but still, i tried to implement it.
//    let button = document.getElementById("num_" + numero);
//    if (button) {
//        button.disabled = false;
//        button.style.background = "#ffffff";
//        button.style.color = "#ef1010";
//    }
//}

function travaNumSelecionado(numero) {
    document.getElementById("num_" + numero).disabled = true; // disables the number button
    document.getElementById("num_" + numero).style.background = "#009e4c";
    document.getElementById("num_" + numero).style.color = "#ffffff";
}

function limpar() {
    //limpa a lista de números apostados
    numApostados.length = 0;
    // habilita todos os números
    for (let i = 1; i <= 50; i++) {
        document.getElementById("num_" + i).disabled = false; // enables all the numbers again
        document.getElementById("num_" + i).style.background = "#000";
        document.getElementById("num_" + i).style.color = "rgb(32, 159, 218)";
    }
}

function surpresinha() {
    numApostados.length = 0; // clear the list of numbers bet
    for (let i = 1; i <= 50; i++) { // enable all the numbers
        document.getElementById("num_" + i).disabled = false;
        document.getElementById("num_" + i).style.background = "#000";
        document.getElementById("num_" + i).style.color = "rgb(32, 159, 218)";
    }

    // generate 5 random numbers
    for (let i = 0; i < 5; i++) {
        let num = Math.floor(Math.random() * 50) + 1;
        if (!numApostados.includes(num)) {
            selecionarNum(num); // and add them to the list of numApostados
        } else {
            i--;
        }
    }
}

document.getElementById("salvarApostaButton").addEventListener("click", function () {
    
    if (localStorage.getItem('modoSorteio') === 'true') { // check if the draw phase has already started
        alert("A fase de apostas já foi finalizada!");
        return;
    }
    else { 
// get the name and cpf of the user
let nome = document.getElementById("nomeText").value;
let cpf = document.getElementById("cpfText").value;

if (!/^[a-zA-Z\s]*$/.test(nome)) { // check if the name contains only letters
    alert("O nome deve conter apenas letras!");
    return;
}

// check if the user has selected 5 numbers
if (numApostados.length < 5) {
    alert("Selecione 5 números para fazer a aposta!"); // check if the user has selected 5 numbers
    return;
}

// check if the user has entered a name
if (nome === "") {
    if (cpf === "") {
        alert("Digite o seu nome e o seu CPF para fazer a aposta!"); // check if the user has entered a name and a CPF number
    }
    else {
        alert("Digite o seu nome para fazer a aposta!"); // check if the user has entered a name
    }
    return;
}

// check if the user typed a CPF number
if (cpf === "") {
    alert("Digite o seu CPF para fazer a aposta!");
    return;
}

let cpfDigitos = cpf.replace(/\D/g, ""); // Remove all non-digits

// Check if the CPF has exactly 11 digits
if (cpfDigitos.length !== 11) {
    alert("O CPF deve conter exatamente 11 dígitos!");
    return;
}

let transaction = db.transaction(["apostas"], "readonly");
let apostas = transaction.objectStore("apostas");
let countRequest = apostas.count();
countRequest.onsuccess = function() {
    let numDaAposta = countRequest.result + 1000; // get the number of the bet, which starts at 1000

    // create an object with the user's data
    let aposta = {
        numAposta: numDaAposta,
        nome: nome,
        cpf: cpf,
        numeros: numApostados,
    };
    salvarAposta(aposta); // save the bet
};
    }
});
    

document.getElementById("cpfText").addEventListener("input", function (cpfText) {
    let value = cpfText.target.value;
    let digits = value.replace(/\D/g, ""); // Remove all non-digits
    if (digits.length <= 11) {
        value = digits.replace(/(\d{3})(?=\d)/, "$1."); // Add a dot after the 3rd digit
        value = value.replace(/(\d{3})(?=\d)/, "$1."); // Add a dot after the 6th digit
        value = value.replace(/(\d{3})(\d{2})$/, "$1-$2"); // Add a dash after the 9th digit
        cpfText.target.value = value; // Update the input value
    } else {
        cpfText.target.value = value.substring(0, 14); // Limit the input to 14 characters
    }
});

document.getElementById("finalizarApostaButton").addEventListener("click", function (event) {
    

    var confirma = confirm("Deseja finalizar a fase de apostas?"); // check if the user wants to finish the bet phase
    if (confirma == false) {
        event.preventDefault(); // if the user doesn't want to finish the bet phase, do nothing
        return;
    }
    else if (confirma == true) {
        localStorage.setItem('modoSorteio', 'true'); // if the user wants to finish the bet phase, set the draw phase to true, so no more bets can be made
        alert("Fase de apostas finalizada!"); 
    }
});



function salvarAposta(aposta) {
    
        // Open a transaction to the database
        let transaction = db.transaction(["apostas"], "readwrite");

        // Get the object store from the transaction
        let apostas = transaction.objectStore("apostas");

         apostas.add(aposta); // Add the bet to the object store

        transaction.oncomplete = function() {
            alert("Aposta salva com sucesso!"); 
            location.reload();  // Reload the page 
        }
        transaction.onerror = function() {
            alert("Erro ao salvar a aposta!"); 
        }
    ;
}

document.getElementById("listarApostasButton").addEventListener("click", function () {
    
    // Disable the button
    document.getElementById("listarApostasButton").disabled = true;

    let transaction = openRequest.result.transaction(["apostas"], "readonly");
    let apostas = transaction.objectStore("apostas");
    let cursor = apostas.openCursor();
    let store = transaction.objectStore("apostas");
    let request = store.getAll();
    cursor.onsuccess = function () {
        let aposta = cursor.result;
        const quantidade = request;
        if (aposta) {
            // Get the table from the HTML
            let table = document.getElementById("apostasTable");
            if (table.style.display == "") { 
                let tableBody = document.getElementById("apostasTableBody"); 
                const header = document.getElementById("headerResult");
                header.style.display = '';

                // Create a new row and cells
                let row = document.createElement("tr");
                let numeroAposta = document.createElement("th");
                let nomeCell = document.createElement("td");
                let cpfCell = document.createElement("td");
                let numerosCell = document.createElement("td");

                // Set the text of the cells
                numeroAposta.textContent = aposta.value.numAposta;
                nomeCell.textContent = aposta.value.nome;
                cpfCell.textContent = aposta.value.cpf;
                numerosCell.textContent = aposta.value.numeros.join(", ");

                // Add the cells to the row
                row.appendChild(numeroAposta);
                row.appendChild(nomeCell);
                row.appendChild(cpfCell);
                row.appendChild(numerosCell);

                // Add the row to the table
                tableBody.appendChild(row);

                aposta.continue();
            }
        };
        cursor.onerror = function () { 
            console.log("Error listing apostas: ", cursor.error); 
        };
    }
});




