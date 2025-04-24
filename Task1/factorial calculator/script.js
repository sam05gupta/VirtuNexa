document.getElementById('calculateIterative').addEventListener('click', function() {
    const number = parseInt(document.getElementById('numberInput').value);
    if (isNaN(number) || number < 0) {
        alert('Please enter a valid positive integer.');
        return;
    }
    const result = factorialIterative(number);
    document.getElementById('result').innerText = `Factorial of ${number} (Iterative): ${result}`;
});

document.getElementById('calculateRecursive').addEventListener('click', function() {
    const number = parseInt(document.getElementById('numberInput').value);
    if (isNaN(number) || number < 0) {
        alert('Please enter a valid positive integer.');
        return;
    }
    const result = factorialRecursive(number);
    document.getElementById('result').innerText = `Factorial of ${number} (Recursive): ${result}`;
});

function factorialIterative(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function factorialRecursive(n) {
    if (n === 0) return 1;
    return n * factorialRecursive(n - 1);
}

function displayResult(result, method) {
    document.getElementById('result').innerText = `Factorial: ${result} (Method: ${method})`;
}