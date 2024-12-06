

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>login</title>
    <link rel="stylesheet" href="style.css">
    <!-- <style>

        
        body{
    font-family: Arial, Helvetica, sans-serif;
    background-image: linear-gradient(to bottom,white,rgb(99, 241, 99) );
    height: 100vh;
    margin: 0;
    overflow: hidden;
}

#titulo{
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 30px;
  
}
#logo{
    height: 120px;
    top: 40px;
    left: 40px;
    position: absolute;
}



.form {

    background-color: rgba(0, 0,0,0.9);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 80px;
    border-radius: 15%;
    color: white;
}

input{
    padding: 15px;
    border: none;
    outline: none;
    font-size: 15px;
}

.button{

    background-color: dodgerblue;
    border: none;
    padding: 15px;
    width: 100%;
    border-radius: 10px;
    color: white;
    font-size: 15px;
    cursor: pointer;

}
.button:hover{
    background-color: deepskyblue;
}

#fotter{
position: absolute;
bottom: 0;
left: 2%;
}
    </style> -->

    
</head>
<body>

    <h1 class="titulo" >Eleição CIPA 2024</h1>
    <img class="logo" src="img/logo.png" alt="">

    <div class="esquerda">
        <img id="img" src="img/Sem título.png" alt="">
    </div>

    <div class="form">
        <h1>Autenticação:</h1>
        <form action="login.php" method = "POST" >
            <input type="text" name ="CPF" placeholder="CPF" required maxlength="11" minlength="11" autocomplete="off">
             <br> <br>
            <input type="text" name ="Matricula" id="Matricula" placeholder="Matricula" required maxlength="7" minlength="1" autocomplete="off">
            <br> <br>

            <input class="button" type="submit" name = "submit" value = "Login">
        </form>
    </div>


    <footer id="fotter"> <h3>Desenvolvido por Anthony Mederios. Aprendiz de Ti Ferreira Costa Caruaru  </h3></footer>
</body>
</html>