<?php
session_start();

if (isset($_POST['submit']) && !empty($_POST['CPF']) && !empty($_POST['Matricula'])) {
    include_once('config.php');
    $CPF = $_POST['CPF'];
    $Matricula = $_POST['Matricula'];

    // Verifica se a matrícula e o CPF são específicos
    if ($Matricula == '2024' && $CPF == '20122024000') {
        header('Location: gerenciamento.php');
        exit();
    }

    // Verifica se a matrícula já votou
    $verificarVoto = "SELECT votou FROM votos WHERE usuario_id = ?";
    $stmt = $conexao->prepare($verificarVoto);
    $stmt->bind_param("i", $Matricula); // "i" porque Matricula é um inteiro
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo "<script>
                alert('Esta matrícula já votou.');
                window.location.href = 'index.php';
              </script>";
        exit();
    } else {
        // A matrícula ainda não votou, verifica CPF e matrícula no banco
        $sql = "SELECT * FROM dados WHERE CPF = ? AND Matricula = ?";
        $stmtDados = $conexao->prepare($sql);
        $stmtDados->bind_param("si", $CPF, $Matricula); // "si" para CPF (string) e Matricula (int)
        $stmtDados->execute();
        $result = $stmtDados->get_result();

        if ($result->num_rows < 1) {
            unset($_SESSION['CPF']);
            unset($_SESSION['Matricula']);
            header('Location: index.php');
        } else {
            $_SESSION['CPF'] = $CPF;
            $_SESSION['Matricula'] = $Matricula;
            header('Location: voto.php?matricula=' . $Matricula);
        }
    }
}
?>
    