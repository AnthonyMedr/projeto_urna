<?php
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['voto']) && isset($_POST['matricula'])) {
        include_once('config.php');

        $voto = $_POST['voto'];
        $matricula = (int)$_POST['matricula']; // Garante que seja um número inteiro

        // Verifica se a matrícula não está vazia
        if (empty($matricula)) {
            echo "Matrícula não fornecida!";
            exit();
        }

        // Verifica se a matrícula existe na tabela dados
        $verificarMatricula = "SELECT Matricula FROM dados WHERE Matricula = ?";
        $stmtMatricula = $conexao->prepare($verificarMatricula);
        $stmtMatricula->bind_param("i", $matricula);
        $stmtMatricula->execute();
        $stmtMatricula->store_result();

        if ($stmtMatricula->num_rows > 0) {
            // Matrícula encontrada, verifica se já votou
            $verificarVoto = "SELECT votou FROM votos WHERE usuario_id = ?";
            $stmtVoto = $conexao->prepare($verificarVoto);
            $stmtVoto->bind_param("i", $matricula);
            $stmtVoto->execute();
            $stmtVoto->store_result();

            if ($stmtVoto->num_rows > 0) {
                $stmtVoto->bind_result($votou);
                $stmtVoto->fetch();
                if ($votou) {
                    echo "Esta matrícula já votou.";
                } else {
                    // Atualiza o voto
                    $inserirVoto = "UPDATE votos SET candidato = ?, votou = TRUE WHERE usuario_id = ?";
                    $stmt = $conexao->prepare($inserirVoto);
                    $stmt->bind_param("si", $voto, $matricula);
                    if ($stmt->execute()) {
                        echo "Voto registrado com sucesso!";
                    } else {
                        echo "Erro ao registrar voto: " . $stmt->error;
                    }
                }
            } else {
                // Insere um novo registro de voto
                $inserirVoto = "INSERT INTO votos (usuario_id, candidato, votou) VALUES (?, ?, TRUE)";
                $stmtInserir = $conexao->prepare($inserirVoto);
                $stmtInserir->bind_param("is", $matricula, $voto);
                if ($stmtInserir->execute()) {
                    echo "Voto registrado com sucesso!";
                } else {
                    echo "Erro ao registrar voto: " . $stmtInserir->error;
                }
            }
            $stmtVoto->close();
        } else {
            echo "Matrícula não encontrada!";
        }

        $stmtMatricula->close();
        $conexao->close();
    } else {
        echo "Erro nos parâmetros fornecidos!";
    }
} else {
    echo "Método de requisição inválido!";
}
?>
