document.addEventListener("DOMContentLoaded", function () {
    const meuBotao = document.querySelector("#botao1", "#botao2");
    const meuPopUp = document.getElementById("meuPopUp");
    const fecharPopUp = document.getElementById("fecharPopUp");
    const botao1 = document.getElementById("butao1");
    const botao2 = document.getElementById("butao2");

    meuBotao.addEventListener("click", function (e) {
        e.preventDefault();
        meuPopUp.style.display = "block";
    });

    fecharPopUp.addEventListener("click", function () {
        meuPopUp.style.display = "none";
    });

    botao1.addEventListener("click", function () {
        // Ação a ser executada quando o Botão 1 for clicado
        alert("Seu voto foi registrado!");   
        audio.play();
        window.location.href = "index.php";
    });

    botao2.addEventListener("click", function () {
        // Ação a ser executada quando o Botão 2 for clicado
        meuPopUp.style.display = "none";
        
    });

    window.addEventListener("click", function (event) {
        if (event.target === meuPopUp) {
            meuPopUp.style.display = "none";
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const meuBotao = document.querySelector("#botao2");
    const meuPopUp = document.getElementById("meuPopUp");
    const fecharPopUp = document.getElementById("fecharPopUp");
    const boteao1 = document.getElementById("butao1");
    const boteao2 = document.getElementById("butao2");

    meuBotao.addEventListener("click", function (e) {
        e.preventDefault();
        meuPopUp.style.display = "block";
    });

    fecharPopUp.addEventListener("click", function () {
        meuPopUp.style.display = "none";
    });

    boteao1.addEventListener("click", function () {
        // Ação a ser executada quando o Botão 1 for clicado
        alert("Seu voto foi registrado!");
        audio.play();
        window.location.href = "index.html";
    });

    boteao2.addEventListener("click", function () {
        // Ação a ser executada quando o Botão 2 for clicado
        meuPopUp.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === meuPopUp) {
            meuPopUp.style.display = "none";
        }
    });
});

const audio = new Audio();
audio.src = "./urna.mp3";
