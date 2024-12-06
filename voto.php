<?php

session_start();
//print_r($_SESSION);

if ((!isset($_SESSION['CPF']) == true) and (!isset($_SESSION['Matricula']) == true)){
    unset($_SESSION['CPF']);
    unset($_SESSION['Matricula']);
    header('Location:index.php');
}
$logado = $_SESSION['Matricula'];

?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FC2024</title>
    <link rel="stylesheet" href="voto.css">

    <!-- <style>

        html {
            height: 100%;
            background-image: linear-gradient(to bottom,white,rgb(99, 241, 99) );
            background-size: cover;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            overflow-y: auto;
        }

        #titulo {
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 30px;
        }

        #logo {
            height: 120px;
            top: 40px;
            left: 40px;
            position: absolute;
        }

        .candidato-botao {
            display: flex;
            width: 101px;
            height: 200px;
            background-size: cover;
            text-indent: -9999px;
            margin: 0 auto;
            top: 40%;
            position: absolute;
            left: 15%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            align-items: center;
            

        }
        /* left de 20% em 20%    <button id="botao5" class="candidato-botao">Votar na Lisa</button> */
        /* top:70%; Posiciona o segundo botão abaixo do primeiro */


        #botao1 {
            background-image: url('img/1-removebg-preview.png' );
            left: 16%;
        }

        #botao2 {
            background-image: url('img/2-removebg-preview.png');
            left: 24%; 
        }

        #botao3 {
            background-image: url('img/3-removebg-preview.png');
             left:32%;
        }   
        
        #botao4 {
            background-image: url('img/4-removebg-preview.png');
            left:40%;
        }

        #botao5 {
            background-image: url('img/5-removebg-preview.png');
            left: 48%;

        }
        #botao6 {
            background-image: url('img/6-removebg-preview.png');
            left: 56%;

        }
        #botao7 {
            background-image: url('img/7-removebg-preview.png');
            left: 64%;

        }
        #botao8 {
            background-image: url('img/8-removebg-preview.png');
            left: 72%;

        }
        #botao9 {
            background-image: url('img/9-removebg-preview.png');
            left: 80%;
        }

        #botao10 {
            background-image: url('img/10-removebg-preview.png' );
            left: 16%;
            top: 75%;
        }

        #botao11 {
            background-image: url('img/11-removebg-preview.png');
            left: 24%;
            top: 75%; 
        }

        #botao12 {
            background-image: url('img/12-removebg-preview.png');
             left:32%;
             top: 75%;
        }   
        
        #botao13 {
            background-image: url('img/13-removebg-preview.png');
            left:40%;
            top: 75%;
        }

        #botao14 {
            background-image: url('img/14-removebg-preview.png');
            left: 48%;
            top: 75%;
        }
        #botao15 {
            background-image: url('img/15-removebg-preview.png');
            left: 56%;
            top: 75%;
        }
        #botao16 {
            background-image: url('img/16-removebg-preview.png');
            left: 64%;
            top: 75%;
        }
        #botao17 {
            background-image: url('img/17-removebg-preview.png');
            left: 72%;
            top: 75%;
        }

        #botaob {
            left: 80%;
            top: 75%;
            

        }

        .centro{
            text-align: center;
        }

        .popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            justify-content: center;
            align-items: center;
            z-index: 1;
            
        }

        .popup-conteudo {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
        }

        .fechar {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            font-size: 24px;
            color: rgba(0, 0, 0, 0.0);
        }

        .popup-conteudo button {
            padding: 10px 20px;
            margin: 10px;
            background-color: #007BFF;
            color: #fff;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }

        .popup-conteudo button:hover {
            background-color: #0056b3;
        }
        .nomec{
            margin: 10px;
            padding: 10px;
            font-family: Arial, Helvetica, sans-serif;
        }

        #fotter{
            position: absolute;
            bottom: 0;
            left: 2%;
        }
        .sair {
            background-color: #00ff7f;
            border-radius: 4px;
            font-size: 30px;
            cursor: pointer;
            left: 90%;
            top: 5%;
            position: absolute;
            text-decoration: none;
        }   
    </style> -->
</head>
<body>

    <h1 class="titulo" >ELEIÇÃO CIPA 2024</h1>
    <img class="logo" src="img/logo.png" alt="">



<div class="centro">
    <div class="primeiro">
