// Check if there is already a prize amount in localStorage
let premiacao = localStorage.getItem('premiacao');

if (!premiacao) {
    // Generate a random number between 100 million and 600 million
    premiacao = Math.floor(Math.random() * (600000000 - 100000000 + 1)) + 100000000;

    // Store the prize amount in localStorage
    localStorage.setItem('premiacao', premiacao);
}

// Format the prize amount with a dot every three digits
let premiacaoFormatada = parseInt(premiacao).toLocaleString('pt-BR');

// Display the prize amount on the page
document.getElementById('premiacao').innerHTML = 'A premiação dessa edição é de:<br>R$ ' + premiacaoFormatada + '!';