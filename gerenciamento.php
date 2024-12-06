<?php

session_start();
//print_r($_SESSION);

if ((!isset($_SESSION['Matricula']) == true)){

}

// Conecta ao banco de dados (substitua com suas próprias configurações)
$conexao = new mysqli("localhost", "user", "boba3642", "bd_urna");

// Verifica a conexão
if ($conexao->connect_error) {
    die("Conexão falhou: " . $conexao->connect_error);
}

// Consulta todos os candidatos
$consultaCandidatos = "SELECT DISTINCT candidato FROM votos";
$resultadoCandidatos = $conexao->query($consultaCandidatos);

// Consulta o total de votos
$consultaTotalVotos = "SELECT COUNT(*) as total FROM votos";
$resultadoTotalVotos = $conexao->query($consultaTotalVotos);
$totalVotos = $resultadoTotalVotos->fetch_assoc()['total'];

// Consulta os votos
$consultaVotos = "SELECT candidato, COUNT(*) as total_votos FROM votos GROUP BY candidato";
$resultadoVotos = $conexao->query($consultaVotos);

// Consulta a quantidade total de matrículas na tabela "dados"
$consultaTotalMatriculas = "SELECT COUNT(DISTINCT Matricula) as total_matriculas FROM dados";
$resultadoTotalMatriculas = $conexao->query($consultaTotalMatriculas);
$totalMatriculas = $resultadoTotalMatriculas->fetch_assoc()['total_matriculas'];

// Consulta a quantidade de matrículas que votaram na tabela "Votos"
$consultaMatriculasVotaram = "SELECT COUNT(DISTINCT usuario_id) as matriculas_votaram FROM votos";
$resultadoMatriculasVotaram = $conexao->query($consultaMatriculasVotaram);
$matriculasVotaram = $resultadoMatriculasVotaram->fetch_assoc()['matriculas_votaram'];

// Cria um array associativo para armazenar os resultados de votos
$resultadosVotos = [];
while ($linhaVoto = $resultadoVotos->fetch_assoc()) {
    $resultadosVotos[$linhaVoto['candidato']] = $linhaVoto['total_votos'];
}

// Fecha a conexão
$conexao->close();
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados da Eleição</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            overflow-y: auto;
            background-image: url('img/teste.jpg');
            background-size: cover;
        }

        #titulo {
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 30px;
            top: 10%;
            left: 50%; /* Centraliza horizontalmente */
        }

        #logo {
            height: 120px;
            top: 40px;
            left: 40px;
            position: absolute;
        }

        h2 {
            color: #333;
            position: absolute;
            left: 50%; /* Centraliza horizontalmente */
            top: 20%;
            transform: translateX(-50%);
        }

        table {
            width: 50%;
            border-collapse: collapse;
            position: absolute;
            left: 50%; /* Centraliza horizontalmente */
            top: 30%;
            transform: translateX(-50%);
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            font-size: 23px;
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

        a:hover {
            color: #000000;
            text-decoration: underline;
        }

        #botaoImprimir {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            background-color: #00ff7f;
            border-radius: 4px;
            position: absolute;
            top: 15%;
            left: 80%;
        }

        #popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1;
        }

        #conteudoPopup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            text-align: center;
            z-index: 2;
            width: 100%; /* Largura do pop-up */
            height: 100%; /* Altura do pop-up */
        }

        #botaoFecharPopup {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            background-color: #ff0000;
            color: #fff;
            border-radius: 4px;
            margin-top: 10px;
        }

        #botaoImprimirPopup {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            background-color: #00ff7f;
            border-radius: 4px;
            margin-top: 10px;
        }

        .botoesPopUp{
            position: absolute;
            bottom: 20px; /* Ajuste conforme necessário para a posição desejada no final */
            left: 50%;
            transform: translateX(-50%);
        }
    </style>
</head>
<body>
    <div id="titulo">
        <h1>Votação CIPA 2023</h1>
        <img src="img/CIPA-removebg-preview.png" alt="" id="logo">
    </div>

    <div>
        <a class="sair" href="sair.php">Sair</a>
    </div>

    <div>
        <button id="botaoImprimir" onclick="imprimirTabela()">Imprimir Resultado</button>
    </div>

    <!-- Tabela de votos -->
    <h2>Resultados da Eleição</h2>
<table border="1">
    <tr>
        <th>Candidato</th>
        <th>Votos</th>
    </tr>
    <?php
    // Armazena os resultados em um array associativo
    $resultados = array();

    while ($linhaCandidato = $resultadoCandidatos->fetch_assoc()) {
        $candidato = $linhaCandidato['candidato'];
        $votos = isset($resultadosVotos[$candidato]) ? $resultadosVotos[$candidato] : 0;
        $resultados[$candidato] = $votos;
    }

    // Ordena o array pelos valores dos votos em ordem decrescente
    arsort($resultados);

    // Exibe os resultados ordenados na tabela
    foreach ($resultados as $candidato => $votos) {
        echo "<tr>
                <td>{$candidato}</td>
                <td>{$votos}</td>
              </tr>";
        }
        ?>

        <?php

        //<!-- Adiciona a linha com o total de matrículas que votaram -->
        echo "<tr>
                <td>Matrículas que Votaram</td>
                <td>{$matriculasVotaram}</td>
              </tr>";


        //<!-- Adiciona a linha com o total de matrículas -->
        echo "<tr>
                <td>Total de Matrículas</td>
                <td>{$totalMatriculas}</td>
              </tr>";

        //<!-- Adiciona a linha com o total de votos -->
        echo "<tr>
                <td>Total de Votos</td>
                <td>{$totalVotos}</td>
                </tr>";
        ?>
    </table>

    <!-- Pop-up 
    <div id="popup" onclick="fecharPopup()">
        <div id="conteudoPopup">
            <h1>Resultados da Eleição</h1>
            <table border="1">
                <tr>
                    <th>Candidato</th>
                    <th>Votos</th>
                </tr>
                 Resultados da consulta PHP-->
               <?php
                //while ($linhaCandidato = $resultadoCandidatos->fetch_assoc()) {
                    //$candidato = $linhaCandidato['candidato'];
                    //$votos = isset($resultadosVotos[$candidato]) ? $resultadosVotos[$candidato] : 0;
                   // echo "<tr>
                    //        <td>{$candidato}</td>
                        //    <td>{$votos}</td>
                      //    </tr>";
                //}
                ?>
                <?php
                //<!-- Adiciona a linha com o total de votos -->
               // echo "<tr>
                  //      <td>Total de Votos</td>
                  //      <td>{$totalVotos}</td>
                  //    </tr>";
                //<!-- Adiciona a linha com o total de matrículas -->
               // echo "<tr>
                 //       <td>Total de Matrículas</td>
                 //       <td>{$totalMatriculas}</td>
                 //     </tr>";
                //<!-- Adiciona a linha com o total de matrículas que votaram -->
               // echo "<tr>
                //        <td>Matrículas que Votaram</td>
                //        <td>{$matriculasVotaram}</td>
                 //     </tr>";
                ?>
          <!--  </table>

      <div class ="botoesPopUp">
            <button id="botaoFecharPopup" onclick="fecharPopup()">Fechar</button>
            <button id="botaoImprimirPopup" onclick="imprimirTabela()">Imprimir</button>
        </div>
        </div>
    </div>-->

    <script>
        function abrirPopup() {
            document.getElementById("popup").style.display = "block";
        }

        function fecharPopup() {
            document.getElementById("popup").style.display = "none";
        }

        function imprimirTabela() {
            window.print();
        }
    </script>
</body>
</html>