<button id="botao1" class="candidato-botao">Votar no #01_Peter</button>
<button id="botao2" class="candidato-botao">Votar no #02_Homer</button>
<!-- <button id="botao3" class="candidato-botao">Votar no #03_Moabe</button>
<button id="botao4" class="candidato-botao">Votar no #04_Almir</button>
<button id="botao5" class="candidato-botao">Votar no #05_Sheiny</button>
<button id="botao6" class="candidato-botao">Votar no #06_Nivaldo</button>
<button id="botao7" class="candidato-botao">Votar no #07_Jefferson</button>
<button id="botao8" class="candidato-botao">Votar no #08_Rogerio_L</button>
<button id="botao9" class="candidato-botao">Votar no #09_Wilams</button>
<button id="botao10" class="candidato-botao">Votar no #10_Wesley</button>
<button id="botao11" class="candidato-botao">Votar no #11_Gabriel</button>
<button id="botao12" class="candidato-botao">Votar no #12_Djane</button>
<button id="botao13" class="candidato-botao">Votar no #13_Jaciane</button>
<button id="botao14" class="candidato-botao">Votar no #14_Vanderson</button>
<button id="botao15" class="candidato-botao">Votar no #15_Karla</button>
<button id="botao16" class="candidato-botao">Votar no #16_Rinaldo</button>
<button id="botao17" class="candidato-botao">Votar no #17_Wendio</button> -->

</div>

<button id="botaob" class="candidato-botao">Votar em Branco</button>
</div>

<div id="meuPopUp" class="popup">
    <div class="popup-conteudo">
        <span class="fechar" id="fecharPopUp">&times;</span>
        <h1>COMPROVANTE DE VOTAÇÃO CIPA 2024</h1>
        <h2>Confirma? <p id="candidatoSelecionado"></p> </h2>

        <button id="confirmarVoto">Confirmar</button>
        <button id="cancelarVoto">Cancelar</button>
    </div>
</div>
<footer class="fotter"> 
    <h3>Desenvolvido por Anthony Mederios. Aprendiz de Ti Ferreira Costa Caruaru  </h3>
</footer>

<div>
    <a class="sair" href="sair.php">Sair</a>
</div>
<script>
    document.addEventListener("DOMContentLoaded", function () {
        const meusBotoes = document.querySelectorAll(".candidato-botao");
        const meuPopUp = document.getElementById("meuPopUp");
        const fecharPopUp = document.getElementById("fecharPopUp");
        const confirmarVoto = document.getElementById("confirmarVoto");
        const cancelarVoto = document.getElementById("cancelarVoto");
        const candidatoSelecionadoText = document.getElementById("candidatoSelecionado");

        // Recupera a matrícula da URL
        const urlParams = new URLSearchParams(window.location.search);
        const matriculaUsuario = urlParams.get('matricula');

        let candidatoSelecionado = '';

        meusBotoes.forEach(function (botao) {
            botao.addEventListener("click", function () {
                if (matriculaUsuario) {
                    const candidatoNome = botao.textContent.trim().split(" ").pop();
                    candidatoSelecionado = `${candidatoNome}`;
                    candidatoSelecionadoText.innerHTML = `Você está votando no Candidato <br> <br><span style="font-weight: bold; color: #000000; text-decoration: underline">${candidatoSelecionado}</span><br><br> Por medidas de segurança, ao confirmar, insira o comprovante na urna ao lado.`;
                    meuPopUp.style.display = "block";
                }
            });
        });

        fecharPopUp.addEventListener("click", function () {
            meuPopUp.style.display = "none";
        });

        cancelarVoto.addEventListener("click", function () {
            meuPopUp.style.display = "none";
        });

        confirmarVoto.addEventListener("click", function () {
            // Envia a matrícula e o voto para o servidor
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "sistema.php", true);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            audio.play();

            // Monta os dados a serem enviados
            const dados = "matricula=" + encodeURIComponent(matriculaUsuario) + "&voto=" + encodeURIComponent(candidatoSelecionado);

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    alert(xhr.responseText);
                    audio.play();

                    // Após o voto ser registrado com sucesso, inicia a impressão
                    window.print();
                    
                    // Redireciona para a página de saída
                    window.location.href = "sair.php";
                }
            };

            // Envia os dados para o servidor
            xhr.send(dados);
        });

        window.addEventListener("click", function (event) {
            if (event.target === meuPopUp) {
                meuPopUp.style.display = "none";
            }
        });
    });

    const audio = new Audio();
    audio.src = "urna.mp3";
</script>

</body>
</html>
