CREATE TABLE dados (
    Matricula INT PRIMARY KEY,   -- Identificação única do usuário
    CPF CHAR(11) UNIQUE NOT NULL -- CPF único, com 11 dígitos
);