<?php
    session_start();
    unset($_SESSION['CPF']);
    unset($_SESSION['Matricula']);
    header('Location:index.php');
?>